import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, Linking } from "react-native";
import { usePilot } from "./store";
import { get, post, patch } from "./api";
import { camel, dateLabel, searchPeople } from "./domain";
import type { Person, Encounter, Commitment } from "./types";
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
  SearchBox,
  Empty,
  Sheet,
  Button,
  Field,
  Notice,
  Divider,
  RemoteImage,
} from "./ui";
import { AIReview } from "./AI";
export function PersonRow({
  person,
  onPress,
  subtitle,
}: {
  person: Person;
  onPress: () => void;
  subtitle?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          gap: 14,
          alignItems: "center",
          paddingVertical: 17,
          borderBottomWidth: 1,
          borderBottomColor: C.line,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Avatar name={person.name} url={person.photoUrl} size={57} />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: C.ink,
            letterSpacing: -0.3,
          }}
        >
          {person.name}
        </Text>
        <Text
          numberOfLines={1}
          style={{ fontSize: 12, lineHeight: 19, color: C.muted, marginTop: 3 }}
        >
          {[person.role, person.company].filter(Boolean).join(" · ") ||
            "New connection"}
        </Text>
        {subtitle && (
          <Text
            numberOfLines={1}
            style={{
              fontSize: 11,
              lineHeight: 17,
              color: C.teal,
              marginTop: 3,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      <Icon name="arrow-up-right-box-outline" size={19} color={C.muted} />
    </Pressable>
  );
}
export function PeopleScreen({
  onPerson,
  onCapture,
}: {
  onPerson: (id: string) => void;
  onCapture: () => void;
}) {
  const { data, loading, refresh } = usePilot();
  const [query, setQuery] = useState("");
  const [ask, setAsk] = useState(false);
  const [filter, setFilter] = useState("All");
  const [country, setCountry] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const allTags = Array.from(new Set(data.people.flatMap((p) => p.tags))).slice(
    0,
    12,
  );
  const countries = Array.from(
    new Set(data.people.map((p) => (p as any).countryCode).filter(Boolean)),
  ) as string[];
  const people = useMemo(
    () =>
      searchPeople(data.people, query).filter(
        (p) =>
          (filter === "All" ||
            p.tags.includes(filter) ||
            (p as any).stage === filter) &&
          (!country || (p as any).countryCode === country),
      ),
    [data.people, query, filter, country],
  );
  async function searchMemory() {
    if (!query.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await post("/search", { query });
      setSearchResults(res.results ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search could not finish.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page refreshing={loading} onRefresh={() => void refresh()}>
      <View style={s.row}>
        <View>
          <Label>THE PEOPLE BEHIND THE POSSIBILITIES</Label>
          <Title style={{ marginTop: 12 }}>
            Your people<Text style={{ color: C.muted }}>.</Text>
          </Title>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add a person"
          onPress={onCapture}
          style={{
            height: 46,
            width: 46,
            borderRadius: 17,
            backgroundColor: C.teal,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="add" color={C.white} />
        </Pressable>
      </View>
      <Body muted style={{ marginTop: 12, marginBottom: 23 }}>
        {data.people.length} connections. Every one has a story.
      </Body>
      <SearchBox
        value={query}
        onChange={(v) => {
          setQuery(v);
          setSearchResults(null);
        }}
        onSubmit={() => void searchMemory()}
        placeholder="Name, company or something you discussed"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 16 }}
      >
        <Pill
          icon="options-outline"
          active={showFilters || Boolean(country)}
          onPress={() => setShowFilters(true)}
        >
          Filters{country ? " · " + country : ""}
        </Pill>
        {["All", ...allTags].map((t) => (
          <Pill
            key={t}
            active={filter === t}
            onPress={() => {
              setFilter(t);
              setSearchResults(null);
            }}
          >
            {t}
          </Pill>
        ))}
      </ScrollView>
      {query.trim() && (
        <Button
          tone="secondary"
          small
          icon="sparkles-outline"
          busy={busy}
          onPress={() => void searchMemory()}
          style={{ alignSelf: "flex-start", marginBottom: 18 }}
        >
          Search meeting memory
        </Button>
      )}
      {query.trim() && (
        <Button
          tone="quiet"
          small
          icon="sparkles-outline"
          onPress={() => setAsk(true)}
          style={{ alignSelf: "flex-start", marginBottom: 12 }}
        >
          Ask DUIT to find a fit
        </Button>
      )}
      {error && <Notice error>{error}</Notice>}
      {searchResults !== null ? (
        <>
          <Label>{searchResults.length} RESULTS FROM YOUR PRIVATE NOTES</Label>
          {searchResults.map((r, i) => (
            <Pressable
              key={r.id + "-" + i}
              onPress={() => onPerson(r.personId ?? r.id)}
              style={[s.card, { marginTop: 12 }]}
            >
              <Label>{r.type}</Label>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "600",
                  color: C.ink,
                  marginTop: 8,
                }}
              >
                {r.title}
              </Text>
              <Body muted style={{ fontSize: 13, marginTop: 8 }}>
                {r.excerpt ?? r.subtitle}
              </Body>
              {r.occurredAt && (
                <Text style={s.hint}>{dateLabel(r.occurredAt)}</Text>
              )}
            </Pressable>
          ))}
          {!searchResults.length && (
            <Empty
              icon="search-outline"
              title="No matches yet"
              body="Try a name, a company, a place or a few words from your conversation."
            />
          )}
        </>
      ) : (
        <>
          <View style={[s.row, { marginTop: 8, marginBottom: 2 }]}>
            <Label>{filter === "All" ? "YOUR NETWORK" : filter}</Label>
            <Text style={{ fontSize: 11, color: C.muted }}>
              {people.length} people
            </Text>
          </View>
          {people.map((p) => (
            <PersonRow
              key={p.id}
              person={p}
              onPress={() => onPerson(p.id)}
              subtitle={
                p.encounterCount
                  ? `${p.encounterCount} meeting${p.encounterCount === 1 ? "" : "s"} · ${dateLabel((p as any).lastMetAt ?? p.lastEncounterAt)}`
                  : p.tags.slice(0, 2).join(" · ")
              }
            />
          ))}
          {!people.length && (
            <Empty
              icon="people-outline"
              title={query ? "Nobody matches just yet" : "It starts with hello"}
              body={
                query
                  ? "Try a broader search or clear your filters."
                  : "Add the next person you meet. A little context now goes a long way later."
              }
              action="Add someone"
              onPress={onCapture}
            />
          )}
        </>
      )}
      <Sheet
        visible={showFilters}
        title="Find the right people"
        onClose={() => setShowFilters(false)}
        footer={
          <Button onPress={() => setShowFilters(false)}>
            Show {people.length} people
          </Button>
        }
      >
        <Label>COUNTRY CODE</Label>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 9,
            marginVertical: 16,
          }}
        >
          <Pill active={!country} onPress={() => setCountry("")}>
            Anywhere
          </Pill>
          {countries.map((c) => (
            <Pill key={c} active={country === c} onPress={() => setCountry(c)}>
              {c}
            </Pill>
          ))}
        </View>
        <Label>RELATIONSHIP</Label>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 9,
            marginVertical: 16,
          }}
        >
          {[
            "All",
            "new",
            "active",
            "promising",
            "customer",
            "partner",
            "archived",
          ].map((t) => (
            <Pill key={t} active={filter === t} onPress={() => setFilter(t)}>
              {t === "All" ? "Any stage" : t}
            </Pill>
          ))}
        </View>
        <Button
          tone="quiet"
          onPress={() => {
            setCountry("");
            setFilter("All");
          }}
        >
          Clear filters
        </Button>
      </Sheet>
      {ask && (
        <AIReview
          visible
          task="network_search"
          title="Who could help with this?"
          input={{ query }}
          onClose={() => setAsk(false)}
          onPerson={onPerson}
        />
      )}
    </Page>
  );
}
export function PersonDetail({
  id,
  onClose,
  onCapture,
}: {
  id: string | null;
  onClose: () => void;
  onCapture: (person: Person) => void;
}) {
  const { data, refresh, notify } = usePilot();
  const [detail, setDetail] = useState<{
    person: Person;
    encounters: Encounter[];
    commitments: Commitment[];
  } | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const [aiTask, setAiTask] = useState("");
  const [reminder, setReminder] = useState("");
  const [addingReminder, setAddingReminder] = useState(false);
  async function load() {
    if (!id) return;
    try {
      const result = camel<any>(await get(`/people/${id}`));
      setDetail(result);
      setEdit(result.person);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "This person could not be loaded.",
      );
    }
  }
  useEffect(() => {
    setDetail(null);
    setEditing(false);
    setError("");
    if (id) void load();
  }, [id]);
  const p = detail?.person ?? data.people.find((x) => x.id === id);
  async function save() {
    if (!p) return;
    setBusy(true);
    try {
      await patch(`/people/${p.id}`, {
        name: edit.name,
        role: edit.role,
        company: edit.company,
        email: edit.email || null,
        phone: edit.phone || null,
        city: edit.city || "",
        bio: edit.bio || "",
        tags: edit.tags ?? [],
        stage: edit.stage,
      });
      setEditing(false);
      await load();
      await refresh();
      notify("Person updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }
  async function complete(c: Commitment) {
    try {
      await patch(`/commitments/${c.id}`, {
        status: c.status === "done" ? "open" : "done",
      });
      await load();
      await refresh();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not update.");
    }
  }
  async function addReminder() {
    if (!id) return;
    setBusy(true);
    try {
      await post("/commitments", {
        personId: id,
        text: reminder,
        dueAt: new Date(Date.now() + 86400000).toISOString(),
      });
      setReminder("");
      setAddingReminder(false);
      await load();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add reminder.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Sheet
        visible={Boolean(id)}
        title={editing ? "Edit person" : "A good connection"}
        onClose={onClose}
        footer={
          editing ? (
            <Button busy={busy} onPress={() => void save()}>
              Save changes
            </Button>
          ) : p ? (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button
                onPress={() => onCapture(p)}
                icon="add-outline"
                style={{ flex: 1 }}
              >
                Log a meeting
              </Button>
              <Button
                tone="secondary"
                onPress={() => setAiTask("followup_draft")}
                icon="sparkles-outline"
              >
                Follow up
              </Button>
            </View>
          ) : undefined
        }
      >
        {error && <Notice error>{error}</Notice>}
        {!p ? (
          <Empty
            title="Loading this connection"
            body="Bringing their story together."
          />
        ) : editing ? (
          <>
            {["name", "role", "company", "email", "phone", "city", "bio"].map(
              (k) => (
                <Field
                  key={k}
                  label={k[0].toUpperCase() + k.slice(1)}
                  value={edit[k] ?? ""}
                  onChangeText={(v) => setEdit({ ...edit, [k]: v })}
                  multiline={k === "bio"}
                />
              ),
            )}
            <Label>RELATIONSHIP STAGE</Label>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 14,
              }}
            >
              {[
                "new",
                "active",
                "promising",
                "customer",
                "partner",
                "archived",
              ].map((stage) => (
                <Pill
                  key={stage}
                  active={edit.stage === stage}
                  onPress={() => setEdit({ ...edit, stage })}
                >
                  {stage}
                </Pill>
              ))}
            </View>
          </>
        ) : (
          <>
            <View
              style={{ alignItems: "center", paddingTop: 4, paddingBottom: 22 }}
            >
              <Avatar name={p.name} url={p.photoUrl} size={112} square />
              <Title size={29} style={{ marginTop: 21, textAlign: "center" }}>
                {p.name}
              </Title>
              <Body muted style={{ marginTop: 7, textAlign: "center" }}>
                {[p.role, p.company].filter(Boolean).join(" at ")}
              </Body>
              {(p as any).city && (
                <Text style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
                  {(p as any).city}
                </Text>
              )}
              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                  marginTop: 18,
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {p.tags?.map((t) => (
                  <Pill key={t}>{t}</Pill>
                ))}
              </View>
              <Button
                small
                tone="quiet"
                onPress={() => setEditing(true)}
                icon="create-outline"
                style={{ marginTop: 10 }}
              >
                Edit details
              </Button>
            </View>
            {(p as any).bio && (
              <View style={s.card}>
                <Label>WHAT THEY DO</Label>
                <Body style={{ marginTop: 12 }}>{(p as any).bio}</Body>
              </View>
            )}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              {p.email && (
                <Button
                  style={{ flex: 1 }}
                  tone="secondary"
                  icon="mail-outline"
                  onPress={() =>
                    void Linking.openURL("mailto:" + p.email).catch(() =>
                      notify("No email app is available."),
                    )
                  }
                >
                  Email
                </Button>
              )}
              {p.phone && (
                <Button
                  style={{ flex: 1 }}
                  tone="secondary"
                  icon="call-outline"
                  onPress={() =>
                    void Linking.openURL("tel:" + p.phone).catch(() =>
                      notify("No phone app is available."),
                    )
                  }
                >
                  Call
                </Button>
              )}
            </View>
            {p.businessCardUrl && (
              <Section title="Their visiting card">
                <RemoteImage
                  uri={p.businessCardUrl}
                  contain
                  style={{
                    height: 220,
                    width: "100%",
                    borderRadius: 18,
                    backgroundColor: C.white,
                  }}
                />
                {p.businessCardBackUrl && (
                  <RemoteImage
                    uri={p.businessCardBackUrl}
                    contain
                    style={{
                      height: 220,
                      width: "100%",
                      borderRadius: 18,
                      backgroundColor: C.white,
                      marginTop: 12,
                    }}
                  />
                )}
              </Section>
            )}
            <Section
              title="Promises & next steps"
              action="Add"
              onPress={() => setAddingReminder(true)}
            >
              {detail?.commitments.length ? (
                detail.commitments.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => void complete(c)}
                    style={[
                      s.row,
                      {
                        paddingVertical: 13,
                        borderBottomWidth: 1,
                        borderColor: C.line,
                        alignItems: "flex-start",
                      },
                    ]}
                  >
                    <Icon
                      name={
                        c.status === "done"
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      color={c.status === "done" ? C.teal : C.muted}
                      size={22}
                    />
                    <View style={{ flex: 1 }}>
                      <Body
                        style={
                          c.status === "done"
                            ? {
                                textDecorationLine: "line-through",
                                color: C.muted,
                              }
                            : undefined
                        }
                      >
                        {c.text}
                      </Body>
                      <Text style={s.hint}>
                        {c.status === "done"
                          ? "Completed"
                          : c.dueAt
                            ? "Due " + dateLabel(c.dueAt)
                            : "No date set"}
                      </Text>
                    </View>
                  </Pressable>
                ))
              ) : (
                <Body muted>
                  No open promises. A perfectly fine place to start.
                </Body>
              )}
            </Section>
            <Section title="Your meeting memory">
              {detail?.encounters.length ? (
                detail.encounters.map((e) => (
                  <View key={e.id} style={[s.card, { marginBottom: 14 }]}>
                    <View style={s.row}>
                      <Label>{dateLabel(e.occurredAt, true)}</Label>
                      <Icon name="location-outline" size={17} color={C.muted} />
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        color: C.ink,
                        fontWeight: "600",
                        marginTop: 10,
                      }}
                    >
                      {e.eventName || e.location || e.meetingType}
                    </Text>
                    {e.eventName && e.location && (
                      <Text style={s.hint}>{e.location}</Text>
                    )}
                    <Body style={{ marginTop: 12 }}>
                      {e.originalNote || "No note was added for this meeting."}
                    </Body>
                    {e.recap && (
                      <View
                        style={{
                          marginTop: 14,
                          padding: 13,
                          backgroundColor: C.soft,
                          borderRadius: 12,
                        }}
                      >
                        <Label>REVIEWED RECAP</Label>
                        <Body style={{ fontSize: 13, marginTop: 6 }}>
                          {e.recap}
                        </Body>
                      </View>
                    )}
                    <Text style={s.hint}>{e.exchangeType}</Text>
                  </View>
                ))
              ) : (
                <Body muted>
                  The next conversation can be the first one you remember here.
                </Body>
              )}
            </Section>
            {p.createdAt && (
              <Text style={[s.hint, { marginTop: 24 }]}>
                Added {dateLabel(p.createdAt)} · Only you can see your notes.
              </Text>
            )}
          </>
        )}
      </Sheet>
      <Sheet
        visible={addingReminder}
        title="Keep a small promise"
        onClose={() => setAddingReminder(false)}
        footer={
          <Button
            busy={busy}
            disabled={!reminder.trim()}
            onPress={() => void addReminder()}
          >
            Remind me tomorrow
          </Button>
        }
      >
        <Field
          label="What will you do?"
          placeholder="Send the product details we discussed"
          multiline
          value={reminder}
          onChangeText={setReminder}
        />
      </Sheet>
      {aiTask && p && (
        <AIReview
          visible
          title="A thoughtful follow-up"
          task="followup_draft"
          input={{
            personId: p.id,
            person: { name: p.name, company: p.company },
            encounters: detail?.encounters.slice(0, 3),
            tone: "warm and concise",
          }}
          onClose={() => setAiTask("")}
          onApply={async (result) => {
            const message = result.message ?? result.draft ?? result.text;
            if (p.phone)
              await Linking.openURL(
                `https://wa.me/${p.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`,
              );
            else if (p.email)
              await Linking.openURL(
                `mailto:${p.email}?body=${encodeURIComponent(message)}`,
              );
            else
              throw new Error(
                "Add an email or phone number before opening a follow-up.",
              );
          }}
        />
      )}
    </>
  );
}
