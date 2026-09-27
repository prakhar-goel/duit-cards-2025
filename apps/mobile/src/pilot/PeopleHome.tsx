import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, FlatList, ScrollView } from "react-native";
import { usePilot } from "./store";
import { get } from "./api";
import { dateLabel } from "./domain";
import {
  filterPeople,
  parseMeetingQuery,
  exchangeDirection,
  countryName,
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
  SearchBox,
  Empty,
  Sheet,
  Button,
  Field,
  Notice,
} from "./ui";
import { CardStory, CardArtwork } from "./CardStory";
import { AIReview } from "./AI";
import type { Card } from "./types";

function completeDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(value + "T00:00:00").valueOf())
  );
}
export function PeopleHome({
  onPerson,
  onCapture,
  onCreate,
}: {
  onPerson: (id: string) => void;
  onCapture: () => void;
  onCreate: () => void;
}) {
  const { data, loading, refresh, offline, error } = usePilot();
  const [query, setQuery] = useState("");
  const [direction, setDirection] = useState("");
  const [dates, setDates] = useState("");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [place, setPlace] = useState("");
  const [event, setEvent] = useState("");
  const [country, setCountry] = useState("");
  const [leadOnly, setLeadOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [ask, setAsk] = useState(false);
  const [examples, setExamples] = useState<Card[]>([]);
  const [example, setExample] = useState<Card | null>(null);
  const filters = useMemo(
    () => ({
      ...parseMeetingQuery(query + " " + dates),
      ...(direction ? { direction } : {}),
      ...(completeDate(from)
        ? { from: new Date(from + "T00:00:00").toISOString() }
        : {}),
      ...(completeDate(until)
        ? {
            before: new Date(
              new Date(until + "T00:00:00").valueOf() + 86400000,
            ).toISOString(),
          }
        : {}),
      place,
      country,
      event,
      leadOnly: leadOnly || parseMeetingQuery(query).leadOnly,
    }),
    [query, dates, direction, from, until, place, country, event, leadOnly],
  );
  const rows = useMemo(
    () => filterPeople(data.people, data.encounters, filters),
    [data.people, data.encounters, filters],
  );
  useEffect(() => {
    if (!data.people.length)
      void get("/examples/cards")
        .then((r) => setExamples(r.cards || []))
        .catch(() => {});
  }, [data.people.length]);
  const countries = [
    ...new Set(data.encounters.map((e) => e.countryCode).filter(Boolean)),
  ] as string[];
  const activeFilters = Boolean(
    dates || from || until || place || country || event || leadOnly,
  );
  const header = (
    <>
      <View style={s.row}>
        <Title>Your people.</Title>
        <Button small tone="quiet" icon="scan-outline" onPress={onCapture}>
          Add
        </Button>
      </View>
      <Body muted style={{ marginTop: 8, marginBottom: 20 }}>
        {data.people.length
          ? `${data.people.length} connections. Every hello, remembered.`
          : "Your next connection starts here."}
      </Body>
      {!data.cards.length && (
        <View style={{ marginBottom: 20 }}>
          <Button onPress={onCreate} icon="id-card-outline">
            Create my card
          </Button>
        </View>
      )}
      {offline && <Notice>Showing saved people. Reconnect to refresh.</Notice>}
      {!!error && !offline && <Notice error>{error}</Notice>}
      <SearchBox
        value={query}
        onChange={setQuery}
        placeholder="Last week in Gurgaon, January 2026, Brazil…"
        onSubmit={() => {}}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 16 }}
      >
        <Pill
          active={activeFilters}
          icon="options-outline"
          onPress={() => setFiltersOpen(true)}
        >
          Filters
        </Pill>
        {[
          ["", "Everyone"],
          ["incoming", "Received"],
          ["outgoing", "Shared"],
        ].map(([value, title]) => (
          <Pill
            key={title}
            active={direction === value}
            onPress={() => setDirection(value)}
          >
            {title}
          </Pill>
        ))}
      </ScrollView>
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
      {filters.from && (
        <Text style={[s.hint, { marginBottom: 12 }]}>
          {dateLabel(filters.from)} –{" "}
          {dateLabel(
            new Date(
              new Date(filters.before || Date.now()).valueOf() - 1,
            ).toISOString(),
          )}
        </Text>
      )}
      {!data.people.length && examples.length > 0 && (
        <>
          <Title size={23} style={{ marginTop: 16 }}>
            A few introductions.
          </Title>
          <Body muted style={{ marginTop: 8, marginBottom: 18 }}>
            Explore what a card can do. Your own connections will appear here
            when you share or save one.
          </Body>
          {examples.slice(0, 6).map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={`Open ${c.title}'s card`}
              onPress={() => setExample(c)}
              style={[
                s.card,
                { marginBottom: 20, padding: 0, overflow: "hidden" },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 16,
                }}
              >
                <Avatar name={c.title} url={c.imageUrl} size={48} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: C.ink, fontSize: 17, fontWeight: "700" }}
                  >
                    {c.title}
                  </Text>
                  <Body muted>{c.company}</Body>
                </View>
              </View>
              <CardArtwork
                uri={c.businessCardUrl}
                name={c.title}
                company={c.company}
                role={c.role}
                height={180}
              />
              <Body style={{ padding: 16 }}>{c.subtitle}</Body>
            </Pressable>
          ))}
        </>
      )}
    </>
  );
  return (
    <>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.person.id}
        contentContainerStyle={s.page}
        ListHeaderComponent={header}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        refreshing={loading}
        onRefresh={() => void refresh()}
        ListEmptyComponent={
          data.people.length ? (
            <Empty
              icon="search-outline"
              title="No matching meetings"
              body="Try another place or date, or clear the filters."
            />
          ) : undefined
        }
        renderItem={({ item: { person: p, meeting } }) => {
          const d =
            exchangeDirection(meeting?.exchangeType) ||
            (p.cardSlug ? "incoming" : "");
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${p.name}'s card`}
              onPress={() => onPerson(p.id)}
              style={({ pressed }) => [
                s.card,
                {
                  padding: 0,
                  overflow: "hidden",
                  marginBottom: 20,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 16,
                }}
              >
                <Avatar name={p.name} url={p.photoUrl} size={51} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 18, fontWeight: "700", color: C.ink }}
                  >
                    {p.name}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{ color: C.muted, fontSize: 13, marginTop: 4 }}
                  >
                    {[p.role, p.company].filter(Boolean).join(" · ")}
                  </Text>
                </View>
                <Icon
                  name={
                    d === "outgoing"
                      ? "arrow-up-outline"
                      : d === "incoming"
                        ? "arrow-down-outline"
                        : "swap-vertical-outline"
                  }
                  size={20}
                />
              </View>
              {p.businessCardUrl && (
                <CardArtwork
                  uri={p.businessCardUrl}
                  name={p.name}
                  company={p.company}
                  role={p.role}
                  height={185}
                />
              )}
              <View style={{ padding: 16, gap: 7 }}>
                <Text
                  style={{ fontSize: 12, color: C.teal, fontWeight: "700" }}
                >
                  {d === "outgoing"
                    ? "Shared my card"
                    : d === "incoming"
                      ? "Received their card"
                      : d === "both"
                        ? "Exchanged cards"
                        : "Connection"}
                  {meeting ? ` · ${dateLabel(meeting.occurredAt, true)}` : ""}
                </Text>
                {meeting && (
                  <Text
                    style={{ color: C.muted, fontSize: 13, lineHeight: 19 }}
                  >
                    {[
                      meeting.eventName,
                      meeting.location,
                      meeting.city,
                      countryName(meeting.countryCode),
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Place not recorded"}
                  </Text>
                )}
                {(meeting?.originalNote || p.bio) && (
                  <Text
                    numberOfLines={2}
                    style={{ color: C.ink, fontSize: 14, lineHeight: 21 }}
                  >
                    {meeting?.originalNote || p.bio}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        }}
      />
      <Sheet
        visible={filtersOpen}
        title="Find that hello"
        onClose={() => setFiltersOpen(false)}
        footer={
          <Button onPress={() => setFiltersOpen(false)}>
            Show {rows.length} people
          </Button>
        }
      >
        <Label>WHEN</Label>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginVertical: 15,
          }}
        >
          {["", "Today", "Last week", "Last month"].map((value) => (
            <Pill
              key={value}
              active={dates === value}
              onPress={() => {
                setDates(value);
                setFrom("");
                setUntil("");
              }}
            >
              {value || "Any time"}
            </Pill>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Field
            style={{ flex: 1 }}
            label="From"
            value={from}
            onChangeText={(v) => {
              setFrom(v);
              setDates("");
            }}
            placeholder="2026-01-01"
          />
          <Field
            style={{ flex: 1 }}
            label="Through"
            value={until}
            onChangeText={(v) => {
              setUntil(v);
              setDates("");
            }}
            placeholder="2026-01-31"
          />
        </View>
        <Field
          label="Place or city"
          value={place}
          onChangeText={setPlace}
          placeholder="Gurgaon, Paris, a café…"
        />
        <Field
          label="Event"
          value={event}
          onChangeText={setEvent}
          placeholder="Startup summit"
        />
        <Label>COUNTRY</Label>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginVertical: 16,
          }}
        >
          <Pill active={!country} onPress={() => setCountry("")}>
            Anywhere
          </Pill>
          {countries.map((c) => (
            <Pill key={c} active={country === c} onPress={() => setCountry(c)}>
              {countryName(c)}
            </Pill>
          ))}
        </View>
        <Pill
          active={leadOnly}
          icon={leadOnly ? "checkbox" : "square-outline"}
          onPress={() => setLeadOnly(!leadOnly)}
        >
          Potential leads
        </Pill>
        <Button
          tone="quiet"
          onPress={() => {
            setCountry("");
            setPlace("");
            setEvent("");
            setLeadOnly(false);
            setDates("");
            setFrom("");
            setUntil("");
            setDirection("");
            setQuery("");
          }}
        >
          Clear filters
        </Button>
      </Sheet>
      <Sheet
        visible={Boolean(example)}
        title={example?.title || ""}
        onClose={() => setExample(null)}
      >
        {example && <CardStory card={example} initialPage="Person" />}
      </Sheet>
      {ask && (
        <AIReview
          visible
          task="network_search"
          title="Find the right connection"
          input={{ query, filters: { ...filters, terms: undefined } }}
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
