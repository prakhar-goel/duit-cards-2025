import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Platform, Modal } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as Location from "expo-location";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePilot } from "./store";
import { get, post, upload } from "./api";
import { blankCapture, validCapture } from "./domain";
import type { CaptureDraft, Person } from "./types";
import {
  C,
  s,
  Sheet,
  Title,
  Body,
  Label,
  Button,
  Field,
  Notice,
  Icon,
  Pill,
  RemoteImage,
  Divider,
} from "./ui";
import { AIReview } from "./AI";
import { DateTimeField } from "./DateTimeField";
export async function chooseImage(camera = false, purpose = "portrait") {
  if (camera) {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (!p.granted)
      throw new Error(
        "Camera access is off. Choose a photo or enter the details instead.",
      );
  }
  const result = await (camera
    ? ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.9 })
    : ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.9,
      }));
  if (result.canceled) return null;
  const asset = result.assets[0];
  const scaled = await ImageManipulator.manipulateAsync(
    asset.uri,
    asset.width > 1800 ? [{ resize: { width: 1800 } }] : [],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
  );
  const res = await upload(
    scaled.uri,
    "image/jpeg",
    "duit-" + purpose + ".jpg",
    purpose,
  );
  return { ...res.media, localUri: scaled.uri };
}
export function CaptureSheet({
  visible,
  existing,
  onClose,
  onSaved,
}: {
  visible: boolean;
  existing?: Person | null;
  onClose: () => void;
  onSaved: (id?: string) => void;
}) {
  const { capture, notify, capabilities, refresh } = usePilot();
  const [step, setStep] = useState<"choose" | "form">("choose");
  const [draft, setDraft] = useState<CaptureDraft>(blankCapture());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [image, setImage] = useState<any>(null);
  const [aiTask, setAiTask] = useState("");
  const [qr, setQr] = useState(false);
  const [pasteLink, setPasteLink] = useState(false);
  const [cardLink, setCardLink] = useState("");
  const [scanned, setScanned] = useState<any>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const audioState = useAudioRecorderState(recorder, 250);
  const [audio, setAudio] = useState<any>(null);
  const [locating, setLocating] = useState(false);
  const [recording, setRecording] = useState(false);
  useEffect(() => {
    if (visible) {
      setDraft({
        ...blankCapture(),
        ...(existing
          ? {
              personId: existing.id,
              name: existing.name,
              role: existing.role,
              company: existing.company,
              email: existing.email ?? "",
              phone: existing.phone ?? "",
            }
          : {}),
      });
      setStep(existing ? "form" : "choose");
      setError("");
      setImage(null);
      setAudio(null);
      setScanned(null);
      setPasteLink(false);
      setCardLink("");
    }
  }, [visible, existing?.id]);
  const change = (k: keyof CaptureDraft, v: any) =>
    setDraft((d) => ({ ...d, [k]: v }));
  async function save() {
    setBusy(true);
    setError("");
    try {
      const parsedDate = new Date(draft.occurredAt);
      if (Number.isNaN(parsedDate.valueOf()))
        throw new Error("Choose a valid meeting date and time.");
      const result = await capture({
        ...draft,
        occurredAt: parsedDate.toISOString(),
      });
      notify(
        result.queued
          ? "Saved here. We’ll sync this meeting when online."
          : "A little context, safely remembered.",
      );
      onSaved(result.personId);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save this capture.");
    } finally {
      setBusy(false);
    }
  }
  async function selectImage(camera: boolean) {
    setBusy(true);
    setError("");
    try {
      const asset = await chooseImage(camera, "business_card");
      if (asset) {
        setImage(asset);
        change("businessCardUrl", asset.url);
        setStep("form");
        if (capabilities.enabled) setAiTask("card_extract");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open this image.");
    } finally {
      setBusy(false);
    }
  }
  async function locate() {
    setLocating(true);
    setError("");
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      if (!p.granted)
        throw new Error("Location access is off. You can type a place below.");
      const point = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      change("coordinates", {
        latitude: point.coords.latitude,
        longitude: point.coords.longitude,
      });
      try {
        const places = await Location.reverseGeocodeAsync(point.coords);
        const place = places[0];
        if (place)
          change(
            "location",
            [place.name, place.city].filter(Boolean).join(", "),
          );
      } catch {
        notify("Location saved. You can add a place name too.");
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not locate this meeting.",
      );
    } finally {
      setLocating(false);
    }
  }
  async function toggleRecording() {
    setError("");
    try {
      if (recording) {
        await recorder.stop();
        setRecording(false);
        await setAudioModeAsync({ allowsRecording: false });
        if (recorder.uri) {
          setBusy(true);
          const uploaded = await upload(
            recorder.uri,
            Platform.OS === "web" ? "audio/webm" : "audio/mp4",
            Platform.OS === "web" ? "meeting.webm" : "meeting.m4a",
            "voice_note",
          );
          setAudio(uploaded.media);
          setBusy(false);
        }
        return;
      }
      const p = await requestRecordingPermissionsAsync();
      if (!p.granted)
        throw new Error("Microphone access is off. Type your note instead.");
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record({ forDuration: 120 });
      setRecording(true);
    } catch (e) {
      setRecording(false);
      setBusy(false);
      setError(e instanceof Error ? e.message : "Could not record a note.");
    }
  }
  async function openQR() {
    const p = cameraPermission?.granted
      ? cameraPermission
      : await requestCameraPermission();
    if (p.granted) {
      setScanned(null);
      setQr(true);
    } else
      setError(
        "Camera access is off. Ask the person to share their link instead.",
      );
  }
  async function scan(value: string) {
    setQr(false);
    setBusy(true);
    setError("");
    try {
      const u = new URL(value);
      const parts = u.pathname.split("/").filter(Boolean);
      let res: any;
      if (parts.includes("s") || parts.includes("share"))
        res = await get(
          "/public/shares/" + encodeURIComponent(parts[parts.length - 1]),
        );
      else
        res = await get(
          "/public/cards/" + encodeURIComponent(parts[parts.length - 1]),
        );
      setScanned(res.card);
    } catch (e) {
      setError(
        "That QR is not a published card on this DUIT server. You can add the person manually.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function saveScanned() {
    setBusy(true);
    try {
      const res = await post(`/cards/${scanned.id}/save`);
      change("personId", res.person.id);
      change("name", res.person.name);
      change("role", res.person.role);
      change("company", res.person.company);
      setScanned(null);
      setStep("form");
      await refresh();
      notify("Card saved. Add a little meeting context.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save this card.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Sheet
        visible={visible}
        title={existing ? "Keep the conversation" : "Capture a hello"}
        subtitle={
          step === "choose"
            ? "The person, the place, the thing worth remembering."
            : "A little context now. A much better memory later."
        }
        onClose={() => {
          if (recording) void recorder.stop();
          setRecording(false);
          onClose();
        }}
        footer={
          step === "form" ? (
            <Button
              busy={busy}
              disabled={!validCapture(draft) || recording}
              onPress={() => void save()}
              icon="checkmark-outline"
            >
              Save this meeting
            </Button>
          ) : undefined
        }
      >
        {error && <Notice error>{error}</Notice>}
        {step === "choose" ? (
          <>
            <View
              style={{
                backgroundColor: C.teal,
                borderRadius: 25,
                padding: 28,
                marginBottom: 24,
              }}
            >
              <View
                style={{
                  height: 68,
                  width: 68,
                  borderRadius: 20,
                  backgroundColor: C.lime,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 27,
                }}
              >
                <Icon name="scan-outline" size={38} />
              </View>
              <Text
                style={{
                  color: C.white,
                  fontSize: 30,
                  lineHeight: 36,
                  letterSpacing: -1,
                  fontWeight: "500",
                }}
              >
                The card is just{"\n"}the beginning.
              </Text>
              <Body style={{ color: "#B8CABB", fontSize: 14, marginTop: 13 }}>
                Save the introduction. Remember why it mattered.
              </Body>
              <Button
                tone="lime"
                onPress={() => void selectImage(true)}
                busy={busy}
                icon="camera-outline"
                style={{ marginTop: 25 }}
              >
                Scan a business card
              </Button>
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => void openQR()}
                style={[s.card, { flex: 1, padding: 20 }]}
              >
                <Icon name="qr-code-outline" size={27} />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: C.ink,
                    marginTop: 14,
                  }}
                >
                  Scan DUIT QR
                </Text>
                <Text style={s.hint}>A quick card exchange</Text>
              </Pressable>
              <Pressable
                onPress={() => void selectImage(false)}
                style={[s.card, { flex: 1, padding: 20 }]}
              >
                <Icon name="images-outline" size={27} />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: C.ink,
                    marginTop: 14,
                  }}
                >
                  Choose a photo
                </Text>
                <Text style={s.hint}>From your gallery</Text>
              </Pressable>
            </View>
            <Button
              tone="quiet"
              icon="create-outline"
              onPress={() => setStep("form")}
              style={{ marginTop: 20 }}
            >
              Start with a name
            </Button>
            <Button
              tone="quiet"
              small
              icon="link-outline"
              onPress={() => setPasteLink(!pasteLink)}
            >
              Paste a DUIT link
            </Button>
            {pasteLink && (
              <View style={{ marginTop: 14 }}>
                <Field
                  label="DUIT card link"
                  value={cardLink}
                  onChangeText={setCardLink}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  placeholder="https://…/c/their-card"
                />
                <Button
                  tone="secondary"
                  disabled={!cardLink.trim()}
                  busy={busy}
                  onPress={() => void scan(cardLink)}
                >
                  Open this card
                </Button>
              </View>
            )}
            {scanned && (
              <View style={[s.card, { marginTop: 20 }]}>
                <Label>FOUND ON THIS DUIT SERVER</Label>
                <Title size={24} style={{ marginTop: 12 }}>
                  {scanned.title}
                </Title>
                <Body muted style={{ marginTop: 8 }}>
                  {scanned.subtitle}
                </Body>
                <Button
                  onPress={() => void saveScanned()}
                  busy={busy}
                  style={{ marginTop: 20 }}
                >
                  Save this card
                </Button>
              </View>
            )}
          </>
        ) : (
          <>
            {image && (
              <View style={{ marginBottom: 24 }}>
                <RemoteImage
                  uri={image.localUri ?? image.url}
                  contain
                  style={{
                    height: 185,
                    width: "100%",
                    borderRadius: 18,
                    backgroundColor: C.white,
                  }}
                />
                <Button
                  tone="quiet"
                  icon="sparkles-outline"
                  onPress={() => setAiTask("card_extract")}
                  style={{ marginTop: 8 }}
                >
                  Read details with AI
                </Button>
                <Button
                  tone="quiet"
                  small
                  icon="contrast-outline"
                  onPress={() => setAiTask("card_cleanup")}
                >
                  Improve card readability
                </Button>
                {!capabilities.enabled && (
                  <Notice>
                    Card saved as a reference. AI extraction is not connected;
                    enter the details below.
                  </Notice>
                )}
              </View>
            )}
            {!existing && (
              <>
                <Field
                  label="Their name"
                  value={draft.name}
                  onChangeText={(v) => change("name", v)}
                  placeholder="Who did you meet?"
                />
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="Role"
                      value={draft.role}
                      onChangeText={(v) => change("role", v)}
                      placeholder="What they do"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="Company"
                      value={draft.company}
                      onChangeText={(v) => change("company", v)}
                      placeholder="Where they do it"
                    />
                  </View>
                </View>
                <Field
                  label="Email · optional"
                  value={draft.email}
                  onChangeText={(v) => change("email", v)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="them@company.com"
                />
                <Field
                  label="Phone · optional"
                  value={draft.phone}
                  onChangeText={(v) => change("phone", v)}
                  keyboardType="phone-pad"
                  placeholder="Include country code"
                />
                <Divider />
              </>
            )}
            {existing && (
              <View style={{ marginBottom: 22 }}>
                <Label>WITH</Label>
                <Title size={27} style={{ marginTop: 9 }}>
                  {existing.name}
                </Title>
                <Body muted style={{ marginTop: 6 }}>
                  {existing.company}
                </Body>
              </View>
            )}
            <Field
              label="What’s worth remembering?"
              value={draft.originalNote}
              onChangeText={(v) => change("originalNote", v)}
              multiline
              placeholder="What did you discuss? What do they need? What did you promise?"
            />
            {draft.recap && (
              <View style={[s.card, { marginBottom: 18 }]}>
                <Label>REVIEWED RECAP</Label>
                <Body style={{ fontSize: 13, marginTop: 8 }}>
                  {draft.recap}
                </Body>
                <Text style={s.hint}>
                  Your original note is preserved above.
                </Text>
              </View>
            )}
            <View style={{ flexDirection: "row", gap: 9, marginBottom: 20 }}>
              <Button
                tone="secondary"
                small
                icon={recording ? "stop-circle-outline" : "mic-outline"}
                onPress={() => void toggleRecording()}
                busy={busy}
                style={{ flex: 1 }}
              >
                {recording
                  ? "Stop · " +
                    Math.floor((audioState.durationMillis ?? 0) / 1000) +
                    "s"
                  : "Record my note"}
              </Button>
              <Button
                tone="secondary"
                small
                icon="sparkles-outline"
                disabled={!draft.originalNote.trim()}
                onPress={() => setAiTask("meeting_summary")}
                style={{ flex: 1 }}
              >
                Tidy my note
              </Button>
            </View>
            {audio && (
              <Notice
                action="Transcribe"
                onPress={() => setAiTask("transcribe")}
              >
                Your voice note is uploaded privately. Review the transcript
                before using it.
              </Notice>
            )}
            <Field
              label="Where did you meet?"
              value={draft.location}
              onChangeText={(v) => change("location", v)}
              placeholder="A place, venue or city"
            />
            <Button
              tone="quiet"
              small
              icon="location-outline"
              busy={locating}
              onPress={() => void locate()}
              style={{
                alignSelf: "flex-start",
                marginTop: -7,
                marginBottom: 17,
              }}
            >
              Use current location
            </Button>
            <Field
              label="Event · optional"
              value={draft.eventName}
              onChangeText={(v) => change("eventName", v)}
              placeholder="Paris AI Summit, founder dinner…"
            />
            <Label>TYPE OF MEETING</Label>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 11,
                marginBottom: 23,
              }}
            >
              {["Conference", "Coffee", "Office", "Dinner", "Call"].map((t) => (
                <Pill
                  key={t}
                  active={draft.meetingType === t}
                  onPress={() => change("meetingType", t)}
                >
                  {t}
                </Pill>
              ))}
            </View>
            <DateTimeField
              value={draft.occurredAt}
              onChange={(value) => change("occurredAt", value)}
            />
            <Field
              label="One next step · optional"
              value={draft.commitment}
              onChangeText={(v) => change("commitment", v)}
              placeholder="Send the proposal we talked about"
            />
            {draft.commitment && (
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
                <Pill
                  active={!draft.dueAt}
                  onPress={() => change("dueAt", undefined)}
                >
                  No date
                </Pill>
                <Pill
                  active={Boolean(draft.dueAt)}
                  onPress={() =>
                    change(
                      "dueAt",
                      new Date(Date.now() + 86400000).toISOString(),
                    )
                  }
                >
                  Tomorrow
                </Pill>
              </View>
            )}
            <Notice>
              Your notes and meeting location are private. They never appear on
              a shared card.
            </Notice>
          </>
        )}
      </Sheet>
      {aiTask && (
        <AIReview
          visible
          title={
            aiTask === "card_cleanup"
              ? "A clearer card. The same details."
              : aiTask === "card_extract"
                ? "Read this business card"
                : aiTask === "transcribe"
                  ? "From voice to memory"
                  : "A clearer meeting note"
          }
          task={aiTask}
          input={
            aiTask === "meeting_summary"
              ? { note: draft.originalNote, personName: draft.name }
              : aiTask === "transcribe"
                ? {}
                : {}
          }
          mediaIds={
            aiTask === "transcribe" && audio
              ? [audio.id]
              : ["card_extract", "card_cleanup"].includes(aiTask) && image
                ? [image.id]
                : undefined
          }
          originalImageUrl={image?.url}
          onClose={() => setAiTask("")}
          onApply={(result) => {
            if (aiTask === "card_cleanup") {
              const improved = result.images?.[0];
              if (!improved?.url)
                throw new Error("No improved image is available.");
              change("businessCardUrl", improved.url);
              setImage(improved);
            } else if (aiTask === "card_extract") {
              setDraft((d) => ({
                ...d,
                name: result.fields?.name ?? d.name,
                role: result.fields?.role ?? d.role,
                company: result.fields?.company ?? d.company,
                email: result.fields?.email ?? d.email,
                phone: result.fields?.phone ?? d.phone,
              }));
            } else if (aiTask === "transcribe")
              change("originalNote", result.transcript ?? result.text ?? "");
            else {
              change("recap", result.summary);
              change("proposedFollowUp", result.suggestedNextStep ?? undefined);
              if (result.commitments?.[0])
                change("commitment", result.commitments[0].text);
            }
          }}
        />
      )}
      <Modal
        visible={qr}
        onRequestClose={() => setQr(false)}
        animationType="slide"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: C.ink }}>
          <View style={[s.row, { padding: 22 }]}>
            <Text style={{ color: C.white, fontSize: 20, fontWeight: "600" }}>
              Scan their DUIT card
            </Text>
            <Pressable
              onPress={() => setQr(false)}
              accessibilityLabel="Close QR scanner"
            >
              <Icon name="close" color={C.white} />
            </Pressable>
          </View>
          {qr && (
            <CameraView
              style={{ flex: 1 }}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={({ data }) => void scan(data)}
            />
          )}
          <Text
            style={{
              color: C.white,
              padding: 24,
              textAlign: "center",
              fontSize: 14,
            }}
          >
            Point your camera at a DUIT QR code.
          </Text>
        </SafeAreaView>
      </Modal>
    </>
  );
}
