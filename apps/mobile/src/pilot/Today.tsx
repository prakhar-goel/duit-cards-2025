import React, { useState } from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { usePilot } from "./store";
import { post, patch } from "./api";
import { dateLabel, firstName } from "./domain";
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
  Stat,
  Button,
  Notice,
  Sheet,
  Field,
  Empty,
  Divider,
} from "./ui";
import { PersonRow } from "./People";
export function TodayScreen({
  onPerson,
  onPeople,
  onMyCard,
  onCapture,
}: {
  onPerson: (id: string) => void;
  onPeople: () => void;
  onMyCard: () => void;
  onCapture: () => void;
}) {
  const { data, loading, refresh, notify, offline, queue, sync, error } =
    usePilot();
  const [intent, setIntent] = useState(false);
  const [kind, setKind] = useState<"need" | "offer">("need");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [leadInbox, setLeadInbox] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const profile = data.user?.profile ?? {};
  const name =
    profile.fullName ||
    (data.user as any)?.displayName ||
    data.user?.email.split("@")[0];
  const open = data.commitments.filter((c) => c.status === "open");
  const leads = data.leads.filter((l) => !l.status || l.status === "new");
  const matches = data.feed
    .filter((f) => f.type === "relevant_person")
    .slice(0, 4);
  const selectedLead = data.leads.find((l) => l.id === leadId);
  async function addIntent() {
    setBusy(true);
    try {
      await post("/need-offers", { kind, text });
      await refresh();
      setText("");
      setIntent(false);
      notify("Your focus is saved. Relevant people will appear here.");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not save this focus.");
    } finally {
      setBusy(false);
    }
  }
  async function complete(id: string) {
    try {
      await patch(`/commitments/${id}`, { status: "done" });
      await refresh();
      notify("One small promise, kept.");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not update this promise.");
    }
  }
  return (
    <Page refreshing={loading} onRefresh={() => void refresh()}>
      <View style={s.row}>
        <View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              letterSpacing: 4,
              color: C.ink,
            }}
          >
            DUIT<Text style={{ color: C.teal }}>·</Text>
          </Text>
          <Text style={{ fontSize: 11, color: C.muted, marginTop: 7 }}>
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
        </View>
        <Pressable
          onPress={onMyCard}
          accessibilityRole="button"
          accessibilityLabel="Open my card"
        >
          <Avatar name={name} url={profile.photoUrl} size={45} />
        </Pressable>
      </View>
      <View style={{ marginTop: 33, marginBottom: 23 }}>
        <Title size={35}>Hello, {firstName(name)}.</Title>
        <Body muted style={{ marginTop: 10 }}>
          A good day to move a conversation forward.
        </Body>
      </View>
      {offline && (
        <Notice action="Retry" onPress={() => void sync()}>
          You’re offline. Your saved people and meeting notes are here.
        </Notice>
      )}
      {queue.length > 0 && (
        <Notice action="Sync" onPress={() => void sync()}>
          {queue.length} capture{queue.length === 1 ? "" : "s"} waiting to sync.
          {queue.some((q) => q.error) ? " A capture needs review." : ""}
        </Notice>
      )}
      {error && !offline && (
        <Notice error action="Retry" onPress={() => void refresh()}>
          {error}
        </Notice>
      )}
      <View style={{ backgroundColor: C.teal, borderRadius: 27, padding: 25 }}>
        <View style={s.row}>
          <Label color={C.lime}>SMALL ACTIONS. REAL POSSIBILITIES.</Label>
          <Icon name="arrow-up-right-box-outline" size={24} color={C.lime} />
        </View>
        <Text
          style={{
            color: C.white,
            fontSize: 29,
            fontWeight: "500",
            lineHeight: 35,
            letterSpacing: -1,
            marginTop: 20,
            maxWidth: 310,
          }}
        >
          {open.length
            ? "A hello worth following up."
            : "Your next opportunity starts with a hello."}
        </Text>
        <Text
          style={{
            color: "#B7CEC1",
            fontSize: 13,
            lineHeight: 21,
            marginTop: 12,
            maxWidth: 300,
          }}
        >
          {open.length
            ? `${open.length} open promise${open.length === 1 ? "" : "s"}. Pick one. A thoughtful message beats a forgotten business card.`
            : "Save the person, the place and the thing you promised. Future you will be grateful."}
        </Text>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
          <Stat value={data.people.length} label="people" dark />
          <Stat value={data.encounters.length} label="meetings" dark />
          <Stat value={leads.length} label="new leads" dark />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <Button
          onPress={onCapture}
          tone="secondary"
          icon="scan-outline"
          style={{ flex: 1 }}
        >
          Capture a hello
        </Button>
        <Button
          onPress={() => setLeadInbox(true)}
          tone="secondary"
          icon="file-tray-outline"
          style={{ flex: 1 }}
        >
          Leads{leads.length ? " · " + leads.length : ""}
        </Button>
      </View>
      <Section
        title="Keep the conversation going"
        action={open.length ? "See people" : undefined}
        onPress={onPeople}
      >
        {open.length ? (
          open.slice(0, 3).map((c, index) => {
            const p = data.people.find((p) => p.id === c.personId);
            return (
              <View
                key={c.id}
                style={[s.card, { marginBottom: 11, padding: 18 }]}
              >
                <Pressable
                  onPress={() => onPerson(c.personId)}
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <Avatar
                    name={(c as any).personName ?? p?.name ?? "Connection"}
                    url={p?.photoUrl}
                    size={43}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontWeight: "600", color: C.ink, fontSize: 14 }}
                    >
                      {(c as any).personName ?? p?.name ?? "Connection"}
                    </Text>
                    <Text
                      style={{ fontSize: 11, color: C.muted, marginTop: 4 }}
                    >
                      {c.dueAt
                        ? "Due " + dateLabel(c.dueAt)
                        : "A promise worth keeping"}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => void complete(c.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Mark promise complete"
                    hitSlop={10}
                  >
                    <Icon name="ellipse-outline" size={24} color={C.teal} />
                  </Pressable>
                </Pressable>
                <Body style={{ fontSize: 14, marginTop: 13, lineHeight: 21 }}>
                  {c.text}
                </Body>
              </View>
            );
          })
        ) : (
          <View style={s.card}>
            <Body>No loose ends today.</Body>
            <Body muted style={{ fontSize: 13, marginTop: 7 }}>
              After your next meeting, jot down what you promised. We’ll keep it
              close.
            </Body>
          </View>
        )}
      </Section>
      <Section
        title="What are you working on?"
        action="Add a focus"
        onPress={() => setIntent(true)}
      >
        {data.needs
          .filter((n) => n.active)
          .slice(0, 3)
          .map((n) => (
            <View
              key={n.id}
              style={{
                borderLeftWidth: 3,
                borderLeftColor: n.kind === "need" ? C.lime : C.teal,
                paddingLeft: 15,
                marginBottom: 17,
              }}
            >
              <Label>
                {n.kind === "need" ? "I’M LOOKING FOR" : "I CAN HELP WITH"}
              </Label>
              <Body style={{ marginTop: 7, fontSize: 14 }}>{n.text}</Body>
              <Pressable
                onPress={() =>
                  void patch(`/need-offers/${n.id}`, { active: false })
                    .then(refresh)
                    .catch((e) => notify(e.message))
                }
                accessibilityRole="button"
                style={{ marginTop: 7, alignSelf: "flex-start" }}
              >
                <Text style={{ fontSize: 11, color: C.muted }}>
                  Mark as no longer active
                </Text>
              </Pressable>
            </View>
          ))}
        {!data.needs.some((n) => n.active) && (
          <Pressable
            onPress={() => setIntent(true)}
            style={{
              borderStyle: "dashed",
              borderWidth: 1,
              borderColor: "#BECBBE",
              borderRadius: 20,
              padding: 22,
            }}
          >
            <Icon name="compass-outline" size={25} />
            <Body style={{ marginTop: 12 }}>
              A designer? A distributor? Your next customer?
            </Body>
            <Body muted style={{ fontSize: 13, marginTop: 7 }}>
              Tell DUIT what you need or offer. Your network is a good place to
              start.
            </Body>
          </Pressable>
        )}
      </Section>
      {matches.length > 0 && (
        <Section title="Someone comes to mind">
          {matches.map((f, i) => (
            <Pressable
              key={f.id ?? i}
              onPress={() => f.person && onPerson(f.person.id)}
              style={[s.card, { marginBottom: 12, backgroundColor: "#EEF3E6" }]}
            >
              <View
                style={{ flexDirection: "row", gap: 12, alignItems: "center" }}
              >
                <Avatar
                  name={f.person?.name ?? ""}
                  url={f.person?.photoUrl}
                  size={48}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 16, fontWeight: "600", color: C.ink }}
                  >
                    {f.person?.name}
                  </Text>
                  <Text style={s.hint}>{f.person?.company}</Text>
                </View>
                <Icon name="arrow-forward-outline" size={19} />
              </View>
              <Body style={{ fontSize: 13, marginTop: 15 }}>{f.reason}</Body>
              <Text
                numberOfLines={3}
                style={{
                  fontSize: 11,
                  lineHeight: 17,
                  color: C.muted,
                  marginTop: 8,
                }}
              >
                {Array.isArray(f.evidence)
                  ? (f.evidence as any[]).map((e) => e.text).join(" · ")
                  : f.evidence}
              </Text>
            </Pressable>
          ))}
        </Section>
      )}
      <Section
        title="Recently in your world"
        action="All people"
        onPress={onPeople}
      >
        {data.people.slice(0, 3).map((p) => (
          <PersonRow key={p.id} person={p} onPress={() => onPerson(p.id)} />
        ))}
        {!data.people.length && (
          <Empty
            title="Your people belong here"
            body="Scan a card or add someone from your last good conversation."
            action="Add your first person"
            onPress={onCapture}
          />
        )}
      </Section>
      <Text
        style={{
          color: C.muted,
          fontSize: 10,
          lineHeight: 17,
          textAlign: "center",
          marginTop: 30,
        }}
      >
        Less collecting. More connecting.
        {data.updatedAt
          ? "\nLast synced " + dateLabel(data.updatedAt, true)
          : ""}
      </Text>
      <Sheet
        visible={intent}
        title="Give your network a direction"
        subtitle="A clear need or offer makes introductions more useful."
        onClose={() => setIntent(false)}
        footer={
          <Button
            busy={busy}
            disabled={text.trim().length < 3}
            onPress={() => void addIntent()}
          >
            Save my focus
          </Button>
        }
      >
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 22 }}>
          <Pill active={kind === "need"} onPress={() => setKind("need")}>
            I’m looking for
          </Pill>
          <Pill active={kind === "offer"} onPress={() => setKind("offer")}>
            I can help with
          </Pill>
        </View>
        <Field
          label={kind === "need" ? "What do you need?" : "What do you offer?"}
          value={text}
          onChangeText={setText}
          multiline
          placeholder={
            kind === "need"
              ? "A packaging partner for a new sustainable product"
              : "Product design for teams launching their first app"
          }
        />
        <Notice>
          This is private. DUIT will look through your own people and meeting
          context.
        </Notice>
      </Sheet>
      <Sheet
        visible={leadInbox}
        title="A little interest. A new beginning."
        subtitle={`${data.leads.length} enquiries from your shared cards.`}
        onClose={() => {
          setLeadInbox(false);
          setLeadId(null);
        }}
      >
        {selectedLead ? (
          <>
            <Label>{selectedLead.status ?? "new"} LEAD</Label>
            <Title size={28} style={{ marginTop: 15 }}>
              {selectedLead.name || "New enquiry"}
            </Title>
            <Body muted style={{ marginTop: 8 }}>
              {selectedLead.email || selectedLead.phone}
            </Body>
            <View style={[s.card, { marginTop: 22 }]}>
              <Body>
                {selectedLead.intent || "They would like to connect."}
              </Body>
              <Text style={[s.hint, { marginTop: 14 }]}>
                {dateLabel(selectedLead.createdAt, true)}
              </Text>
            </View>
            <Divider />
            <Label>WHERE DOES THIS STAND?</Label>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 9,
                marginTop: 15,
                marginBottom: 24,
              }}
            >
              {["new", "responded", "qualified", "closed"].map((status) => (
                <Pill
                  key={status}
                  active={selectedLead.status === status}
                  onPress={() =>
                    void patch(`/leads/${selectedLead.id}`, { status })
                      .then(refresh)
                      .catch((e) => notify(e.message))
                  }
                >
                  {status}
                </Pill>
              ))}
            </View>
            {selectedLead.email && (
              <Button
                icon="mail-outline"
                onPress={() =>
                  void Linking.openURL(`mailto:${selectedLead.email}`).catch(
                    () => notify("No email app is available."),
                  )
                }
              >
                Open email reply
              </Button>
            )}
            <Button tone="quiet" onPress={() => setLeadId(null)}>
              Back to all leads
            </Button>
          </>
        ) : data.leads.length ? (
          data.leads.map((l) => (
            <Pressable
              key={l.id}
              onPress={() => setLeadId(l.id)}
              style={[s.card, { marginBottom: 12 }]}
            >
              <View style={s.row}>
                <Text style={{ fontSize: 17, fontWeight: "600", color: C.ink }}>
                  {l.name || "New enquiry"}
                </Text>
                <Pill>{l.status ?? "new"}</Pill>
              </View>
              <Body muted style={{ fontSize: 13, marginTop: 12 }}>
                {l.intent || l.email || l.phone}
              </Body>
              <Text style={s.hint}>{dateLabel(l.createdAt, true)}</Text>
            </Pressable>
          ))
        ) : (
          <Empty
            icon="file-tray-outline"
            title="Your next enquiry has a home"
            body="When someone responds to a shared card, it appears here with the context you need."
          />
        )}
      </Sheet>
    </Page>
  );
}
