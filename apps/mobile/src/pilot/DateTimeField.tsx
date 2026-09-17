import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  C,
  s,
  Body,
  Button,
  CircleButton,
  Field,
  Icon,
  Notice,
  Sheet,
} from "./ui";
export function DateTimeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const initial = new Date(value);
  const [selected, setSelected] = useState(initial);
  const [month, setMonth] = useState(
    new Date(initial.getFullYear(), initial.getMonth(), 1),
  );
  const [time, setTime] = useState("");
  const [error, setError] = useState("");
  function begin() {
    const d = new Date(value);
    setSelected(d);
    setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setTime(
      String(d.getHours()).padStart(2, "0") +
        ":" +
        String(d.getMinutes()).padStart(2, "0"),
    );
    setError("");
    setOpen(true);
  }
  function save() {
    const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) {
      setError("Use a time such as 14:30.");
      return;
    }
    const d = new Date(selected);
    d.setHours(Number(match[1]), Number(match[2]), 0, 0);
    onChange(d.toISOString());
    setOpen(false);
  }
  const offset = (month.getDay() + 6) % 7;
  const count = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const cells = Array.from(
    { length: Math.ceil((offset + count) / 7) * 7 },
    (_, i) => (i >= offset && i < offset + count ? i - offset + 1 : null),
  );
  return (
    <>
      <View style={{ marginBottom: 20 }}>
        <Text style={s.fieldLabel}>When did you meet?</Text>
        <Pressable
          onPress={begin}
          accessibilityRole="button"
          accessibilityLabel="Choose meeting date and time"
          style={[s.input, s.row]}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.ink, fontSize: 14 }}>
              {initial.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 5 }}>
              {initial.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              · your local time
            </Text>
          </View>
          <Icon name="calendar-outline" size={21} />
        </Pressable>
      </View>
      <Sheet
        visible={open}
        title="When it happened"
        subtitle="A date is a useful little memory cue."
        onClose={() => setOpen(false)}
        footer={<Button onPress={save}>Save date & time</Button>}
      >
        <View style={[s.row, { marginBottom: 22 }]}>
          <CircleButton
            icon="chevron-back-outline"
            label="Previous month"
            onPress={() =>
              setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
            }
          />
          <Text style={{ fontSize: 18, color: C.ink, fontWeight: "600" }}>
            {month.toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </Text>
          <CircleButton
            icon="chevron-forward-outline"
            label="Next month"
            onPress={() =>
              setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
            }
          />
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
            <Text
              key={"label" + i}
              style={{
                width: "14.2857%",
                textAlign: "center",
                fontSize: 11,
                fontWeight: "600",
                color: C.muted,
                paddingBottom: 13,
              }}
            >
              {day}
            </Text>
          ))}
          {cells.map((day, i) => {
            const active =
              day === selected.getDate() &&
              month.getMonth() === selected.getMonth() &&
              month.getFullYear() === selected.getFullYear();
            return (
              <View key={i} style={{ width: "14.2857%", padding: 3 }}>
                {day ? (
                  <Pressable
                    onPress={() =>
                      setSelected(
                        new Date(month.getFullYear(), month.getMonth(), day),
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel={new Date(
                      month.getFullYear(),
                      month.getMonth(),
                      day,
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    accessibilityState={{ selected: active }}
                    style={{
                      height: 41,
                      borderRadius: 13,
                      backgroundColor: active ? C.teal : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: active ? "700" : "400",
                        color: active ? C.white : C.ink,
                      }}
                    >
                      {day}
                    </Text>
                  </Pressable>
                ) : (
                  <View style={{ height: 41 }} />
                )}
              </View>
            );
          })}
        </View>
        <Button
          tone="quiet"
          small
          onPress={() => {
            const now = new Date();
            setSelected(now);
            setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
          }}
          style={{ alignSelf: "center", marginTop: 15, marginBottom: 24 }}
        >
          Jump to today
        </Button>
        <Field
          label="Time"
          value={time}
          onChangeText={setTime}
          placeholder="14:30"
          keyboardType="numbers-and-punctuation"
          hint="24-hour time, in your current time zone."
        />
        {error && <Notice error>{error}</Notice>}
      </Sheet>
    </>
  );
}
