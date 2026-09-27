import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { usePilot } from "./store";
import * as ImagePicker from "expo-image-picker";
import { get, post, patch, upload } from "./api";
import { chooseImage } from "./Capture";
import { CardStory, CardArtwork } from "./CardStory";
import { AIReview } from "./AI";
import {
  Sheet,
  Field,
  Button,
  Avatar,
  Title,
  Body,
  Label,
  Notice,
  RemoteImage,
  Pill,
  C,
  s,
} from "./ui";
import { randomId } from "./domain";
import type { Card, Panel } from "./types";
const panelTypes = [
  "hook",
  "relevance",
  "offer",
  "outcome",
  "proof",
  "cta",
] as const;
export function QuickCardBuilder({
  card,
  onClose,
}: {
  card: Card | null;
  onClose: () => void;
}) {
  const { data, refresh, notify } = usePilot();
  const profile = data.user?.profile || {};
  const [form, setForm] = useState<any>(
    card || {
      title: profile.fullName || (data.user as any)?.displayName || "",
      slug: "",
      company: profile.company || "",
      role: profile.role || "",
      subtitle: "",
      bio: "",
      contact: {
        phone: (data.user as any)?.phone || profile.phone || "",
        email: data.user?.email?.endsWith("@phone.duit.invalid")
          ? ""
          : data.user?.email || "",
        website: "",
      },
      imageUrl: profile.photoUrl || null,
      businessCardUrl: null,
      businessMedia: [],
      ctaType: "enquire",
      ctaLabel: "Let’s talk",
    },
  );
  const [slugSuffix] = useState(() => randomId());
  const [step, setStep] = useState(0);
  const [brief, setBrief] = useState(card?.bio || "");
  const [panels, setPanels] = useState<Panel[]>(card?.panels || []);
  const [media, setMedia] = useState<any>(null);
  const [task, setTask] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState(card?.id);
  const [originalCard, setOriginalCard] = useState<string | null>(
    card?.businessCardUrl || null,
  );
  const [visualBrief, setVisualBrief] = useState("");
  useEffect(() => {
    if (card)
      void get(`/cards/${card.id}`)
        .then((r) => {
          setForm(r.card);
          setPanels(r.card.panels || []);
        })
        .catch((e) => setError(e.message));
  }, [card?.id]);
  function change(key: string, value: any) {
    setForm((f: any) => ({ ...f, [key]: value }));
  }
  async function photo(purpose: string, back = false) {
    setBusy(true);
    setError("");
    try {
      const uploaded = await chooseImage(false, purpose);
      if (uploaded) {
        setMedia(uploaded);
        if (purpose === "cover")
          change(
            "businessMedia",
            [
              ...(form.businessMedia || []),
              {
                url: uploaded.url,
                type: "image",
                title: form.company,
                caption: form.subtitle,
              },
            ].slice(0, 4),
          );
        else if (purpose === "business_card") {
          if (back) change("businessCardBackUrl", uploaded.url);
          else {
            change("businessCardUrl", uploaded.url);
            setOriginalCard(uploaded.url);
            setTask("card_extract");
          }
        } else change("imageUrl", uploaded.url);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload this image.");
    } finally {
      setBusy(false);
    }
  }
  async function video() {
    setBusy(true);
    setError("");
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
      });
      if (picked.canceled) return;
      const asset = picked.assets[0];
      if (
        (asset.fileSize || 0) > 12 * 1024 * 1024 ||
        (asset.mimeType && asset.mimeType !== "video/mp4")
      )
        throw new Error("Choose an MP4 video smaller than 12 MB.");
      const r = await upload(
        asset.uri,
        "video/mp4",
        asset.fileName || "business.mp4",
        "cover",
      );
      change(
        "businessMedia",
        [
          ...(form.businessMedia || []),
          { url: r.media.url, type: "video", title: form.company, caption: "" },
        ].slice(0, 4),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload video.");
    } finally {
      setBusy(false);
    }
  }
  async function cleanup(purpose: "portrait_cleanup" | "card_cleanup") {
    const url =
      purpose === "card_cleanup" ? form.businessCardUrl : form.imageUrl;
    const id = url?.match(/\/media\/([a-f0-9-]{36})/i)?.[1];
    if (!id) {
      setError("Upload your own image first so DUIT can improve it.");
      return;
    }
    setMedia({ id, url });
    setTask(purpose);
  }
  function fallbackPanels() {
    const values = [
      form.subtitle || brief || form.company,
      `Talk with ${form.title} about ${form.company || "their work"}.`,
      brief || form.bio || form.subtitle,
      "Tell us what you have in mind.",
      "Ask us about our work and the details that matter to you.",
      "Let’s talk",
    ];
    return panelTypes.map((panelType, position) => ({
      panelType,
      position,
      body: values[position],
      approved: true,
      provenance: "owner" as const,
    }));
  }
  async function save(publish: boolean) {
    setBusy(true);
    setError("");
    try {
      const slug =
        form.slug ||
        `${
          form.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || "card"
        }-${slugSuffix}`;
      const contact = Object.fromEntries(
        Object.entries(form.contact || {}).filter(([, value]) =>
          Boolean(value),
        ),
      ) as any;
      if (contact.website && !/^https?:\/\//i.test(contact.website))
        contact.website = `https://${contact.website.trim()}`;
      if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email))
        throw new Error("Check your email address.");
      if (contact.website) {
        try {
          const u = new URL(contact.website);
          if (
            !["https:", "http:"].includes(u.protocol) ||
            !u.hostname.includes(".")
          )
            throw new Error();
        } catch {
          throw new Error("Check your website address.");
        }
      }
      const payload = {
        ...form,
        slug,
        contact,
        subtitle: form.subtitle || brief.slice(0, 280),
        bio: form.bio || brief,
      };
      const saved = savedId
        ? await patch(`/cards/${savedId}`, payload)
        : await post("/cards", payload);
      const id = saved.card.id;
      setSavedId(id);
      change("slug", slug);
      const approved = (panels.length === 6 ? panels : fallbackPanels()).map(
        (p) => ({
          ...p,
          approved: true,
          provenance:
            p.provenance === "ai_suggested"
              ? "approved_ai"
              : p.provenance || "owner",
        }),
      );
      await post(`/cards/${id}/panels`, { panels: approved });
      if (publish) await post(`/cards/${id}/publish`);
      await patch("/me/profile", {
        fullName: form.title,
        company: form.company,
        role: form.role,
        bio: payload.bio,
        photoUrl: form.imageUrl || null,
        phone: form.contact?.phone || "",
        website: contact.website || null,
      });
      await refresh();
      notify(publish ? "Your card is ready to share." : "Your draft is saved.");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your card.");
    } finally {
      setBusy(false);
    }
  }
  const preview = {
    ...form,
    id: savedId || "preview",
    isPublished: false,
    panels: panels.length ? panels : fallbackPanels(),
  } as Card;
  return (
    <>
      <Sheet
        visible
        title={
          step === 2
            ? "Your introduction"
            : card
              ? "Make it yours"
              : "Let’s make your card"
        }
        onClose={() => (step ? setStep(step - 1) : onClose())}
        footer={
          <View style={{ flexDirection: "row", gap: 10 }}>
            {step === 2 && (
              <Button
                style={{ flex: 1 }}
                tone="secondary"
                busy={busy}
                onPress={() => void save(false)}
              >
                Save draft
              </Button>
            )}
            <Button
              style={{ flex: 1 }}
              busy={busy}
              disabled={
                form.title.trim().length < 2 ||
                (step > 0 &&
                  !(brief.trim() || form.bio?.trim() || form.subtitle?.trim()))
              }
              onPress={() => (step < 2 ? setStep(step + 1) : void save(true))}
            >
              {step === 2
                ? "Publish card"
                : step === 1
                  ? "Preview card"
                  : "Continue"}
            </Button>
          </View>
        }
      >
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
          {["You", "Your business", "Preview"].map((t, i) => (
            <Pill key={t} active={step === i} onPress={() => setStep(i)}>
              {t}
            </Pill>
          ))}
        </View>
        {!!error && <Notice error>{error}</Notice>}
        {step === 0 ? (
          <>
            <View style={{ alignItems: "center", marginBottom: 22 }}>
              <Avatar name={form.title} url={form.imageUrl} size={110} />
              <Button
                tone="quiet"
                icon="camera-outline"
                busy={busy}
                onPress={() => void photo("portrait")}
              >
                Add your photo
              </Button>
              {form.imageUrl && (
                <Button
                  small
                  tone="quiet"
                  icon="sparkles-outline"
                  onPress={() => void cleanup("portrait_cleanup")}
                >
                  Polish photo
                </Button>
              )}
            </View>
            <Button
              tone="secondary"
              icon="scan-outline"
              busy={busy}
              onPress={() => void photo("business_card")}
            >
              {form.businessCardUrl
                ? "Replace visiting card"
                : "Start with a visiting card"}
            </Button>
            {form.businessCardUrl && (
              <>
                <CardArtwork
                  uri={form.businessCardUrl}
                  name={form.title}
                  height={170}
                />
                <Button
                  small
                  tone="quiet"
                  icon="sparkles-outline"
                  onPress={() => void cleanup("card_cleanup")}
                >
                  Clean up card
                </Button>
                {originalCard && originalCard !== form.businessCardUrl && (
                  <Button
                    small
                    tone="quiet"
                    onPress={() => change("businessCardUrl", originalCard)}
                  >
                    Restore original
                  </Button>
                )}
              </>
            )}
            {form.businessCardUrl && (
              <>
                <Button
                  small
                  tone="quiet"
                  onPress={() => void photo("business_card", true)}
                >
                  {form.businessCardBackUrl
                    ? "Replace reverse side"
                    : "Add reverse side · optional"}
                </Button>
                {form.businessCardBackUrl && (
                  <>
                    <CardArtwork
                      uri={form.businessCardBackUrl}
                      name={form.title}
                      height={140}
                    />
                    <Button
                      small
                      tone="quiet"
                      onPress={() => change("businessCardBackUrl", null)}
                    >
                      Remove reverse side
                    </Button>
                  </>
                )}
              </>
            )}
            <Field
              label="Your name"
              value={form.title}
              onChangeText={(v) => change("title", v)}
            />
            <Field
              label="Company"
              value={form.company}
              onChangeText={(v) => change("company", v)}
            />
            <Field
              label="Your role"
              value={form.role}
              onChangeText={(v) => change("role", v)}
            />
            <Field
              label="Website · optional"
              value={form.contact?.website || ""}
              onChangeText={(v) =>
                change("contact", { ...form.contact, website: v })
              }
              autoCapitalize="none"
              keyboardType="url"
              placeholder="https://yourcompany.com"
            />
            <Field
              label="Email · optional"
              value={form.contact.email || ""}
              onChangeText={(v) =>
                change("contact", { ...form.contact, email: v })
              }
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Field
              label="Business phone"
              value={form.contact?.phone || ""}
              onChangeText={(v) =>
                change("contact", { ...form.contact, phone: v })
              }
              keyboardType="phone-pad"
            />
            <Field
              label="Address · optional"
              value={form.contact.address || ""}
              onChangeText={(v) =>
                change("contact", { ...form.contact, address: v })
              }
            />
          </>
        ) : step === 1 ? (
          <>
            <Field
              label="What do you do, and who do you help?"
              value={brief}
              onChangeText={setBrief}
              multiline
              placeholder="A few plain words. We’ll help with the rest."
            />
            <Button
              icon="sparkles-outline"
              disabled={!brief.trim() && !form.company}
              onPress={() => setTask("profile_draft")}
            >
              {card ? "Improve with AI" : "Shape my introduction"}
            </Button>
            <Field
              label="Your opening line"
              value={form.subtitle || ""}
              onChangeText={(v) => change("subtitle", v)}
              multiline
            />
            <Field
              label="About your business"
              value={form.bio || ""}
              onChangeText={(v) => change("bio", v)}
              multiline
            />
            <Label>SHOW YOUR WORK</Label>
            <Body muted style={{ marginTop: 10, marginBottom: 16 }}>
              Products, places, projects. Up to four business slides.
            </Body>
            {(form.businessMedia || []).map((m: any, i: number) => (
              <View key={i} style={{ marginBottom: 22 }}>
                {m.type === "video" ? (
                  <View style={{ padding: 22, backgroundColor: C.soft }}>
                    <Body>Video · {m.title || form.company}</Body>
                  </View>
                ) : (
                  <RemoteImage
                    uri={m.url}
                    contain
                    style={{ width: "100%", height: 220 }}
                  />
                )}
                <Field
                  label="Slide title"
                  value={m.title}
                  onChangeText={(v) =>
                    change(
                      "businessMedia",
                      form.businessMedia.map((item: any, j: number) =>
                        i === j ? { ...item, title: v } : item,
                      ),
                    )
                  }
                />
                <Field
                  label="Caption"
                  value={m.caption}
                  onChangeText={(v) =>
                    change(
                      "businessMedia",
                      form.businessMedia.map((item: any, j: number) =>
                        i === j ? { ...item, caption: v } : item,
                      ),
                    )
                  }
                />
                <Button
                  small
                  tone="quiet"
                  onPress={() =>
                    change(
                      "businessMedia",
                      form.businessMedia.filter((_: any, j: number) => j !== i),
                    )
                  }
                >
                  Remove
                </Button>
              </View>
            ))}
            {(form.businessMedia || []).length < 4 && (
              <>
                <Button
                  tone="secondary"
                  icon="image-outline"
                  busy={busy}
                  onPress={() => void photo("cover")}
                >
                  Add a business photo
                </Button>
                <Button
                  tone="quiet"
                  icon="videocam-outline"
                  busy={busy}
                  onPress={() => void video()}
                >
                  Add a short video
                </Button>
                <Field
                  label="Describe a visual · optional"
                  value={visualBrief}
                  onChangeText={setVisualBrief}
                  placeholder="A warm café counter with freshly roasted coffee"
                  multiline
                />
                <Button
                  tone="quiet"
                  icon="sparkles-outline"
                  disabled={!visualBrief.trim()}
                  onPress={() => setTask("business_visual")}
                >
                  Create a visual
                </Button>
              </>
            )}
            <Field
              label="Action button"
              value={form.ctaLabel}
              onChangeText={(v) => change("ctaLabel", v)}
              placeholder="Let’s talk"
            />
            {panels.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Label>YOUR PITCH</Label>
                {panels.map((p, i) => (
                  <Field
                    key={p.panelType}
                    label={p.panelType}
                    value={p.body}
                    multiline
                    onChangeText={(body) =>
                      setPanels((values) =>
                        values.map((v, j) =>
                          i === j ? { ...v, body, approved: false } : v,
                        ),
                      )
                    }
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            <CardStory card={preview} initialPage="Person" />
            <Body muted style={{ marginVertical: 20 }}>
              Check your images, contact details and wording. Publishing makes
              this card available to anyone with its link.
            </Body>
          </>
        )}
      </Sheet>
      {!!task && (
        <AIReview
          visible
          task={task}
          title={
            task === "card_extract"
              ? "Read your visiting card"
              : task === "card_cleanup"
                ? "A fresh finish, same identity"
                : task === "business_visual"
                  ? "Bring your work to life"
                  : "Your work, in a good light"
          }
          input={
            task === "profile_draft"
              ? {
                  name: form.title,
                  company: form.company,
                  role: form.role,
                  brief,
                  existingProfile: form.bio,
                  website: form.contact.website,
                  contact: form.contact,
                }
              : task === "business_visual"
                ? {
                    brief: visualBrief,
                    business: brief || form.bio,
                    company: form.company,
                  }
                : { preserveIdentity: true }
          }
          mediaIds={
            ["card_extract", "card_cleanup", "portrait_cleanup"].includes(
              task,
            ) && media
              ? [media.id]
              : undefined
          }
          originalImageUrl={media?.url}
          onClose={() => setTask("")}
          onApply={(r) => {
            if (task === "card_extract") {
              const f = r.fields || {};
              setForm((v: any) => ({
                ...v,
                title: f.name || v.title,
                company: f.company || v.company,
                role: f.role || v.role,
                contact: {
                  ...v.contact,
                  ...Object.fromEntries(
                    ["email", "phone", "website", "address"]
                      .filter((k) => f[k])
                      .map((k) => [k, f[k]]),
                  ),
                },
              }));
              setBrief(r.rawText || "");
            } else if (task === "profile_draft") {
              change("subtitle", r.headline);
              change("bio", r.summary);
              if (r.cta?.label)
                change(
                  "ctaLabel",
                  r.cta.label.split(/\s+/).slice(0, 2).join(" "),
                );
              setVisualBrief(
                `An editorial photograph reflecting this business: ${r.summary}`.slice(
                  0,
                  1500,
                ),
              );
              setPanels(
                r.panels.map((p: any, position: number) => ({
                  ...p,
                  position,
                  approved: false,
                  provenance: "ai_suggested",
                })),
              );
            } else if (task === "business_visual")
              change(
                "businessMedia",
                [
                  ...(form.businessMedia || []),
                  {
                    url: r.images[0].url,
                    type: "image",
                    title: form.company,
                    caption: visualBrief.slice(0, 240),
                  },
                ].slice(0, 4),
              );
            else
              change(
                task === "card_cleanup" ? "businessCardUrl" : "imageUrl",
                r.images[0].url,
              );
          }}
        />
      )}
    </>
  );
}
