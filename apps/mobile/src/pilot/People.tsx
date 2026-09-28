import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, Linking } from "react-native";
import { usePilot } from "./store";
import { get, post, patch, getServer } from "./api";
import { camel, dateLabel, searchPeople } from "./domain";
import type { Person, Encounter, Commitment, Card } from "./types";
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
import {
  CardStory,
  WalletTile,
  StoryDock,
  type StoryAction,
} from "./CardStory";
const publicCardCache = new Map<string, { card: Card; at: number }>();

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
export { PeopleHome as PeopleScreen } from "./PeopleHome";
export function PersonDetail({
  suspended = false,
  id,
  onClose,
  onCapture,
}: {
  id: string | null;
  suspended?: boolean;
  onClose: () => void;
  onCapture: (person: Person) => void;
}) {
  const { data, refresh, notify, offline } = usePilot();
  const [detail, setDetail] = useState<{
    person: Person;
    encounters: Encounter[];
    commitments: Commitment[];
  } | null>(null);
  const [error, setError] = useState("");
  const [allMeetings, setAllMeetings] = useState(false);
  const [dock, setDock] = useState<StoryAction | null>(null);
  const [publishedCard, setPublishedCard] = useState<Card | null>(null);
  const [galleryAttempt, setGalleryAttempt] = useState(0);
  const [galleryState, setGalleryState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [busy, setBusy] = useState(false);
  const [aiTask, setAiTask] = useState("");
  const [reminder, setReminder] = useState("");
  const [addingReminder, setAddingReminder] = useState(false);
  async function load() {
    if (!id) return;
    const saved = data.people.find((p) => p.id === id);
    if (saved)
      setDetail({
        person: saved,
        encounters: data.encounters.filter((e) => e.personId === id),
        commitments: data.commitments.filter((c) => c.personId === id),
      });
    if (offline) return;
    try {
      const result = camel<any>(await get(`/people/${id}`));
      setDetail(result);
      setError("");
    } catch (e) {
      if (!saved)
        setError(
          e instanceof Error ? e.message : "This person could not be loaded.",
        );
    }
  }
  useEffect(() => {
    setDetail(null);
    setDock(null);
    setAddingReminder(false);
    setAiTask("");
    setAllMeetings(false);
    setPublishedCard(null);
    setError("");
    if (id) void load();
  }, [id]);
  useEffect(() => {
    if (id) void load();
  }, [data.updatedAt]);
  const p = detail?.person ?? data.people.find((x) => x.id === id);
  useEffect(() => {
    let active = true;
    const key = `${getServer()}:${p?.cardSlug}`;
    const saved = data.walletCards?.find((c) => c.slug === p?.cardSlug);
    const cached = saved
      ? { card: saved, at: Date.now() }
      : publicCardCache.get(key);
    setPublishedCard(cached?.card || null);
    setGalleryState(cached || !p?.cardSlug ? "ready" : "loading");
    if (
      !offline &&
      p?.cardSlug &&
      (!cached || Date.now() - cached.at > 60000 || galleryAttempt)
    )
      void get(`/public/cards/${encodeURIComponent(p.cardSlug)}`)
        .then((r) => {
          if (!active) return;
          setPublishedCard(r.card);
          setGalleryState("ready");
          if (publicCardCache.size >= 40)
            publicCardCache.delete(publicCardCache.keys().next().value!);
          publicCardCache.set(key, { card: r.card, at: Date.now() });
        })
        .catch(() => {
          if (active && !cached) setGalleryState("error");
        });
    return () => {
      active = false;
    };
  }, [p?.cardSlug, galleryAttempt, data.walletCards, offline]);

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
        edgeToEdge
        title={p?.name || "Card wallet"}
        onClose={onClose}
        footer={<StoryDock action={dock} />}
      >
        {!!error && <Notice error>{error}</Notice>}
        {p?.cardSlug && galleryState === "error" && (
          <Notice
            error
            action="Retry"
            onPress={() => setGalleryAttempt((n) => n + 1)}
          >
            The business gallery could not load. Your saved card is still here.
          </Notice>
        )}
        {p?.cardSlug && galleryState === "loading" && (
          <Text style={{ padding: 12, color: C.muted, fontSize: 12 }}>
            Loading the business gallery…
          </Text>
        )}
        {p && (
          <View>
            <CardStory
              immersive
              onDockChange={setDock}
              person={p}
              card={publishedCard}
              visible={!suspended}
            />
          </View>
        )}
        <View style={{ paddingHorizontal: 22, paddingBottom: 28 }}>
          {!p ? (
            <Empty
              title="Loading this connection"
              body="Bringing their story together."
            />
          ) : (
            <>
              {
                <View style={{ marginTop: 24 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    {publishedCard?.theme?.logoUrl && (
                      <RemoteImage
                        uri={publishedCard.theme.logoUrl}
                        contain
                        style={{
                          width: 60,
                          height: 48,
                          backgroundColor: C.white,
                          borderRadius: 8,
                        }}
                      />
                    )}
                    <View style={{ flex: 1 }}>
                      <Label>{p.company || "ABOUT"}</Label>
                      <Text
                        style={{ fontSize: 12, color: C.muted, marginTop: 5 }}
                      >
                        {p.name} · {p.role}
                      </Text>
                    </View>
                  </View>
                  <Body style={{ fontSize: 17, lineHeight: 26, marginTop: 10 }}>
                    {publishedCard?.bio || p.bio}
                  </Body>
                  {publishedCard?.panels
                    ?.filter(
                      (x) =>
                        (x.panelType === "offer" || x.panelType === "proof") &&
                        x.body.trim() !==
                          (publishedCard?.bio || p.bio || "").trim() &&
                        x.body.trim() !==
                          (publishedCard?.contact?.address || "").trim(),
                    )
                    .map((x) => (
                      <View key={x.panelType} style={{ marginTop: 18 }}>
                        <Label>
                          {x.panelType === "offer"
                            ? "WHAT WE CAN DO TOGETHER"
                            : "DETAILS"}
                        </Label>
                        <Body muted style={{ marginTop: 7 }}>
                          {x.body}
                        </Body>
                      </View>
                    ))}
                  <View style={{ gap: 9, marginTop: 22 }}>
                    <Label>CONTACT</Label>
                    {[
                      [
                        "call-outline",
                        publishedCard?.contact?.phone || p.phone,
                      ],
                      [
                        "mail-outline",
                        publishedCard?.contact?.email || p.email,
                      ],
                      [
                        "globe-outline",
                        publishedCard?.contact?.website || p.website,
                      ],
                      ["location-outline", publishedCard?.contact?.address],
                    ]
                      .filter(([, value]) => !!value)
                      .map(([icon, value]) => (
                        <View
                          key={icon}
                          style={{
                            flexDirection: "row",
                            gap: 10,
                            alignItems: "center",
                          }}
                        >
                          <Icon name={icon as any} size={17} />
                          <Text
                            selectable
                            style={{
                              color: C.ink,
                              fontSize: 13,
                              lineHeight: 19,
                              flex: 1,
                            }}
                          >
                            {value}
                          </Text>
                        </View>
                      ))}
                  </View>
                  <Text style={{ fontSize: 12, color: C.muted, marginTop: 18 }}>
                    {[p.role, p.city, p.countryCode]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
              }
              <Section
                title={`Meetings · ${detail?.encounters.length ?? p.encounterCount ?? 0}`}
                action="Add meeting"
                onPress={() => onCapture(p)}
              >
                {detail?.encounters.length ? (
                  detail.encounters
                    .slice(0, allMeetings ? undefined : 1)
                    .map((e) => (
                      <View
                        key={e.id}
                        style={{
                          paddingVertical: 16,
                          borderBottomWidth: 1,
                          borderColor: C.line,
                        }}
                      >
                        <View style={s.row}>
                          <Label>{dateLabel(e.occurredAt, true)}</Label>
                          <Icon
                            name="location-outline"
                            size={17}
                            color={C.muted}
                          />
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
                        {(e.location || e.city || e.countryCode) && (
                          <Text style={s.hint}>
                            {[e.location, e.city, e.countryCode]
                              .filter(Boolean)
                              .join(" · ")}
                          </Text>
                        )}
                        {e.latitude != null && e.longitude != null && (
                          <Button
                            tone="quiet"
                            small
                            icon="map-outline"
                            onPress={() =>
                              void Linking.openURL(
                                `https://www.google.com/maps/search/?api=1&query=${e.latitude},${e.longitude}`,
                              ).catch(() => notify("Could not open Maps."))
                            }
                          >
                            View map
                          </Button>
                        )}
                        <Body style={{ marginTop: 12 }}>
                          {e.originalNote ||
                            "No note was added for this meeting."}
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
                    Add a meeting to remember when and where you connected.
                  </Body>
                )}
                {(detail?.encounters.length ?? 0) > 1 && (
                  <Button
                    small
                    tone="quiet"
                    onPress={() => setAllMeetings(!allMeetings)}
                  >
                    {allMeetings
                      ? "Show latest"
                      : `View all ${detail?.encounters.length} meetings`}
                  </Button>
                )}
              </Section>
              <Section
                title="Next steps"
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
              <Button
                small
                tone="quiet"
                icon="sparkles-outline"
                onPress={() => setAiTask("followup_draft")}
              >
                Draft follow-up
              </Button>
              {p.createdAt && (
                <Text style={[s.hint, { marginTop: 24 }]}>
                  Added {dateLabel(p.createdAt)} · Only you can see your notes.
                </Text>
              )}
            </>
          )}
        </View>
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
