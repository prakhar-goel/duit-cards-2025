import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { usePilot } from "./store";
import { post } from "./api";
import {
  C,
  Sheet,
  Field,
  Button,
  Notice,
  Avatar,
  Title,
  Body,
  Icon,
} from "./ui";
import type { Card } from "./types";

// Opens from cached account information; no request is needed to display the form.
export function LeadForm({
  card,
  label,
  context,
  onClose,
}: {
  card: Pick<Card, "slug" | "title" | "company" | "imageUrl">;
  label: string;
  context: string;
  onClose: () => void;
}) {
  const { data, session } = usePilot();
  const me = data.user || session?.user;
  const ownCard = data.cards[0];
  const [name, setName] = useState(
    me?.profile?.fullName || me?.name || ownCard?.title || "",
  );
  const [email, setEmail] = useState(
    me?.email || ownCard?.contact?.email || "",
  );
  const [intent, setIntent] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  async function send() {
    if (busy || !consent) return;
    setBusy(true);
    setError("");
    try {
      await post(`/public/cards/${encodeURIComponent(card.slug)}/leads`, {
        name: name.trim(),
        email: email.trim(),
        intent: intent.trim() || label,
        consent: true,
        source: "android-card",
        ctaContext: `${label} · ${context}`.slice(0, 120),
      });
      setSent(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not send. Your details are still here; please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet
      visible
      title={sent ? "You’re connected" : label}
      onClose={onClose}
      footer={
        <Button
          disabled={!sent && (!consent || !name.trim() || !email.includes("@"))}
          busy={busy}
          onPress={sent ? onClose : () => void send()}
        >
          {sent ? "Back to the card" : "Send enquiry"}
        </Button>
      }
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 13,
          marginBottom: 24,
        }}
      >
        <Avatar name={card.title} url={card.imageUrl} size={54} />
        <View style={{ flex: 1 }}>
          <Title size={20}>{card.company || card.title}</Title>
          <Body muted style={{ fontSize: 13, marginTop: 4 }}>
            {context}
          </Body>
        </View>
      </View>
      {sent ? (
        <View style={{ paddingVertical: 36 }}>
          <Icon name="checkmark-circle-outline" size={48} />
          <Title size={28} style={{ marginTop: 20 }}>
            A conversation starts here.
          </Title>
          <Body style={{ marginTop: 12 }}>
            Your enquiry is in {card.title.split(" ")[0]}’s inbox, along with
            the part of their business that caught your eye.
          </Body>
        </View>
      ) : (
        <>
          <Field label="Your name" value={name} onChangeText={setName} />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Field
            label="What do you have in mind? (optional)"
            value={intent}
            onChangeText={setIntent}
            multiline
            placeholder={`Tell ${card.title.split(" ")[0]} a little about what you need`}
          />
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consent }}
            onPress={() => setConsent(!consent)}
            style={{
              flexDirection: "row",
              gap: 12,
              marginTop: 12,
              paddingVertical: 12,
            }}
          >
            <Icon name={consent ? "checkbox" : "square-outline"} size={24} />
            <Text
              style={{ flex: 1, color: C.muted, fontSize: 12, lineHeight: 19 }}
            >
              Share these details with {card.company || card.title} so they can
              respond to this enquiry.
            </Text>
          </Pressable>
          {error && <Notice error>{error}</Notice>}
        </>
      )}
    </Sheet>
  );
}
