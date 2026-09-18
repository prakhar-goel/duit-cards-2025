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
import { NetworkFeed } from "./NetworkFeed";
import { CardArtwork, WalletTile } from "./CardStory";
export function TodayScreen({
  onPerson,
  onPeople,
  onCapture,
}: {
  onPerson: (id: string) => void;
  onPeople: () => void;
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
    <>
      <NetworkFeed
        onPerson={onPerson}
        onFocus={() => setIntent(true)}
        refreshing={loading}
        onRefresh={() => void refresh()}
        header={
          <>
            <View style={s.row}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 9 }}
              >
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
            </View>
            {offline && (
              <Notice action="Retry" onPress={() => void sync()}>
                Offline · your saved cards and notes are here.
              </Notice>
            )}
            {queue.length > 0 && (
              <Notice action="Sync" onPress={() => void sync()}>
                {queue.length} capture{queue.length === 1 ? "" : "s"} waiting to
                sync.
              </Notice>
            )}
            {error && !offline && (
              <Notice error action="Retry" onPress={() => void refresh()}>
                {error}
              </Notice>
            )}
            <View style={{ marginTop: 28, marginBottom: 18 }}>
              <Label>GOOD TO SEE YOU, {firstName(name).toUpperCase()}</Label>
            </View>
            {
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open enquiries"
                onPress={() => setLeadInbox(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  padding: 14,
                  borderRadius: 15,
                  backgroundColor: C.soft,
                  marginTop: 4,
                }}
              >
                <Icon name="chatbubble-ellipses-outline" size={20} />
                <Text style={{ flex: 1, fontSize: 13, color: C.ink }}>
                  Enquiries{leads.length ? ` · ${leads.length} new` : ""}
                </Text>
                <Icon name="arrow-forward-outline" size={18} />
              </Pressable>
            }
          </>
        }
        footer={
          <>
            <Section title="Pick up the conversation">
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
                          name={
                            (c as any).personName ?? p?.name ?? "Connection"
                          }
                          url={p?.photoUrl}
                          size={42}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: "600",
                              color: C.ink,
                            }}
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
                              style={{
                                fontSize: 10,
                                color: C.teal,
                                marginTop: 4,
                              }}
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
                    <Text
                      style={{ fontSize: 11, color: C.muted, marginTop: 5 }}
                    >
                      Done with this focus
                    </Text>
                  </Pressable>
                </View>
              ))}
          </>
        }
      />
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
        title="Enquiries"
        subtitle={`${data.leads.length} enquiries from your shared cards.`}
        onClose={() => {
          if (leadId) setLeadId(null);
          else setLeadInbox(false);
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
              Back to enquiries
            </Button>
          </>
        ) : data.leads.length ? (
          data.leads.map((l) => (
            <Pressable
              key={l.id}
              accessibilityRole="button"
              accessibilityLabel={`Enquiry from ${l.name || "a visitor"}`}
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
    </>
  );
}
