import React, { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, Linking } from "react-native";
import { usePilot } from "./store";
import { dateLabel, fullDate } from "./domain";
import {
  C,
  s,
  Page,
  Title,
  Body,
  Label,
  Avatar,
  Icon,
  Pill,
  Section,
  Button,
  Empty,
  Sheet,
  Stat,
} from "./ui";
import type { Encounter } from "./types";
export function MeetingsScreen({
  onPerson,
  onCapture,
}: {
  onPerson: (id: string) => void;
  onCapture: () => void;
}) {
  const { data, loading, refresh, notify } = usePilot();
  const [view, setView] = useState<"Timeline" | "Events" | "Places">(
    "Timeline",
  );
  const [placeLevel, setPlaceLevel] = useState<"Venue" | "City" | "Country">(
    "City",
  );
  const [days, setDays] = useState(0);
  const [group, setGroup] = useState<string | null>(null);
  const encounters = useMemo(
    () =>
      data.encounters
        .filter(
          (e) =>
            !days ||
            new Date(e.occurredAt).valueOf() >= Date.now() - days * 86400000,
        )
        .sort(
          (a, b) =>
            new Date(b.occurredAt).valueOf() - new Date(a.occurredAt).valueOf(),
        ),
    [data.encounters, days],
  );
  const groups = useMemo(() => {
    const result: Record<string, Encounter[]> = {};
    for (const e of encounters) {
      const label =
        view === "Events"
          ? e.eventName || "Outside an event"
          : placeLevel === "Country"
            ? e.countryCode || "Country not recorded"
            : placeLevel === "Venue"
              ? [e.location, e.city].filter(Boolean).join(" · ") ||
                "Venue not recorded"
              : [e.city, e.countryCode].filter(Boolean).join(" · ") ||
                "City not recorded";
      (result[label] ??= []).push(e);
    }
    return Object.entries(result).sort((a, b) => b[1].length - a[1].length);
  }, [encounters, view, placeLevel]);
  const current = groups.find(([name]) => name === group);
  function row(e: Encounter, compact = false) {
    const p = data.people.find((p) => p.id === e.personId);
    return (
      <Pressable
        key={e.id}
        onPress={() => {
          onPerson(e.personId);
        }}
        style={[s.card, { marginBottom: 13, padding: 19 }]}
      >
        <View style={s.row}>
          <Label>{dateLabel(e.occurredAt, true)}</Label>
          <Pill>{e.meetingType}</Pill>
        </View>
        <View
          style={{
            flexDirection: "row",
            gap: 13,
            alignItems: "center",
            marginTop: 17,
          }}
        >
          <Avatar
            name={p?.name ?? e.name ?? "Connection"}
            url={p?.photoUrl ?? e.photoUrl}
            size={49}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 17,
                fontWeight: "600",
                color: C.ink,
                letterSpacing: -0.3,
              }}
            >
              {p?.name ?? e.name ?? "Connection"}
            </Text>
            <Text style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
              {p?.company ?? e.company}
            </Text>
          </View>
          <Icon name="arrow-forward-outline" size={18} color={C.muted} />
        </View>
        {e.originalNote && (
          <Text
            numberOfLines={compact ? 2 : 3}
            style={{
              color: C.ink,
              fontSize: 14,
              lineHeight: 22,
              marginTop: 15,
            }}
          >
            {e.originalNote}
          </Text>
        )}
        <View
          style={{
            flexDirection: "row",
            gap: 6,
            alignItems: "center",
            marginTop: 14,
          }}
        >
          <Icon
            name={e.eventName ? "ticket-outline" : "location-outline"}
            size={14}
            color={C.muted}
          />
          <Text
            numberOfLines={2}
            style={{ fontSize: 11, color: C.muted, flex: 1 }}
          >
            {[e.eventName, e.location, e.city, e.countryCode]
              .filter(Boolean)
              .join(" · ") || "Place not recorded"}
          </Text>
        </View>
      </Pressable>
    );
  }
  return (
    <Page refreshing={loading} onRefresh={() => void refresh()}>
      <Label>A MEMORY FOR EVERY INTRODUCTION</Label>
      <View style={[s.row, { marginTop: 12 }]}>
        <Title>We met here.</Title>
        <Pressable
          onPress={onCapture}
          accessibilityRole="button"
          accessibilityLabel="Add a meeting"
          style={{
            width: 44,
            height: 44,
            backgroundColor: C.teal,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="add" color={C.white} />
        </Pressable>
      </View>
      <Body muted style={{ marginTop: 11 }}>
        The people. The places. The possibility.
      </Body>
      <View
        style={{
          flexDirection: "row",
          gap: 9,
          marginTop: 25,
          marginBottom: 17,
        }}
      >
        {(["Timeline", "Events", "Places"] as const).map((v) => (
          <Pill
            key={v}
            active={view === v}
            onPress={() => {
              setView(v);
              setGroup(null);
            }}
            icon={
              v === "Timeline"
                ? "time-outline"
                : v === "Events"
                  ? "ticket-outline"
                  : "location-outline"
            }
          >
            {v}
          </Pill>
        ))}
      </View>
      {view === "Places" && (
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 18 }}>
          {(["Venue", "City", "Country"] as const).map((level) => (
            <Pill
              key={level}
              active={placeLevel === level}
              onPress={() => {
                setPlaceLevel(level);
                setGroup(null);
              }}
            >
              {level}
            </Pill>
          ))}
        </View>
      )}
      <View style={[s.row, { marginBottom: 21 }]}>
        <Label>{encounters.length} MEETINGS REMEMBERED</Label>
        <View style={{ flexDirection: "row", gap: 13 }}>
          {[
            [0, "All"],
            [7, "7d"],
            [30, "30d"],
          ].map(([d, label]) => (
            <Pressable key={d} onPress={() => setDays(d as number)}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: days === d ? "700" : "400",
                  color: days === d ? C.teal : C.muted,
                }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {view === "Timeline"
        ? encounters.map((e) => row(e))
        : groups.map(([name, items], i) => {
            const people = Array.from(new Set(items.map((e) => e.personId)))
              .map((id) => data.people.find((p) => p.id === id))
              .filter(Boolean);
            return (
              <Pressable
                key={name}
                onPress={() => setGroup(name)}
                style={[
                  s.card,
                  {
                    marginBottom: 15,
                    padding: 23,
                    backgroundColor: i === 0 ? C.teal : C.white,
                  },
                ]}
              >
                <View style={s.row}>
                  <View
                    style={{
                      height: 42,
                      width: 42,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 14,
                      backgroundColor: i === 0 ? "#31584A" : C.soft,
                    }}
                  >
                    <Icon
                      name={
                        view === "Events"
                          ? "ticket-outline"
                          : "location-outline"
                      }
                      color={i === 0 ? C.lime : C.teal}
                    />
                  </View>
                  <Icon
                    name="arrow-up-right-box-outline"
                    color={i === 0 ? C.lime : C.muted}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 23,
                    lineHeight: 29,
                    fontWeight: "500",
                    letterSpacing: -0.5,
                    color: i === 0 ? C.white : C.ink,
                    marginTop: 20,
                  }}
                >
                  {name}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: i === 0 ? "#BCD0C2" : C.muted,
                    marginTop: 10,
                  }}
                >
                  {items.length} meeting{items.length === 1 ? "" : "s"} ·{" "}
                  {people.length} people · {dateLabel(items[0].occurredAt)}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    marginTop: 21,
                    alignItems: "center",
                  }}
                >
                  {people.slice(0, 5).map((p, j) => (
                    <View
                      key={p!.id}
                      style={{
                        marginLeft: j ? -9 : 0,
                        borderWidth: 3,
                        borderColor: i === 0 ? C.teal : C.white,
                        borderRadius: 24,
                      }}
                    >
                      <Avatar name={p!.name} url={p!.photoUrl} size={35} />
                    </View>
                  ))}
                  {people.length > 5 && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: i === 0 ? C.white : C.muted,
                        marginLeft: 8,
                      }}
                    >
                      +{people.length - 5}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
      {!encounters.length && (
        <Empty
          icon="map-outline"
          title="Remember where it started"
          body="Your next coffee, conference or chance conversation can live here with the person and the context."
          action="Log a meeting"
          onPress={onCapture}
        />
      )}
      <Sheet
        visible={Boolean(group)}
        title={group ?? ""}
        subtitle={
          current
            ? `${current[1].length} meetings · ${new Set(current[1].map((e) => e.personId)).size} people`
            : undefined
        }
        onClose={() => setGroup(null)}
      >
        {current && (
          <>
            {view === "Places" && (
              <Button
                tone="secondary"
                icon="map-outline"
                onPress={() => {
                  const e = current[1].find((e) => (e as any).latitude != null);
                  const q = e
                    ? `${(e as any).latitude},${(e as any).longitude}`
                    : group;
                  void Linking.openURL(
                    "https://www.google.com/maps/search/?api=1&query=" +
                      encodeURIComponent(q ?? ""),
                  ).catch(() => notify("No maps app is available."));
                }}
                style={{ marginBottom: 20 }}
              >
                Open this place in Maps
              </Button>
            )}
            {current[1].map((e) => row(e, true))}
          </>
        )}
      </Sheet>
    </Page>
  );
}
