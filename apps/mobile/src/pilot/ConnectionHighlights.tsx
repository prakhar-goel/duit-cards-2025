import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { usePilot } from "./store";
import { patch, post } from "./api";
import { dateLabel } from "./domain";
import {
  Avatar,
  Body,
  Button,
  C,
  Field,
  Label,
  Notice,
  Pill,
  Sheet,
  s,
} from "./ui";

export function ConnectionHighlights({
  onPerson,
}: {
  onPerson: (id: string) => void;
}) {
  const { data, refresh, notify } = usePilot();
  const [focus, setFocus] = useState(false);
  const [kind, setKind] = useState<"need" | "offer">("need");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const open = data.commitments.filter((c) => c.status === "open");
  const suggestions = data.feed.filter(
    (f) => f.type === "relevant_person" && f.person,
  );
  async function save() {
    setBusy(true);
    setError("");
    try {
      await post("/need-offers", { kind, text });
      await refresh();
      setText("");
      setFocus(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {open.length > 0 && (
        <View style={{ marginBottom: 18 }}>
          <Label>FOLLOW UP</Label>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingVertical: 12 }}
          >
            {open.map((c) => (
              <View key={c.id} style={[s.card, { width: 270, padding: 16 }]}>
                <Pressable
                  onPress={() => onPerson(c.personId)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${c.name || "connection"}`}
                >
                  <Text style={{ fontWeight: "700", color: C.ink }}>
                    {c.name}
                  </Text>
                  <Body style={{ marginVertical: 8 }}>{c.text}</Body>
                  {c.dueAt && <Body muted>{dateLabel(c.dueAt)}</Body>}
                </Pressable>
                <Button
                  small
                  tone="quiet"
                  onPress={() => {
                    void patch(`/commitments/${c.id}`, { status: "done" })
                      .then(refresh)
                      .catch((e) => notify(e.message));
                  }}
                >
                  Done
                </Button>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      <View style={[s.row, { marginBottom: 10 }]}>
        <Label>YOUR FOCUS</Label>
        <Button small tone="quiet" onPress={() => setFocus(true)}>
          Update
        </Button>
      </View>
      {data.needs
        .filter((n) => n.active)
        .map((n) => (
          <Body key={n.id} muted style={{ marginBottom: 8 }}>
            {n.kind === "need" ? "Looking for" : "Can help with"} · {n.text}
          </Body>
        ))}
      {suggestions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
        >
          {suggestions.map((f, i) => (
            <Pressable
              key={`${f.person!.id}-${i}`}
              onPress={() => onPerson(f.person!.id)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${f.person!.name}`}
              style={[s.card, { width: 260, padding: 16 }]}
            >
              <Avatar
                name={f.person!.name}
                url={f.person!.photoUrl}
                size={42}
              />
              <Text style={{ fontWeight: "700", color: C.ink, marginTop: 10 }}>
                {f.person!.name}
              </Text>
              <Body muted style={{ marginTop: 8 }}>
                {f.reason}
              </Body>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <Sheet
        visible={focus}
        title="What brings you here?"
        onClose={() => setFocus(false)}
        footer={
          <Button
            busy={busy}
            disabled={!text.trim()}
            onPress={() => void save()}
          >
            Save
          </Button>
        }
      >
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
          <Pill active={kind === "need"} onPress={() => setKind("need")}>
            Looking for
          </Pill>
          <Pill active={kind === "offer"} onPress={() => setKind("offer")}>
            Can help with
          </Pill>
        </View>
        <Field
          label={kind === "need" ? "What do you need?" : "What do you offer?"}
          value={text}
          onChangeText={setText}
          multiline
        />
        {!!error && <Notice error>{error}</Notice>}
      </Sheet>
    </>
  );
}
