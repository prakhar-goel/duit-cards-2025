import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Linking,
  Share,
  Switch,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import { usePilot } from "./store";
import { get, post, patch, upload, mediaUrl, shareUrl } from "./api";
import type { Card, Panel } from "./types";
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
  RemoteImage,
  Divider,
  Empty,
} from "./ui";
import { chooseImage } from "./Capture";
import { AIReview } from "./AI";
import { ServerSettings } from "./Auth";
import { ProfileEditor } from "./Profile";
import { themes, useTheme, type ThemeId } from "./theme";
import { CardStory, CardArtwork } from "./CardStory";
const panelLabels = {
  hook: "Your opening line",
  relevance: "Who you help",
  offer: "What you offer",
  outcome: "What changes for them",
  proof: "A reason to believe",
  cta: "The next small step",
};
const panelHints = {
  hook: "One clear sentence that makes someone curious.",
  relevance: "Describe the people or businesses you work with.",
  offer: "The service or product you bring to the table.",
  outcome: "What can someone achieve with your help?",
  proof: "Use only facts you can stand behind. No invented claims.",
  cta: "Invite a simple action: ask a question, book a call, request a quote.",
};
const types = Object.keys(panelLabels) as Panel["panelType"][];
const emptyPanels = () =>
  types.map((panelType, position) => ({
    panelType,
    position,
    body: "",
    approved: false,
    provenance: "owner" as const,
  }));
