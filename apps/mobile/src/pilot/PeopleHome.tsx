import React, { useMemo, useState } from "react";
import { View, Text, Pressable, FlatList, TextInput } from "react-native";
import { usePilot } from "./store";
import { dateLabel } from "./domain";
import {
  parseMeetingQuery,
  exchangeDirection,
} from "../../../../packages/meeting-search/index.js";
import {
  C,
  s,
  Title,
  Body,
  Label,
  Avatar,
  Icon,
  Pill,
  Empty,
  Sheet,
  Button,
  Notice,
  RemoteImage,
} from "./ui";
import { CardStory, CardArtwork } from "./CardStory";
import { AIReview } from "./AI";
import {
  networkRows,
  exchangeFilterOptions,
  meetingPlace,
} from "./networkFeedData";
import type { Card, Person, Encounter } from "./types";

export function PeopleHome({
  onPerson,
  onCapture,
  onCreate,
  mode = "cards",
}: {
  onPerson: (id: string) => void;
  onCapture: () => void;
  onCreate: () => void;
  mode?: "cards" | "sent";
}) {
  const {
    data,
    loading,
    refresh,
    offline,
    error,
    pendingExchanges,
    exchange,
    notify,
  } = usePilot();
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState(""),
    [place, setPlace] = useState(""),
    [event, setEvent] = useState(""),
    [country, setCountry] = useState("");
  const [leadOnly, setLeadOnly] = useState(false),
    [filtersOpen, setFiltersOpen] = useState(false),
    [ask, setAsk] = useState(false);
  const [example, setExample] = useState<Card | null>(null);
  const baseRows = useMemo(
    () => networkRows(data.people, data.encounters, mode, { terms: [] }),
    [data.people, data.encounters, mode],
  );
  const scopeIds = new Set(baseRows.map((r) => r.person.id));
  const scope = data.encounters.filter(
    (e) =>
      scopeIds.has(e.personId) &&
      (mode === "cards" ||
        ["outgoing", "both"].includes(exchangeDirection(e.exchangeType))),
  );
  const options = exchangeFilterOptions(scope);
  const filters = useMemo(
    () => ({
      ...parseMeetingQuery(query),
      ...(month
        ? {
            from: new Date(month + "-01T00:00:00").toISOString(),
            before: new Date(
              Number(month.slice(0, 4)),
              Number(month.slice(5)),
              1,
            ).toISOString(),
          }
        : {}),
      ...(place ? { place } : {}),
      ...(event ? { event } : {}),
      ...(country ? { country } : {}),
      leadOnly: leadOnly || parseMeetingQuery(query).leadOnly,
    }),
    [query, month, place, event, country, leadOnly],
  );
  const rows = useMemo(
    () => networkRows(data.people, data.encounters, mode, filters),
    [data.people, data.encounters, mode, filters],
  );
  const active = [month, place, event, country, leadOnly].filter(
    Boolean,
  ).length;
  const cards = useMemo(
    () =>
      new Map(
        [...(data.examples || []), ...(data.walletCards || [])].map((c) => [
          c.slug,
          c,
        ]),
      ),
    [data.examples, data.walletCards],
  );
  type Row = { person: Person; meeting: Encounter | null; example?: Card };
  const visible: Row[] =
    baseRows.length < 5 && mode === "cards" && !query && !active
      ? [
          ...rows,
          ...(data.examples || [])
            .filter(
              (c) =>
                !baseRows.some(
                  (r) =>
                    r.person.cardSlug === c.slug || r.person.cardId === c.id,
                ),
            )
            .slice(0, 8)
            .map((c) => ({
              person: {
                id: c.id,
                name: c.title,
                company: c.company || "",
                role: c.role || "",
                tags: [],
                photoUrl: c.imageUrl,
                businessCardUrl: c.businessCardUrl,
                bio: c.subtitle,
                cardSlug: c.slug,
              },
              meeting: null,
              example: c,
            })),
        ]
      : rows;
  const renderItem = ({ item }: { item: Row }) => {
    const { person: p, meeting } = item;
    const card =
      item.example || (p.cardSlug ? cards.get(p.cardSlug) : undefined);
    const pictures = [
      ...new Set(
        (card?.businessMedia || [])
          .filter((m) => m.type === "image")
          .map((m) => m.url)
          .concat(card?.coverUrl ? [card.coverUrl] : []),
      ),
    ].filter(
      (u) => u && u !== p.businessCardUrl && u !== card?.businessCardUrl,
    );
    const context = meetingPlace(meeting);
    const open = () =>
      item.example ? setExample(item.example) : onPerson(p.id);
    if (mode === "sent")
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View meeting with ${p.name}`}
          onPress={open}
          style={({ pressed }) => ({
            marginHorizontal: 20,
            paddingVertical: 20,
            borderBottomWidth: 1,
            borderColor: C.line,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Avatar name={p.name} url={p.photoUrl} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.ink, fontWeight: "700", fontSize: 17 }}>
                {p.name}
              </Text>
              <Text style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>
                {p.phone || p.company}
              </Text>
            </View>
            <Icon name="arrow-up-right-box-outline" size={17} color={C.muted} />
          </View>
          <Text style={{ color: C.muted, fontSize: 12, marginTop: 12 }}>
            {meeting && dateLabel(meeting.occurredAt, true)}
          </Text>
          {!!context && (
            <Text
              numberOfLines={2}
              style={{
                color: C.ink,
                fontSize: 13,
                lineHeight: 19,
                marginTop: 5,
              }}
            >
              {context}
            </Text>
          )}
          {!!meeting?.originalNote && (
            <Text
              numberOfLines={2}
              style={{
                color: C.muted,
                fontSize: 13,
                lineHeight: 19,
                marginTop: 7,
              }}
            >
              {meeting.originalNote}
            </Text>
          )}
        </Pressable>
      );
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${p.name}'s card`}
        onPress={open}
        style={({ pressed }) => ({
          backgroundColor: C.white,
          marginBottom: 12,
          paddingVertical: 18,
          opacity: pressed ? 0.85 : 1,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: C.line,
        })}
      >
        <View
          style={{
            flexDirection: "row",
            gap: 12,
            alignItems: "center",
            paddingHorizontal: 20,
          }}
        >
          <Avatar name={p.name} url={p.photoUrl || card?.imageUrl} size={48} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: C.ink }}>
              {p.name}
            </Text>
            <Text
              numberOfLines={1}
              style={{ color: C.muted, fontSize: 12, marginTop: 4 }}
            >
              {[p.role, p.company].filter(Boolean).join(" · ")}
            </Text>
          </View>
          <Icon
            name={item.example ? "compass-outline" : "arrow-down-outline"}
            size={16}
            color={C.muted}
          />
        </View>
        {!!(card?.subtitle || p.bio) && (
          <Text
            numberOfLines={2}
            style={{
              paddingHorizontal: 20,
              marginTop: 14,
              marginBottom: 14,
              fontSize: 15,
              lineHeight: 22,
              color: C.ink,
            }}
          >
            {card?.subtitle || p.bio}
          </Text>
        )}
        <View style={{ gap: 3, marginTop: card?.subtitle || p.bio ? 0 : 14 }}>
          <CardArtwork
            uri={card?.businessCardUrl || p.businessCardUrl}
            name={p.name}
            company={p.company}
            role={p.role}
            height={215}
            style={{ borderRadius: 0, borderWidth: 0 }}
          />
          {!!pictures.length && (
            <View style={{ flexDirection: "row", gap: 3, height: 132 }}>
              {pictures.slice(0, 2).map((url, i) => (
                <View key={url} style={{ flex: 1 }}>
                  <RemoteImage
                    uri={url}
                    style={{ width: "100%", height: "100%" }}
                  />
                  {i === 1 && pictures.length > 2 && (
                    <View
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: "#0005",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 26,
                          fontWeight: "600",
                        }}
                      >
                        +{pictures.length - 2}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 20,
            marginTop: 14,
          }}
        >
          <Icon
            name={meeting ? "location-outline" : "id-card-outline"}
            size={14}
            color={C.muted}
          />
          <Text
            numberOfLines={1}
            style={{ flex: 1, color: C.muted, fontSize: 12 }}
          >
            {context || p.company}
          </Text>
          {meeting && (
            <Text style={{ fontSize: 12, color: C.muted }}>
              {dateLabel(meeting.occurredAt)}
            </Text>
          )}
          <Icon name="chevron-forward" size={14} color={C.muted} />
        </View>
      </Pressable>
    );
  };
  return (
    <>
      <FlatList
        key={mode}
        data={visible}
        keyExtractor={(r) => (mode === "sent" ? r.meeting!.id : r.person.id)}
        renderItem={renderItem}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        refreshing={loading}
        onRefresh={() => void refresh()}
        contentContainerStyle={{
          paddingBottom: 32,
          maxWidth: 760,
          width: "100%",
          alignSelf: "center",
        }}
        ListHeaderComponent={
          <View
            style={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 14 }}
          >
            <View style={s.row}>
              <Title>{mode === "sent" ? "Sent." : "Your cards."}</Title>
              {mode === "cards" && (
                <Button
                  small
                  tone="quiet"
                  icon="scan-outline"
                  onPress={onCapture}
                >
                  Add
                </Button>
              )}
            </View>
            {mode === "sent" && (
              <Body muted style={{ marginTop: 8, marginBottom: 12 }}>
                People you shared your card with.
              </Body>
            )}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 9,
                marginTop: 16,
                backgroundColor: C.soft,
                borderRadius: 12,
                paddingHorizontal: 12,
                minHeight: 42,
              }}
            >
              <Icon name="search-outline" size={18} color={C.muted} />
              <TextInput
                accessibilityLabel="Search cards and meetings"
                value={query}
                onChangeText={setQuery}
                placeholder={
                  mode === "sent"
                    ? "Search your shares"
                    : "Search names, places, dates"
                }
                placeholderTextColor={C.muted}
                style={{
                  flex: 1,
                  color: C.ink,
                  fontSize: 14,
                  paddingVertical: 11,
                }}
              />
              {!!query && (
                <Pressable
                  accessibilityLabel="Clear search"
                  onPress={() => setQuery("")}
                >
                  <Icon name="close" size={17} />
                </Pressable>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Filter cards and meetings"
                onPress={() => setFiltersOpen(true)}
                style={{ padding: 5 }}
              >
                <Icon
                  name="options-outline"
                  size={20}
                  color={active ? C.teal : C.muted}
                />
                {active > 0 && (
                  <Text
                    style={{
                      position: "absolute",
                      right: -4,
                      top: -7,
                      color: C.teal,
                      fontSize: 10,
                    }}
                  >
                    {active}
                  </Text>
                )}
              </Pressable>
            </View>
            {!!query.trim() && (
              <Button
                small
                tone="quiet"
                icon="sparkles-outline"
                onPress={() => setAsk(true)}
              >
                Ask DUIT
              </Button>
            )}
            {!!error && !offline && <Notice error>{error}</Notice>}
            {mode === "sent" &&
              pendingExchanges.map((item) => (
                <View key={item.clientId} style={{ paddingVertical: 14 }}>
                  <Body>{item.name}</Body>
                  <Text style={s.hint}>
                    {item.error || "Saved here · waiting to sync"}
                  </Text>
                  {item.error && (
                    <Button
                      small
                      tone="quiet"
                      onPress={() =>
                        void exchange({ ...item, error: undefined }).catch(
                          (e) => notify(e.message),
                        )
                      }
                    >
                      Retry
                    </Button>
                  )}
                </View>
              ))}
            {!data.cards.length && mode === "cards" && (
              <Button tone="quiet" onPress={onCreate}>
                Create my card
              </Button>
            )}
          </View>
        }
        ListEmptyComponent={
          <Empty
            icon={mode === "sent" ? "paper-plane-outline" : "search-outline"}
            title={
              mode === "sent" && !baseRows.length
                ? "Your next hello starts with Share."
                : "No matching cards"
            }
            body={
              baseRows.length
                ? "Try another search or clear your filters."
                : "Cards and meeting details will appear here as you exchange them."
            }
          />
        }
      />
      <Sheet
        visible={filtersOpen}
        title="Find a meeting"
        onClose={() => setFiltersOpen(false)}
        footer={
          <Button onPress={() => setFiltersOpen(false)}>
            Show {rows.length} {mode === "sent" ? "shares" : "cards"}
          </Button>
        }
      >
        <Body muted>
          From your saved {mode === "sent" ? "shares" : "card exchanges"}.
        </Body>
        {options.months.length > 0 && (
          <>
            <Label>WHEN</Label>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginVertical: 12,
              }}
            >
              {options.months.map(([value, count]) => (
                <Pill
                  key={value}
                  active={month === value}
                  onPress={() => setMonth(month === value ? "" : value)}
                >
                  {new Date(value + "-01T12:00:00").toLocaleDateString("en", {
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  · {count}
                </Pill>
              ))}
            </View>
          </>
        )}
        {(["places", "events"] as const).map(
          (key) =>
            options[key].length > 0 && (
              <View key={key}>
                <Label>{key === "places" ? "WHERE" : "EVENT"}</Label>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    marginVertical: 12,
                  }}
                >
                  {options[key].map(([value, count]) => (
                    <Pill
                      key={value}
                      active={(key === "places" ? place : event) === value}
                      onPress={() =>
                        key === "places"
                          ? setPlace(place === value ? "" : value)
                          : setEvent(event === value ? "" : value)
                      }
                    >
                      {value} · {count}
                    </Pill>
                  ))}
                </View>
              </View>
            ),
        )}
        {options.countries.length > 0 && (
          <>
            <Label>COUNTRY</Label>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginVertical: 12,
              }}
            >
              {options.countries.map((c) => (
                <Pill
                  key={c.code}
                  active={country === c.code}
                  onPress={() => setCountry(country === c.code ? "" : c.code)}
                >
                  {c.name} · {c.count}
                </Pill>
              ))}
            </View>
          </>
        )}
        {baseRows.some((r) =>
          /lead|prospect/i.test(r.person.tags.join(" ")),
        ) && (
          <Pill active={leadOnly} onPress={() => setLeadOnly(!leadOnly)}>
            Potential leads
          </Pill>
        )}
        {!scope.length && (
          <Body muted style={{ marginTop: 18 }}>
            Your places, events and dates will appear after your first exchange.
          </Body>
        )}
        <Button
          tone="quiet"
          onPress={() => {
            setMonth("");
            setPlace("");
            setEvent("");
            setCountry("");
            setLeadOnly(false);
            setQuery("");
          }}
        >
          Clear filters
        </Button>
      </Sheet>
      <Sheet
        visible={!!example}
        title={example?.title || ""}
        onClose={() => setExample(null)}
      >
        {example && <CardStory card={example} />}
      </Sheet>
      {ask && (
        <AIReview
          visible
          task="network_search"
          title="Find a connection"
          input={{
            query,
            filters: {
              ...filters,
              terms: undefined,
              ...(mode === "sent" ? { direction: "outgoing" } : {}),
            },
          }}
          onClose={() => setAsk(false)}
          onPerson={(id) => {
            setAsk(false);
            onPerson(id);
          }}
        />
      )}
    </>
  );
}
