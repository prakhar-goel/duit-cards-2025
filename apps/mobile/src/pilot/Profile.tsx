import React, { useState } from "react";
import { View } from "react-native";
import { usePilot } from "./store";
import { patch } from "./api";
import { chooseImage } from "./Capture";
import { Avatar, Body, Button, Field, Notice, Sheet } from "./ui";
export function ProfileEditor({ onClose }: { onClose: () => void }) {
  const { data, refresh, notify } = usePilot();
  const p = data.user?.profile ?? {};
  const [form, setForm] = useState<any>({
    fullName: p.fullName || (data.user as any)?.displayName || "",
    headline: p.headline ?? "",
    company: p.company ?? "",
    role: p.role ?? "",
    bio: p.bio ?? "",
    city: p.city ?? "",
    countryCode: p.countryCode ?? "",
    photoUrl: p.photoUrl ?? null,
    website: p.website ?? "",
    phone: p.phone ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  async function photo() {
    setBusy(true);
    try {
      const media = await chooseImage(false, "portrait");
      if (media) change("photoUrl", media.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not choose this photo.");
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      await patch("/me/profile", { ...form, website: form.website || null });
      await refresh();
      notify("Your account profile is updated.");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your profile.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet
      visible
      title="A little about you"
      subtitle="Your account identity. Published cards are edited separately."
      onClose={onClose}
      footer={
        <Button
          busy={busy}
          disabled={form.fullName.trim().length < 2}
          onPress={() => void save()}
        >
          Save profile
        </Button>
      }
    >
      <View style={{ alignItems: "center", marginBottom: 25 }}>
        <Avatar name={form.fullName} url={form.photoUrl} size={104} square />
        <Button
          tone="quiet"
          small
          icon="image-outline"
          busy={busy}
          onPress={() => void photo()}
          style={{ marginTop: 11 }}
        >
          Choose portrait
        </Button>
      </View>
      {error && <Notice error>{error}</Notice>}
      {[
        ["fullName", "Your name"],
        ["headline", "One-line introduction"],
        ["company", "Company"],
        ["role", "Role"],
        ["city", "City"],
        ["countryCode", "Country code"],
        ["phone", "Phone"],
        ["website", "Website"],
        ["bio", "A little more about your work"],
      ].map(([key, label]) => (
        <Field
          key={key}
          label={label}
          value={form[key]}
          onChangeText={(v) => change(key, v)}
          multiline={["headline", "bio"].includes(key)}
          autoCapitalize={key === "website" ? "none" : "sentences"}
          keyboardType={
            key === "phone"
              ? "phone-pad"
              : key === "website"
                ? "url"
                : "default"
          }
        />
      ))}
      <Notice>
        Updating your account does not silently change a published card. Review
        and publish card edits separately.
      </Notice>
    </Sheet>
  );
}