function OwnCardStory({ card }: { card: Card }) {
  const [full, setFull] = useState<Card>(card);
  useEffect(() => {
    let active = true;
    setFull(card);
    void get(`/cards/${card.id}`)
      .then((r) => {
        if (active) setFull(r.card);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [card]);
  return <CardStory card={full} initialPage="Card" />;
}
export function MyCardScreen() {
  const { theme, setTheme } = useTheme();
  const {
    data,
    loading,
    refresh,
    logout,
    notify,
    queue,
    capabilities,
    sync,
    removeQueued,
  } = usePilot();
  const [editing, setEditing] = useState<Card | null | undefined>(undefined);
  const [sharing, setSharing] = useState<Card | null>(null);
  const [settings, setSettings] = useState(false);
  const [outbox, setOutbox] = useState(false);
  const [profileEditor, setProfileEditor] = useState(false);
  const [serverSettings, setServerSettings] = useState(false);
  const [analytics, setAnalytics] = useState<{ card: Card; stats: any } | null>(
    null,
  );
  const profile = data.user?.profile ?? {};
  const name =
    profile.fullName || (data.user as any)?.displayName || "Your name";
  async function viewStats(card: Card) {
    try {
      const stats = await get(`/cards/${card.id}/analytics`);
      setAnalytics({ card, stats });
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not load card activity.");
    }
  }
  return (
    <Page refreshing={loading} onRefresh={() => void refresh()}>
      <View style={s.row}>
        <View>
          <Label>YOUR INTRODUCTION</Label>
          <Title style={{ marginTop: 12 }}>My card.</Title>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Account settings"
          onPress={() => setSettings(true)}
          style={{ padding: 10 }}
        >
          <Icon name="settings-outline" />
        </Pressable>
      </View>
      <View style={{ height: 14 }} />

      {data.cards.map((card) => (
        <View key={card.id} style={{ marginBottom: 27 }}>
          <OwnCardStory card={card} />
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <Button
              style={{ flex: 1 }}
              onPress={() => setSharing(card)}
              icon="share-outline"
              disabled={!card.isPublished}
            >
              Share card
            </Button>
            <Button
              style={{ flex: 1 }}
              tone="secondary"
              onPress={() => setEditing(card)}
              icon="create-outline"
            >
              Edit card
            </Button>
            <Pressable
              onPress={() => void viewStats(card)}
              accessibilityRole="button"
              accessibilityLabel="View card activity"
              style={{
                width: 50,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: C.soft,
                borderRadius: 16,
              }}
            >
              <Icon name="stats-chart-outline" />
            </Pressable>
          </View>
          {!card.isPublished && (
            <Text style={[s.hint, { marginTop: 10 }]}>
              Review all six panels and publish before sharing.
            </Text>
          )}
        </View>
      ))}
      {!data.cards.length && (
        <Empty
          icon="id-card-outline"
          title="Make a good first impression"
          body="Tell people what you do, who you help and what to do next. A card with a little purpose."
          action="Create my card"
          onPress={() => setEditing(null)}
        />
      )}
      <Button
        tone="secondary"
        icon="add-outline"
        onPress={() => setEditing(null)}
      >
        Create another card
      </Button>
      {editing !== undefined && (
        <CardEditor card={editing} onClose={() => setEditing(undefined)} />
      )}
      <ShareCard card={sharing} onClose={() => setSharing(null)} />
      <Sheet
        visible={settings}
        title="Your DUIT workspace"
        onClose={() => setSettings(false)}
      >
        <View style={{ alignItems: "center", marginBottom: 22 }}>
          <Avatar name={name} url={profile.photoUrl} size={86} />
          <Title size={25} style={{ marginTop: 18 }}>
            {name}
          </Title>
          <Body muted style={{ fontSize: 13, marginTop: 7 }}>
            {data.user?.email}
          </Body>
        </View>
        <Notice>
          Your card is public only after you publish it. Meeting notes,
          locations and relationship context stay private.
        </Notice>
        <View style={{ marginTop: 22, marginBottom: 18 }}>
          <Label>APPEARANCE</Label>
          <Body muted style={{ fontSize: 13, marginTop: 7, marginBottom: 12 }}>
            Preview a visual direction on this device. You can switch back at
            any time.
          </Body>
          {themes.map((option) => {
            const selected = option.id === theme.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`Use ${option.name} theme`}
                onPress={() => {
                  void setTheme(option.id as ThemeId).catch(() =>
                    notify("Theme applied, but could not be saved for next time."),
                  );
                }}
                style={{
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? C.teal : C.line,
                  backgroundColor: C.white,
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View style={{ flexDirection: "row", gap: 4 }}>
                  {[
                    option.colors.ink,
                    option.colors.teal,
                    option.colors.orange,
                  ].map((color) => (
                    <View
                      key={color}
                      style={{
                        width: 13,
                        height: 34,
                        borderRadius: 7,
                        backgroundColor: color,
                      }}
                    />
                  ))}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: C.ink, fontSize: 14, fontWeight: "600" }}
                  >
                    {option.name}
                  </Text>
                  <Text
                    style={{
                      color: C.muted,
                      fontSize: 11,
                      lineHeight: 16,
                      marginTop: 3,
                    }}
                  >
                    {option.description}
                  </Text>
                </View>
                <Icon
                  name={selected ? "checkmark-circle" : "ellipse-outline"}
                  color={selected ? C.teal : C.muted}
                />
              </Pressable>
            );
          })}
        </View>
        {queue.length > 0 && (
          <Notice>
            {queue.length} capture{queue.length === 1 ? "" : "s"} are saved on
            this device and waiting to sync. They stay linked to this account.
          </Notice>
        )}
        <Button
          tone="secondary"
          icon="person-outline"
          onPress={() => {
            setSettings(false);
            setProfileEditor(true);
          }}
        >
          Edit my account profile
        </Button>
        <View style={{ height: 12 }} />
        <Button
          tone="secondary"
          icon="cloud-upload-outline"
          onPress={() => {
            setSettings(false);
            setOutbox(true);
          }}
        >
          Saved captures{queue.length ? " · " + queue.length : ""}
        </Button>
        <View style={{ height: 12 }} />
        <Button
          tone="secondary"
          icon="server-outline"
          onPress={() => {
            setSettings(false);
            setServerSettings(true);
          }}
        >
          Server settings
        </Button>
        <View style={{ height: 12 }} />
        <Button
          tone="danger"
          icon="log-out-outline"
          onPress={() => void logout()}
        >
          Sign out
        </Button>
      </Sheet>
      {profileEditor && (
        <ProfileEditor onClose={() => setProfileEditor(false)} />
      )}
      <Sheet
        visible={outbox}
        title="Saved on this device"
        subtitle="Captures stay with this account until they sync."
        onClose={() => setOutbox(false)}
        footer={
          queue.length ? (
            <Button onPress={() => void sync()}>Try syncing now</Button>
          ) : undefined
        }
      >
        {queue.length ? (
          queue.map((item) => (
            <View key={item.id} style={[s.card, { marginBottom: 14 }]}>
              <Label>
                {item.error ? "NEEDS ATTENTION" : "WAITING TO SYNC"}
              </Label>
              <Title size={22} style={{ marginTop: 12 }}>
                {item.draft.name}
              </Title>
              <Body style={{ fontSize: 13, marginTop: 9 }}>
                {item.draft.originalNote || "A meeting capture"}
              </Body>
              {item.error && (
                <Text style={{ color: C.red, fontSize: 12, marginTop: 12 }}>
                  {item.error}
                </Text>
              )}
              <Button
                small
                tone="danger"
                onPress={() => void removeQueued(item.id)}
                style={{ alignSelf: "flex-start", marginTop: 17 }}
              >
                Discard unsynced capture
              </Button>
            </View>
          ))
        ) : (
          <Empty
            icon="checkmark-circle-outline"
            title="All caught up"
            body="Your saved captures have reached your private workspace."
          />
        )}
      </Sheet>
      <ServerSettings
        visible={serverSettings}
        onClose={() => setServerSettings(false)}
      />
      <Sheet
        visible={Boolean(analytics)}
        title="Your card is making introductions"
        onClose={() => setAnalytics(null)}
      >
        {analytics && (
          <>
            <Body muted>{analytics.card.title}</Body>
            <View
              style={[
                s.card,
                {
                  marginTop: 25,
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 25,
                },
              ]}
            >
              {Object.entries(analytics.stats.totals ?? {}).map(([k, v]) => (
                <View key={k} style={{ width: "40%" }}>
                  <Stat
                    value={v as number}
                    label={k.replace(/([A-Z])/g, " $1")}
                  />
                </View>
              ))}
            </View>
            <Notice>
              These are recorded card actions, not proof that a meeting or sale
              happened.
            </Notice>
            {analytics.stats.daily?.map((d: any, i: number) => (
              <View
                key={i}
                style={[
                  s.row,
                  {
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderColor: C.line,
                  },
                ]}
              >
                <Text style={{ color: C.ink, fontSize: 13 }}>
                  {d.date?.slice(0, 10) ?? d.day?.slice(0, 10)}
                </Text>
                <Body muted style={{ fontSize: 12 }}>
                  {d.views ?? d.count ?? 0} views
                </Body>
              </View>
            ))}
          </>
        )}
      </Sheet>
    </Page>
  );
}
export function CardEditor({
  card,
  onClose,
}: {
  card: Card | null;
  onClose: () => void;
}) {
  const { data, refresh, notify, capabilities } = usePilot();
  const user = data.user as any;
  const profile = user?.profile ?? {};
  const [form, setForm] = useState<any>(
    card ?? {
      title: profile.fullName ?? user?.displayName ?? "",
      slug: "",
      subtitle: "",
      company: profile.company ?? "",
      role: profile.role ?? "",
      contact: { email: user?.email, phone: "", website: "" },
      ctaType: "enquire",
      ctaLabel: "Let’s talk",
      imageUrl: profile.photoUrl ?? null,
      businessCardUrl: null,
      coverUrl: null,
      links: [],
    },
  );
  const [panels, setPanels] = useState<Panel[]>(emptyPanels());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState<"identity" | "pitch" | "action">("identity");
  const [aiTask, setAiTask] = useState("");
  const [brief, setBrief] = useState("");
  const [media, setMedia] = useState<any>(null);
  const [savedId, setSavedId] = useState(card?.id);
  useEffect(() => {
    if (card)
      void get(`/cards/${card.id}`)
        .then((r) => {
          setForm(r.card);
          setPanels(
            r.card.panels?.length === 6 ? r.card.panels : emptyPanels(),
          );
        })
        .catch((e) => setError(e.message));
  }, [card?.id]);
  const change = (key: string, value: any) =>
    setForm((f: any) => ({ ...f, [key]: value }));
  function updatePanel(index: number, patchValue: Partial<Panel>) {
    setPanels((p) =>
      p.map((v, i) => (i === index ? { ...v, ...patchValue } : v)),
    );
  }
  async function save(publish = false) {
    setBusy(true);
    setError("");
    try {
      const payload = {
        ...form,
        slug: form.slug.trim().toLowerCase(),
        contact: {
          ...form.contact,
          email: form.contact?.email || undefined,
          phone: form.contact?.phone || undefined,
          website: form.contact?.website || undefined,
        },
      };
      const res = savedId
        ? await patch(`/cards/${savedId}`, payload)
        : await post("/cards", payload);
      const id = res.card.id;
      setSavedId(id);
      if (panels.every((p) => p.body.trim()))
        await post(`/cards/${id}/panels`, {
          panels: panels.map((p) => ({ ...p, body: p.body.trim() })),
        });
      if (publish) {
        if (!panels.every((p) => p.approved && p.body.trim()))
          throw new Error(
            "Review and approve each of the six panels before publishing.",
          );
        await post(`/cards/${id}/publish`);
      }
      await refresh();
      notify(
        publish
          ? "Your reviewed card is ready to share."
          : "Your draft is saved.",
      );
      if (publish) onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save this card.");
    } finally {
      setBusy(false);
    }
  }
  async function scanOwnCard() {
    setBusy(true);
    setError("");
    try {
      const uploaded = await chooseImage(false, "business_card");
      if (uploaded) {
        setMedia(uploaded);
        change("businessCardUrl", uploaded.url);
        if (capabilities.enabled) setAiTask("card_extract");
        else notify("Original card added. You can edit the details below.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read this card.");
    } finally {
      setBusy(false);
    }
  }
  const gallery = form.businessMedia?.length
    ? form.businessMedia
    : form.coverUrl
      ? [
          {
            url: form.coverUrl,
            type: "image",
            title: form.company || "",
            caption: form.subtitle || "",
          },
        ]
      : [];
  async function addBusinessMedia(video = false) {
    setBusy(true);
    setError("");
    try {
      if (gallery.length >= 4)
        throw new Error("You can add four business slides.");
      let url: string | undefined;
      if (video) {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["videos"],
        });
        if (result.canceled) return;
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > 12 * 1024 * 1024)
          throw new Error("Choose an MP4 smaller than 12 MB.");
        if (asset.mimeType && asset.mimeType !== "video/mp4")
          throw new Error("Choose an MP4 video.");
        url = (
          await upload(
            asset.uri,
            "video/mp4",
            asset.fileName || "business.mp4",
            "cover",
          )
        ).media.url;
      } else url = (await chooseImage(false, "cover"))?.url;
      if (url)
        change("businessMedia", [
          ...gallery,
          { url, type: video ? "video" : "image", title: "", caption: "" },
        ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add media.");
    } finally {
      setBusy(false);
    }
  }
  async function cardBack() {
    setBusy(true);
    setError("");
    try {
      const media = await chooseImage(false, "business_card");
      if (media) change("businessCardBackUrl", media.url);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not add the back of your card.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function photo() {
    setBusy(true);
    setError("");
    try {
      const uploaded = await chooseImage(false, "portrait");
      if (uploaded) {
        setMedia(uploaded);
        change("imageUrl", uploaded.url);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload this photo.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Sheet
        visible
        title={
          card ? "Make your introduction better" : "Your work. In a good light."
        }
        onClose={() =>
          page === "action"
            ? setPage("pitch")
            : page === "pitch"
              ? setPage("identity")
              : onClose()
        }
        footer={
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button
              tone="secondary"
              busy={busy}
              onPress={() => void save()}
              disabled={!form.title?.trim() || !form.slug?.trim()}
              style={{ flex: 1 }}
            >
              Save draft
            </Button>
            <Button
              busy={busy}
              disabled={!panels.every((p) => p.approved && p.body.trim())}
              onPress={() => void save(true)}
              style={{ flex: 1 }}
            >
              Publish card
            </Button>
          </View>
        }
      >
        <View style={{ flexDirection: "row", gap: 9, marginBottom: 26 }}>
          {(["identity", "pitch", "action"] as const).map((p, i) => (
            <Pill key={p} active={page === p} onPress={() => setPage(p)}>
              {i + 1}.{" "}
              {p === "identity"
                ? "The person"
                : p === "pitch"
                  ? "The pitch"
                  : "The action"}
            </Pill>
          ))}
        </View>
        {error && <Notice error>{error}</Notice>}
        {page === "identity" ? (
          <>
            <View style={{ alignItems: "center", marginBottom: 24 }}>
              <Avatar name={form.title} url={form.imageUrl} size={104} square />
              <Button
                tone="quiet"
                small
                onPress={() => void photo()}
                busy={busy}
                icon="image-outline"
                style={{ marginTop: 10 }}
              >
                Choose a portrait
              </Button>
              {media?.purpose === "portrait" && (
                <Button
                  tone="quiet"
                  small
                  icon="sparkles-outline"
                  onPress={() => setAiTask("portrait_cleanup")}
                >
                  Improve this photo
                </Button>
              )}
            </View>
            {form.businessCardUrl && (
              <View style={{ marginBottom: 14 }}>
                <CardArtwork
                  uri={form.businessCardUrl}
                  name={form.title}
                  company={form.company}
                  role={form.role}
                  height={190}
                />
                <Text style={s.hint}>Your original visiting card</Text>
              </View>
            )}
            <Button
              tone="secondary"
              icon="scan-outline"
              onPress={() => void scanOwnCard()}
              busy={busy}
              style={{ marginBottom: 23 }}
            >
              {form.businessCardUrl
                ? "Replace visiting card"
                : "Upload your visiting card"}
            </Button>
            {form.businessCardBackUrl && (
              <CardArtwork
                uri={form.businessCardBackUrl}
                name={form.title}
                height={160}
              />
            )}
            <Button
              tone="quiet"
              small
              icon="id-card-outline"
              busy={busy}
              onPress={() => void cardBack()}
            >
              {form.businessCardBackUrl ? "Replace card back" : "Add card back"}
            </Button>
            {form.businessCardBackUrl && (
              <Button
                tone="quiet"
                small
                onPress={() => change("businessCardBackUrl", null)}
              >
                Remove card back
              </Button>
            )}
            <Field
              label="Your name"
              value={form.title}
              onChangeText={(v) => change("title", v)}
            />
            <Field
              label="Your card address"
              value={form.slug}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={(v) =>
                change("slug", v.replace(/[^a-z0-9-]/gi, "").toLowerCase())
              }
              placeholder="maya-desai"
              hint="A short, unique name with letters, numbers or hyphens."
            />
            <Field
              label="Company"
              value={form.company ?? ""}
              onChangeText={(v) => change("company", v)}
            />
            <Field
              label="Role"
              value={form.role ?? ""}
              onChangeText={(v) => change("role", v)}
            />
            <Field
              label="Your one-line introduction"
              value={form.subtitle}
              onChangeText={(v) => change("subtitle", v)}
              multiline
              placeholder="I help growing teams turn complicated products into clear experiences."
            />
            <Button
              onPress={() => setPage("pitch")}
              icon="arrow-forward"
              tone="secondary"
            >
              Build the pitch
            </Button>
          </>
        ) : page === "pitch" ? (
          <>
            <View style={{ marginBottom: 24 }}>
              <Label>BUSINESS SLIDES · {gallery.length} / 4</Label>
              {gallery.map((item: any, index: number) => (
                <View key={index} style={[s.card, { marginTop: 14 }]}>
                  {item.type === "image" ? (
                    <RemoteImage
                      uri={item.url}
                      contain
                      style={{ height: 160, width: "100%", borderRadius: 12 }}
                    />
                  ) : (
                    <View
                      style={{
                        height: 80,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: C.soft,
                        borderRadius: 12,
                      }}
                    >
                      <Icon name="play-circle-outline" size={36} />
                      <Text>Video</Text>
                    </View>
                  )}
                  <Field
                    label="Title"
                    value={item.title}
                    onChangeText={(v) =>
                      change(
                        "businessMedia",
                        gallery.map((x: any, i: number) =>
                          i === index ? { ...x, title: v } : x,
                        ),
                      )
                    }
                  />
                  <Field
                    label="Caption"
                    value={item.caption}
                    onChangeText={(v) =>
                      change(
                        "businessMedia",
                        gallery.map((x: any, i: number) =>
                          i === index ? { ...x, caption: v } : x,
                        ),
                      )
                    }
                  />
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Button
                      tone="quiet"
                      small
                      disabled={index === 0}
                      onPress={() => {
                        const next = [...gallery];
                        [next[index - 1], next[index]] = [
                          next[index],
                          next[index - 1],
                        ];
                        change("businessMedia", next);
                      }}
                    >
                      Move earlier
                    </Button>
                    <Button
                      tone="quiet"
                      small
                      onPress={() => {
                        change(
                          "businessMedia",
                          gallery.filter((_: any, i: number) => i !== index),
                        );
                        change("coverUrl", null);
                      }}
                    >
                      Remove
                    </Button>
                  </View>
                </View>
              ))}
              {gallery.length < 4 && (
                <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                  <Button
                    tone="secondary"
                    small
                    icon="image-outline"
                    busy={busy}
                    onPress={() => void addBusinessMedia()}
                  >
                    Add photo
                  </Button>
                  <Button
                    tone="secondary"
                    small
                    icon="videocam-outline"
                    busy={busy}
                    onPress={() => void addBusinessMedia(true)}
                  >
                    Add video
                  </Button>
                </View>
              )}
              <Text style={s.hint}>
                Photos, projects and a short introduction. MP4 up to 12 MB.
              </Text>
            </View>
            <View
              style={[s.card, { marginBottom: 25, backgroundColor: C.soft }]}
            >
              <Label>A LITTLE HELP FROM DUIT ASSIST</Label>
              <Field
                label="Describe your work in a few words"
                value={brief}
                onChangeText={setBrief}
                multiline
                placeholder="Who do you help, what do you offer and why should they care?"
                style={{ marginTop: 4 }}
              />
              <Button
                small
                tone="secondary"
                icon="sparkles-outline"
                disabled={!brief.trim()}
                onPress={() => setAiTask("profile_draft")}
              >
                Help me write my pitch
              </Button>
              {!capabilities.enabled && (
                <Text style={s.hint}>
                  AI is not connected. You can write every panel below.
                </Text>
              )}
            </View>
            {panels.map((p, i) => (
              <View key={p.panelType} style={{ marginBottom: 24 }}>
                <View style={[s.row, { marginBottom: 12 }]}>
                  <Label>
                    {String(i + 1).padStart(2, "0")} / {p.panelType}
                  </Label>
                  <Icon
                    name={p.approved ? "checkmark-circle" : "ellipse-outline"}
                    color={p.approved ? C.teal : C.muted}
                    size={19}
                  />
                </View>
                <Field
                  label={panelLabels[p.panelType]}
                  hint={panelHints[p.panelType]}
                  value={p.body}
                  multiline
                  onChangeText={(body) =>
                    updatePanel(i, { body, approved: false })
                  }
                />
                <Pressable
                  onPress={() =>
                    updatePanel(i, {
                      approved: !p.approved,
                      provenance:
                        p.provenance === "ai_suggested"
                          ? "approved_ai"
                          : p.provenance,
                    })
                  }
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: p.approved }}
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <Icon
                    name={p.approved ? "checkbox" : "square-outline"}
                    size={21}
                    color={C.teal}
                  />
                  <Text style={{ fontSize: 12, color: C.ink, flex: 1 }}>
                    I’ve reviewed this. It’s accurate and ready to share.
                  </Text>
                </Pressable>
              </View>
            ))}
            <Button
              onPress={() => setPage("action")}
              icon="arrow-forward"
              tone="secondary"
            >
              Choose the next step
            </Button>
          </>
        ) : (
          <>
            <Label>ONE CLEAR NEXT STEP</Label>
            <Title size={27} style={{ marginTop: 13, marginBottom: 23 }}>
              Make it easy to{"\n"}start a conversation.
            </Title>
            <Field
              label="Button label"
              value={form.ctaLabel}
              onChangeText={(v) => change("ctaLabel", v)}
              placeholder="Let’s discuss your project"
            />
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 9,
                marginBottom: 23,
              }}
            >
              {[
                "enquire",
                "whatsapp",
                "email",
                "call",
                "book",
                "share_requirement",
              ].map((t) => (
                <Pill
                  key={t}
                  active={form.ctaType === t}
                  onPress={() => change("ctaType", t)}
                >
                  {t.replace("_", " ")}
                </Pill>
              ))}
            </View>
            <Field
              label="Email"
              value={form.contact?.email ?? ""}
              onChangeText={(v) =>
                change("contact", { ...form.contact, email: v })
              }
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Field
              label="Phone with country code"
              value={form.contact?.phone ?? ""}
              onChangeText={(v) =>
                change("contact", { ...form.contact, phone: v })
              }
              keyboardType="phone-pad"
            />
            <Field
              label="Website · optional"
              value={form.contact?.website ?? ""}
              onChangeText={(v) =>
                change("contact", { ...form.contact, website: v })
              }
              keyboardType="url"
              autoCapitalize="none"
              placeholder="https://yourcompany.com"
            />
            {form.ctaType === "book" && (
              <Field
                label="Booking link"
                value={form.ctaUrl ?? ""}
                onChangeText={(v) => change("ctaUrl", v)}
                autoCapitalize="none"
                keyboardType="url"
                placeholder="https://…"
              />
            )}
            <Notice>
              Publishing shares only this card. Your private notes, meetings and
              recipient drafts are never included.
            </Notice>
            {card?.isPublished && (
              <Button
                tone="danger"
                onPress={() =>
                  void post(`/cards/${card.id}/unpublish`)
                    .then(async () => {
                      await refresh();
                      notify(
                        "Card unpublished. Existing links no longer show it.",
                      );
                      onClose();
                    })
                    .catch((e) => setError(e.message))
                }
              >
                Unpublish this card
              </Button>
            )}
          </>
        )}
      </Sheet>
      {aiTask && (
        <AIReview
          visible
          task={aiTask}
          title={
            aiTask === "profile_draft"
              ? "A clearer business introduction"
              : aiTask === "card_extract"
                ? "Your card, without all the typing"
                : "Improve the photo, keep the person"
          }
          input={
            aiTask === "profile_draft"
              ? {
                  name: form.title,
                  company: form.company,
                  role: form.role,
                  brief,
                  description: brief,
                }
              : { preserveIdentity: true }
          }
          mediaIds={
            ["portrait_cleanup", "card_extract"].includes(aiTask) && media
              ? [media.id]
              : undefined
          }
          originalImageUrl={media?.url}
          onClose={() => setAiTask("")}
          onApply={(result) => {
            if (aiTask === "card_extract") {
              const f = result.fields ?? {};
              change("title", f.name ?? form.title);
              change("company", f.company ?? form.company);
              change("role", f.role ?? form.role);
              change("contact", {
                ...form.contact,
                email: f.email ?? form.contact.email,
                phone: f.phone ?? form.contact.phone,
                website: f.website ?? form.contact.website,
              });
              setBrief(result.rawText ?? "");
            } else if (aiTask === "profile_draft") {
              change("subtitle", result.headline ?? form.subtitle);
              setPanels(
                types.map((panelType, position) => ({
                  panelType,
                  position,
                  body:
                    result.panels?.find((p: any) => p.panelType === panelType)
                      ?.body ?? "",
                  provenance: "ai_suggested",
                  approved: false,
                })),
              );
              if (result.cta) {
                change("ctaLabel", result.cta.label ?? form.ctaLabel);
                change(
                  "ctaType",
                  (
                    {
                      contact: "enquire",
                      website: "book",
                      book: "book",
                      message: "whatsapp",
                    } as any
                  )[result.cta.type] ?? form.ctaType,
                );
                if (
                  result.cta.value &&
                  ["website", "book"].includes(result.cta.type)
                )
                  change("ctaUrl", result.cta.value);
              }
            } else {
              const url =
                result.images?.[0]?.url ??
                result.media?.url ??
                result.url ??
                result.imageUrl;
              if (!url)
                throw new Error("The image result is not ready to use.");
              change("imageUrl", url);
            }
          }}
        />
      )}
    </>
  );
}
export function ShareCard({
  card,
  onClose,
}: {
  card: Card | null;
  onClose: () => void;
}) {
  const { notify } = usePilot();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recipient, setRecipient] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  useEffect(() => {
    setUrl("");
    setError("");
    setRecipient(false);
    if (card) {
      setBusy(true);
      void post(`/cards/${card.id}/shares`, { channel: "link" })
        .then((r) => setUrl(shareUrl(r.url)))
        .catch((e) => setError(e.message))
        .finally(() => setBusy(false));
    }
  }, [card?.id]);
  async function share(channel: "whatsapp" | "link") {
    if (!card) return;
    setBusy(true);
    setError("");
    try {
      const result = await post(`/cards/${card.id}/shares`, {
        channel,
        ...(recipient
          ? { recipientDraft: { name, email, phone: phone || undefined } }
          : {}),
      });
      const destination = shareUrl(result.url);
      setUrl(destination);
      const message = `${name ? "Hi " + name + ", " : ""}here’s my DUIT card. A little about what I do, and how I can help.\n${destination}`;
      if (channel === "whatsapp")
        await Linking.openURL(
          `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`,
        );
      else await Share.share({ message, url: destination, title: card.title });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open sharing.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet
      visible={Boolean(card)}
      title="A good introduction travels"
      subtitle="Works in a browser. No app needed to meet you."
      onClose={onClose}
    >
      {error && <Notice error>{error}</Notice>}
      {card && (
        <>
          <View
            style={{
              alignItems: "center",
              backgroundColor: C.white,
              padding: 28,
              borderRadius: 25,
              borderWidth: 1,
              borderColor: C.line,
            }}
          >
            <Avatar name={card.title} url={card.imageUrl} size={62} />
            <Title size={24} style={{ marginTop: 17, textAlign: "center" }}>
              {card.title}
            </Title>
            <Body
              muted
              style={{
                fontSize: 13,
                textAlign: "center",
                marginTop: 8,
                marginBottom: 25,
              }}
            >
              {card.subtitle}
            </Body>
            {url ? (
              <QRCode
                value={url}
                size={190}
                color={C.ink}
                backgroundColor={C.white}
              />
            ) : (
              <Body muted>Creating your link…</Body>
            )}
            <Text
              style={{
                fontSize: 10,
                letterSpacing: 1.4,
                color: C.muted,
                marginTop: 20,
              }}
            >
              SCAN. SAY HELLO. SEE WHAT HAPPENS.
            </Text>
          </View>
          {url && (
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <Button
                tone="secondary"
                small
                icon="copy-outline"
                onPress={() =>
                  void Clipboard.setStringAsync(url).then(() =>
                    notify("Card link copied."),
                  )
                }
                style={{ flex: 1 }}
              >
                Copy link
              </Button>
              <Button
                tone="secondary"
                small
                icon="open-outline"
                onPress={() => void Linking.openURL(url)}
                style={{ flex: 1 }}
              >
                Open web card
              </Button>
            </View>
          )}
          <Divider />
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: C.ink }}>
                Make their first step easier
              </Text>
              <Body muted style={{ fontSize: 12, marginTop: 5 }}>
                Add a private starter draft for your recipient.
              </Body>
            </View>
            <Switch
              value={recipient}
              onValueChange={setRecipient}
              trackColor={{ true: C.teal, false: C.line }}
              thumbColor={C.white}
            />
          </View>
          {recipient && (
            <View style={{ marginTop: 20 }}>
              <Field label="Their name" value={name} onChangeText={setName} />
              <Field
                label="Their email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Field
                label="WhatsApp number · optional"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <Notice>
                Only they can claim this draft after verifying their email. Your
                link does not reveal their details.
              </Notice>
            </View>
          )}
          <Button
            icon="logo-whatsapp"
            busy={busy}
            disabled={!url || (recipient && (!name.trim() || !email.trim()))}
            onPress={() => void share("whatsapp")}
            style={{ marginTop: 24 }}
          >
            Open WhatsApp
          </Button>
          <Button
            tone="quiet"
            icon="share-outline"
            busy={busy}
            disabled={!url || (recipient && (!name.trim() || !email.trim()))}
            onPress={() => void share("link")}
          >
            Share another way
          </Button>
          <Text
            style={{
              fontSize: 11,
              lineHeight: 18,
              color: C.muted,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            You choose the recipient and send the message. DUIT never sends it
            for you.
          </Text>
        </>
      )}
    </Sheet>
  );
}
