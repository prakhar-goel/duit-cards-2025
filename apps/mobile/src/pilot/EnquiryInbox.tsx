import React, { useState } from "react";
import { View, Pressable, Linking } from "react-native";
import { usePilot } from "./store";
import { patch } from "./api";
import { dateLabel } from "./domain";
import { Sheet, Title, Body, Pill, Button, Label, Empty, s } from "./ui";
export function EnquiryInbox({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { data, refresh, notify } = usePilot();
  const [selected, setSelected] = useState<string | null>(null);
  const lead = data.leads.find((l) => l.id === selected);
  return (
    <Sheet
      visible={visible}
      title={lead?.name || "Your inbox"}
      onClose={() => {
        if (selected) setSelected(null);
        else onClose();
      }}
    >
      {lead ? (
        <>
          <Label>{dateLabel(lead.createdAt, true)}</Label>
          <Title size={25} style={{ marginVertical: 15 }}>
            {lead.cardTitle}
          </Title>
          <Body>
            {lead.intent || "They would like to talk about your business."}
          </Body>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginVertical: 24,
            }}
          >
            {["new", "responded", "qualified", "closed"].map((status) => (
              <Pill
                key={status}
                active={lead.status === status}
                onPress={() =>
                  void patch(`/leads/${lead.id}`, { status })
                    .then(refresh)
                    .catch((e) => notify(e.message))
                }
              >
                {status}
              </Pill>
            ))}
          </View>
          {lead.phone && (
            <Button
              icon="logo-whatsapp"
              onPress={() =>
                void Linking.openURL(
                  `https://wa.me/${lead.phone!.replace(/\D/g, "")}`,
                ).catch(() => notify("No messaging app is available."))
              }
            >
              WhatsApp reply
            </Button>
          )}
          {lead.email && (
            <Button
              tone="secondary"
              icon="mail-outline"
              onPress={() =>
                void Linking.openURL(`mailto:${lead.email}`).catch(() =>
                  notify("No email app is available."),
                )
              }
            >
              Email reply
            </Button>
          )}
        </>
      ) : data.leads.length ? (
        data.leads.map((l) => (
          <Pressable
            key={l.id}
            onPress={() => setSelected(l.id)}
            style={[s.card, { marginBottom: 14 }]}
          >
            <Label>
              {l.status === "new" ? "NEW · " : ""}
              {dateLabel(l.createdAt, true)}
            </Label>
            <Title size={21} style={{ marginTop: 10 }}>
              {l.name}
            </Title>
            <Body muted style={{ marginTop: 8 }}>
              {l.intent}
            </Body>
          </Pressable>
        ))
      ) : (
        <Empty
          icon="mail-outline"
          title="The conversation starts here"
          body="When someone responds to your card, their message appears here."
        />
      )}
    </Sheet>
  );
}
