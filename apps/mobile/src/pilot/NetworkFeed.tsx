import React, { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, FlatList } from "react-native";
import { usePilot } from "./store";
import { C, s, Avatar, Pill, Title, Body, Icon } from "./ui";
import { CardArtwork } from "./CardStory";
import { dateLabel } from "./domain";
export function NetworkFeed({
  onPerson,
  onFocus,
  header,
  footer,
  refreshing,
  onRefresh,
}: {
  onPerson: (id: string) => void;
  onFocus: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const { data } = usePilot();
  const [filter, setFilter] = useState("For you");
  const items = useMemo(() => {
    const seen = new Set<string>();
    const matches = data.feed
      .filter((f) => f.type === "relevant_person" && f.person)
      .map((f) => {
        const p = data.people.find((p) => p.id === f.person!.id) || f.person!;
        seen.add(p.id);
        return {
          person: p,
          intent: f.intent || "improve",
          reason: f.reason,
          focus: p.bio || f.focus || "",
          label:
            f.intent === "grow"
              ? "Grow your business"
              : "Improve your business",
        };
      });
    const recent = data.people
      .filter((p) => p.businessCardUrl && !seen.has(p.id))
      .slice(0, 60)
      .map((p) => ({
        person: p,
        intent: "network",
        reason: p.company,
        focus: p.bio || "",
        label: "From your network",
      }));
    return [...matches, ...recent].sort(
      (a, b) =>
        Number(
          Boolean(
            b.person.photoUrl && b.person.businessCardUrl && b.person.cardSlug,
          ),
        ) -
          Number(
            Boolean(
              a.person.photoUrl &&
              a.person.businessCardUrl &&
              a.person.cardSlug,
            ),
          ) ||
        Number(b.person.countryCode === "IN") -
          Number(a.person.countryCode === "IN"),
    );
  }, [data.people, data.feed]);
  const meetings = useMemo(() => {
    const map = new Map<string, (typeof data.encounters)[number]>();
    for (const e of data.encounters) {
      if (
        !map.has(e.personId) ||
        e.occurredAt > map.get(e.personId)!.occurredAt
      )
        map.set(e.personId, e);
    }
    return map;
  }, [data.encounters]);
  const visible = items.filter(
    (i) =>
      filter === "For you" ||
      (filter === "Grow"
        ? i.intent === "grow"
        : filter === "Improve"
          ? i.intent === "improve"
          : i.intent === "network"),
  );
  return (
    <FlatList
      data={visible}
      keyExtractor={(item) => item.person.id}
      initialNumToRender={3}
      maxToRenderPerBatch={3}
      windowSize={5}
      updateCellsBatchingPeriod={40}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={s.page}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListHeaderComponent={
        <View>
          {header}
          <View style={{ marginTop: 20 }}>
            <View style={s.row}>
              <Title size={26}>Good for business.</Title>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tune your feed"
                onPress={onFocus}
                style={{ padding: 10 }}
              >
                <Icon name="options-outline" size={22} />
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 18 }}
            >
              {["For you", "Grow", "Improve", "Network"].map((label) => (
                <Pill
                  key={label}
                  active={filter === label}
                  onPress={() => setFilter(label)}
                >
                  {label}
                </Pill>
              ))}
            </ScrollView>
          </View>
        </View>
      }
      ListFooterComponent={<>{footer}</>}
      ListEmptyComponent={
        <Body muted>
          No matches yet. Add what you offer or need to tune your feed.
        </Body>
      }
      renderItem={({ item }) => {
        const p = item.person;
        const meeting = meetings.get(p.id);
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${p.name}’s card`}
            onPress={() => onPerson(p.id)}
            key={p.id}
            style={{
              backgroundColor: C.white,
              borderWidth: 1,
              borderColor: C.line,
              borderRadius: 22,
              overflow: "hidden",
              marginBottom: 22,
            }}
          >
            <View
              style={{
                padding: 17,
                flexDirection: "row",
                alignItems: "center",
                gap: 11,
              }}
            >
              <Avatar name={p.name} url={p.photoUrl} size={42} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: C.ink }}>
                  {p.name}
                </Text>
                <Text style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                  {p.company} · {p.city}
                </Text>
              </View>
              <Icon
                name={
                  item.intent === "grow"
                    ? "trending-up-outline"
                    : item.intent === "improve"
                      ? "bulb-outline"
                      : "people-outline"
                }
                size={21}
              />
            </View>
            <CardArtwork
              uri={p.businessCardUrl}
              name={p.name}
              company={p.company}
              role={p.role}
              height={205}
              style={{ borderRadius: 0, borderWidth: 0 }}
            />
            <View style={{ padding: 18 }}>
              <Text
                style={{
                  color: C.teal,
                  fontSize: 10,
                  letterSpacing: 1,
                  fontWeight: "700",
                }}
              >
                {item.label.toUpperCase()}
              </Text>
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 16,
                  lineHeight: 23,
                  color: C.ink,
                  marginTop: 8,
                }}
              >
                {item.focus}
              </Text>
              {meeting && (
                <View style={{ flexDirection: "row", gap: 5, marginTop: 12 }}>
                  <Icon name="location-outline" size={13} color={C.muted} />
                  <Text
                    numberOfLines={2}
                    style={{
                      flex: 1,
                      fontSize: 11,
                      lineHeight: 16,
                      color: C.muted,
                    }}
                  >
                    {[
                      meeting.eventName,
                      meeting.city || meeting.location,
                      dateLabel(meeting.occurredAt),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      }}
    />
  );
}
