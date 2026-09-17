import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import {
  Button,
  Field,
  Notice,
  Sheet,
  Body,
  C,
  Label,
  Divider,
  RemoteImage,
  Title,
} from "./ui";
import { usePilot } from "./store";
import { AiJobPendingError } from "./aiJobs";
export function AIReview({
  visible,
  onClose,
  task,
  title,
  input,
  mediaIds,
  originalImageUrl,
  onApply,
  onPerson,
}: {
  visible: boolean;
  onClose: () => void;
  task: string;
  title: string;
  input: any;
  mediaIds?: string[];
  originalImageUrl?: string;
  onApply?: (result: any) => Promise<void> | void;
  onPerson?: (id: string) => void;
}) {
  const { ai, capabilities, data } = usePilot();
  const [result, setResult] = useState<any>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);
  const [pendingJobId, setPendingJobId] = useState<string>();
  async function run() {
    setBusy(true);
    setError("");
    try {
      const output = await ai(task, input, mediaIds, pendingJobId);
      setPendingJobId(undefined);
      setResult(output);
      setText(
        typeof output === "string"
          ? output
          : (output.message ??
              output.draft ??
              output.text ??
              output.transcript ??
              output.summary ??
              ""),
      );
    } catch (e) {
      setPendingJobId(e instanceof AiJobPendingError ? e.jobId : undefined);
      setError(e instanceof Error ? e.message : "This task could not finish.");
    } finally {
      setBusy(false);
    }
  }
  async function apply() {
    setApplying(true);
    try {
      await onApply?.(
        typeof result === "string"
          ? text
          : {
              ...result,
              ...(task === "followup_draft"
                ? { message: text, draft: text }
                : task === "transcribe"
                  ? { text, transcript: text }
                  : task === "meeting_summary"
                    ? { summary: text }
                    : {}),
            },
      );
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not apply this suggestion.",
      );
    } finally {
      setApplying(false);
    }
  }
  return (
    <Sheet
      visible={visible}
      title={title}
      subtitle="An extra pair of hands. You make the final call."
      onClose={onClose}
      footer={
        result && onApply ? (
          <Button busy={applying} onPress={() => void apply()}>
            {task.includes("cleanup")
              ? "Use this reviewed image"
              : "Use reviewed suggestion"}
          </Button>
        ) : undefined
      }
    >
      <View
        style={{
          backgroundColor: C.teal,
          borderRadius: 20,
          padding: 22,
          marginBottom: 22,
        }}
      >
        <Label color={C.lime}>DUIT ASSIST</Label>
        <Body style={{ color: C.white, marginTop: 12 }}>
          Suggestions are drafts. Check names, dates and details before using
          them.
        </Body>
      </View>
      {!capabilities.enabled ? (
        <Notice>
          {capabilities.reason ??
            "AI is not connected yet. You can continue manually."}
        </Notice>
      ) : (
        <Button onPress={() => void run()} busy={busy} icon="sparkles-outline">
          {pendingJobId
            ? "Check this request"
            : result
              ? "Try another draft"
              : "Create a suggestion"}
        </Button>
      )}
      {busy && (
        <Body
          muted
          style={{ marginTop: 15, textAlign: "center", fontSize: 13 }}
        >
          Working from the details you provided…
        </Body>
      )}
      {error && (
        <View style={{ marginTop: 16 }}>
          <Notice error>{error}</Notice>
        </View>
      )}
      {result && (
        <>
          <Divider />
          {result.warnings?.map((warning: string, i: number) => (
            <Notice key={i}>{warning}</Notice>
          ))}
          {["followup_draft", "transcribe", "meeting_summary"].includes(
            task,
          ) ? (
            <>
              <Field
                label={
                  task === "transcribe"
                    ? "Your transcript"
                    : task === "meeting_summary"
                      ? "Review the recap"
                      : "Review your message"
                }
                value={text}
                onChangeText={setText}
                multiline
                style={{ minHeight: 200 }}
              />
              {result.commitments?.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Label>EXPLICIT PROMISES IN YOUR NOTE</Label>
                  {result.commitments.map((item: any, i: number) => (
                    <Body key={i} style={{ fontSize: 14, marginTop: 10 }}>
                      • {item.text}
                    </Body>
                  ))}
                </View>
              )}
              {result.suggestedNextStep && (
                <>
                  <Label>A SUGGESTED NEXT STEP</Label>
                  <Body style={{ marginTop: 10, marginBottom: 18 }}>
                    {result.suggestedNextStep}
                  </Body>
                </>
              )}
            </>
          ) : task === "card_extract" ? (
            <>
              {Object.entries(result.fields ?? {}).map(([key, value]) => (
                <Field
                  key={key}
                  label={
                    key[0].toUpperCase() +
                    key.slice(1) +
                    (result.uncertainFields?.includes(key)
                      ? " · please check"
                      : "")
                  }
                  value={String(value ?? "")}
                  onChangeText={(v) =>
                    setResult({
                      ...result,
                      fields: { ...result.fields, [key]: v },
                    })
                  }
                />
              ))}
              {result.rawText && (
                <>
                  <Label>TEXT READ FROM THE ORIGINAL</Label>
                  <Body
                    muted
                    style={{ fontSize: 12, marginTop: 10, marginBottom: 20 }}
                  >
                    {result.rawText}
                  </Body>
                </>
              )}
            </>
          ) : task === "profile_draft" ? (
            <>
              <Title size={25}>{result.headline}</Title>
              <Body muted style={{ marginTop: 13, marginBottom: 23 }}>
                {result.summary}
              </Body>
              {result.panels?.map((p: any, i: number) => (
                <View key={p.panelType} style={{ marginBottom: 23 }}>
                  <Label>
                    {String(i + 1).padStart(2, "0")} / {p.panelType}
                  </Label>
                  <Body style={{ marginTop: 9 }}>{p.body}</Body>
                </View>
              ))}
              <Notice>
                These will open as unapproved drafts in your card editor. You
                can change every word.
              </Notice>
            </>
          ) : task.includes("cleanup") ? (
            <>
              {originalImageUrl && (
                <>
                  <Label>ORIGINAL</Label>
                  <RemoteImage
                    uri={originalImageUrl}
                    contain
                    style={{
                      height: 230,
                      width: "100%",
                      borderRadius: 18,
                      backgroundColor: C.white,
                      marginTop: 12,
                      marginBottom: 22,
                    }}
                  />
                </>
              )}
              <Label>SUGGESTED · NOT SAVED TO YOUR CARD YET</Label>
              <RemoteImage
                uri={result.images?.[0]?.url}
                contain
                style={{
                  height: 300,
                  width: "100%",
                  borderRadius: 18,
                  backgroundColor: C.white,
                  marginTop: 12,
                  marginBottom: 20,
                }}
              />
              <Notice>
                Check that the person, text and business details are unchanged.
                Keep your original if anything looks wrong.
              </Notice>
            </>
          ) : task === "network_search" ? (
            <>
              <Body>{result.answer}</Body>
              {result.matches?.map((m: any, i: number) => (
                <View key={m.personId} style={{ marginTop: 19 }}>
                  <Label>
                    {data.people.find((p) => p.id === m.personId)?.name ??
                      "CONNECTION " + (i + 1)}
                  </Label>
                  <Body style={{ marginTop: 8 }}>{m.reason}</Body>
                  {onPerson && (
                    <Button
                      tone="secondary"
                      small
                      onPress={() => {
                        onClose();
                        onPerson(m.personId);
                      }}
                      style={{ alignSelf: "flex-start", marginTop: 12 }}
                    >
                      Open person
                    </Button>
                  )}
                </View>
              ))}
            </>
          ) : (
            <Body>{text}</Body>
          )}
          <Notice>
            Your source information stays unchanged until you explicitly save.
          </Notice>
        </>
      )}
    </Sheet>
  );
}
