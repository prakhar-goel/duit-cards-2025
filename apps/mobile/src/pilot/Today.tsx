import React, { useState } from "react";
import { View, Text, Pressable, Linking, ScrollView } from "react-native";
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
  Button,
  Notice,
  Sheet,
  Field,
  Empty,
  Divider,
} from "./ui";
import { CardArtwork, WalletTile } from "./CardStory";
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
          <View
            style={{
              flexDirection: "row",
              gap: 3,
              transform: [{ rotate: "-8deg" }],
            }}
          >
            {[0, 1].map((i) => (
              <View key={i} style={{ gap: 3, marginTop: i ? 4 : 0 }}>
                {[0, 1].map((j) => (
                  <View
                    key={j}
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 2,
                      backgroundColor: C.ink,
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
          <Text
            style={{
              fontSize: 31,
              fontWeight: "800",
              letterSpacing: -1.6,
              color: C.ink,
            }}
          >
            duit<Text style={{ color: C.teal }}>.</Text>
          </Text>
        </View>
        <Pressable
          onPress={onMyCard}
          accessibilityRole="button"
          accessibilityLabel="Open my card"
        >
          <Avatar name={name} url={profile.photoUrl} size={42} />
        </Pressable>
      </View>
      {offline && (
        <Notice action="Retry" onPress={() => void sync()}>
          Offline · your saved cards and notes are here.
        </Notice>
      )}
      {queue.length > 0 && (
        <Notice action="Sync" onPress={() => void sync()}>
          {queue.length} capture{queue.length === 1 ? "" : "s"} waiting to sync.
        </Notice>
      )}
      {error && !offline && (
        <Notice error action="Retry" onPress={() => void refresh()}>
          {error}
        </Notice>
      )}
      <View style={{ marginTop: 28, marginBottom: 18 }}>
        <Label>GOOD TO SEE YOU, {firstName(name).toUpperCase()}</Label>
        <Title size={34} style={{ marginTop: 8 }}>
          Your next hello.
        </Title>
      </View>
      <Pressable
        onPress={onMyCard}
        accessibilityRole="button"
        accessibilityLabel="View my business card"
        style={({ pressed }) => [
          {
            borderRadius: 25,
            padding: 18,
            paddingBottom: 13,
            backgroundColor: "#EBE8E0",
          },
          pressed && { opacity: 0.88 },
        ]}
      >
        <View style={{ marginHorizontal: 8, marginTop: 9, marginBottom: 19 }}>
          <View
            style={{
              position: "absolute",
              top: 7,
              left: 3,
              right: 3,
              bottom: -5,
              backgroundColor: "#D2CEC2",
              borderRadius: 10,
              transform: [{ rotate: "-3deg" }],
            }}
          />
          <CardArtwork
            uri={data.cards[0]?.businessCardUrl}
            name={data.cards[0]?.title || name || "Your card"}
            company={data.cards[0]?.company || profile.company}
            role={data.cards[0]?.role || profile.role}
            style={{ borderRadius: 8 }}
          />
        </View>
        <View style={s.row}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Icon name="id-card-outline" size={17} />
            <Text style={{ color: C.ink, fontSize: 13, fontWeight: "600" }}>
              Your card, ready to go
            </Text>
          </View>
          <Icon name="arrow-forward-outline" size={19} />
        </View>
      </Pressable>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <Button
          onPress={onCapture}
          tone="secondary"
          icon="scan-outline"
          style={{ flex: 1 }}
        >
          Scan a card
        </Button>
        <Button onPress={onMyCard} icon="share-outline" style={{ flex: 1 }}>
          Share mine
        </Button>
      </View>
      <Section title="Your card wallet" action="See all" onPress={onPeople}>
        {data.people.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 15, paddingBottom: 8 }}
          >
            {[...data.people]
              .sort(
                (a, b) =>
                  Number(Boolean(b.businessCardUrl)) -
                  Number(Boolean(a.businessCardUrl)),
              )
              .slice(0, 8)
              .map((p) => (
                <WalletTile
                  key={p.id}
                  person={p}
                  width={255}
                  onPress={() => onPerson(p.id)}
                />
              ))}
          </ScrollView>
        ) : (
          <Empty
            title="A wallet worth opening"
            body="Scan a card after your next good conversation."
            action="Add a card"
            onPress={onCapture}
          />
        )}
      </Section>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 22 }}>
        <Pressable
          onPress={onPeople}
          accessibilityRole="button"
          style={{
            flex: 1,
            backgroundColor: C.soft,
            borderRadius: 17,
            padding: 16,
          }}
        >
          <Icon name="people-outline" size={21} />
          <Text
            style={{
              fontSize: 23,
              color: C.ink,
              fontWeight: "500",
              marginTop: 9,
            }}
          >
            {data.people.length}
            <Text style={{ fontSize: 12 }}> cards</Text>
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setLeadInbox(true)}
          accessibilityRole="button"
          accessibilityLabel="Open enquiries"
          style={{
            flex: 1,
            backgroundColor: "#EFE8DF",
            borderRadius: 17,
            padding: 16,
          }}
        >
          <Icon name="chatbubble-ellipses-outline" size={21} />
          <Text
            style={{
              fontSize: 23,
              color: C.ink,
              fontWeight: "500",
              marginTop: 9,
            }}
          >
            {leads.length}
            <Text style={{ fontSize: 12 }}> new enquiries</Text>
          </Text>
        </Pressable>
      </View>
      <Section
        title="Pick up the conversation"
        action="All people"
        onPress={onPeople}
      >
        {open.length ? (
          open.slice(0, 2).map((c) => {
            const p = data.people.find((p) => p.id === c.personId);
            return (
              <View
                key={c.id}
                style={{
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: C.line,
                  flexDirection: "row",
                  gap: 11,
                  alignItems: "center",
                }}
              >
                <Pressable
                  onPress={() => onPerson(c.personId)}
                  accessibilityRole="button"
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    gap: 11,
                    alignItems: "center",
                  }}
                >
                  <Avatar
                    name={(c as any).personName ?? p?.name ?? "Connection"}
                    url={p?.photoUrl}
                    size={42}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: "600", color: C.ink }}
                    >
                      {(c as any).personName ?? p?.name ?? "Connection"}
                    </Text>
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 12,
                        lineHeight: 18,
                        color: C.muted,
                        marginTop: 4,
                      }}
                    >
                      {c.text}
                    </Text>
                    {c.dueAt && (
                      <Text
                        style={{ fontSize: 10, color: C.teal, marginTop: 4 }}
                      >
                        {dateLabel(c.dueAt)}
                      </Text>
                    )}
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => void complete(c.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Mark promise complete"
                  hitSlop={10}
                >
                  <Icon name="ellipse-outline" size={24} />
                </Pressable>
              </View>
            );
          })
        ) : (
          <Body muted>All caught up.</Body>
        )}
      </Section>
      <Button
        tone="quiet"
        icon="compass-outline"
        onPress={() => setIntent(true)}
        style={{ marginTop: 20 }}
      >
        What are you looking for?
      </Button>
      {data.needs
        .filter((n) => n.active)
        .slice(0, 2)
        .map((n) => (
          <View
            key={n.id}
            style={{
              borderLeftWidth: 2,
              borderLeftColor: C.line,
              paddingLeft: 12,
              marginTop: 12,
            }}
          >
            <Text style={{ fontSize: 10, color: C.muted }}>
              {n.kind === "need" ? "LOOKING FOR" : "CAN HELP WITH"}
            </Text>
            <Text
              numberOfLines={2}
              style={{
                fontSize: 12,
                lineHeight: 18,
                color: C.ink,
                marginTop: 5,
              }}
            >
              {n.text}
            </Text>
            <Pressable
              onPress={() =>
                void patch(`/need-offers/${n.id}`, { active: false })
                  .then(refresh)
                  .catch((e) => notify(e.message))
              }
              accessibilityRole="button"
            >
              <Text style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>
                Done with this focus
              </Text>
            </Pressable>
          </View>
        ))}
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
