import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { layout } from "../theme/layout";
import { getAiFollowUpContent, getPlanBullets } from "./mockAi";
import {
  buildProfilePayload,
  canProceed,
  firstName,
  nextStepIndex,
  ONBOARDING_STEPS,
  type OnboardingForm,
  type OnboardingProfilePayload,
  type OnboardingStepId,
  type NetworkingIntentId,
  prevStepIndex,
} from "./state";

const ACCENT_ORANGE = "#EA580C";
const CTA_GREEN = "#16A34A";
const CTA_GREEN_DISABLED = "#BBD9C3";
const TEXT_PRIMARY = "#0F172A";
const TEXT_MUTED = "#64748B";

const INITIAL_FORM: OnboardingForm = {
  fullName: "",
  roleTitle: "",
  company: "",
  website: "",
  websiteChoiceMade: false,
  networkingIntents: [],
  aiFollowUpChoice: null,
};

const DISPLAY_NAME_OPTIONS: { id: string; emoji: string; label: string }[] = [
  { id: "n1", emoji: "👋", label: "Alex Chen" },
  { id: "n2", emoji: "👋", label: "Jordan Lee" },
  { id: "n3", emoji: "👋", label: "Sam Rivera" },
  { id: "n4", emoji: "👋", label: "Priya Sharma" },
  { id: "n5", emoji: "👋", label: "Marcus Webb" },
  { id: "n6", emoji: "👋", label: "Taylor Kim" },
];

const ROLE_OPTIONS: { id: string; emoji: string; label: string }[] = [
  { id: "r1", emoji: "🎯", label: "Founder / CEO" },
  { id: "r2", emoji: "📱", label: "Product Manager" },
  { id: "r3", emoji: "🎨", label: "Designer" },
  { id: "r4", emoji: "⚙️", label: "Engineer" },
  { id: "r5", emoji: "📣", label: "Marketing / Growth" },
  { id: "r6", emoji: "🤝", label: "Sales / BD" },
  { id: "r7", emoji: "💼", label: "Consultant / Freelancer" },
  { id: "r8", emoji: "📊", label: "Finance / Operations" },
];

const COMPANY_OPTIONS: { id: string; emoji: string; label: string }[] = [
  { id: "c1", emoji: "🚀", label: "Early-stage startup" },
  { id: "c2", emoji: "🏢", label: "Growth company" },
  { id: "c3", emoji: "🏛️", label: "Enterprise" },
  { id: "c4", emoji: "🛠️", label: "Agency / Studio" },
  { id: "c5", emoji: "🎓", label: "University / Research" },
  { id: "c6", emoji: "💡", label: "Independent / solo" },
  { id: "c7", emoji: "🌐", label: "Nonprofit / community" },
];

const WEBSITE_OPTIONS: { id: string; emoji: string; label: string; value: string }[] = [
  { id: "w0", emoji: "🚫", label: "No website for now", value: "" },
  { id: "w1", emoji: "💼", label: "LinkedIn is my main presence", value: "linkedin.com" },
  { id: "w2", emoji: "🏢", label: "Company / team site", value: "company.website" },
  { id: "w3", emoji: "🎨", label: "Portfolio or project site", value: "portfolio.site" },
];

const NETWORKING_OPTIONS: { id: NetworkingIntentId; emoji: string; label: string }[] = [
  { id: "pitch_product", emoji: "🚀", label: "Pitch my product or service" },
  { id: "communicate_brand", emoji: "✨", label: "Communicate my brand" },
  { id: "partnerships", emoji: "🤝", label: "Find partners or collaborators" },
  { id: "hire", emoji: "👥", label: "Hire or recruit" },
  { id: "learn_peers", emoji: "💡", label: "Learn from peers" },
  { id: "investment", emoji: "📈", label: "Investment or fundraising" },
];

type Props = {
  onComplete: (payload: OnboardingProfilePayload) => void;
};

export function OnboardingWizard({ onComplete }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<OnboardingForm>(INITIAL_FORM);

  const step = ONBOARDING_STEPS[stepIndex];
  const totalSteps = ONBOARDING_STEPS.length;
  const aiContent = useMemo(() => getAiFollowUpContent(form), [form]);
  const planBullets = useMemo(() => getPlanBullets(form), [form]);

  useEffect(() => {
    const validIds = new Set(aiContent.options.map((o) => o.id));
    if (form.aiFollowUpChoice && !validIds.has(form.aiFollowUpChoice)) {
      setForm((f) => ({ ...f, aiFollowUpChoice: null }));
    }
  }, [aiContent.options, form.aiFollowUpChoice]);

  const disableContinue = !canProceed(step, form);

  const ctaLabel =
    step === "complete" ? "Enter Duit Cards" : "Continue";

  function finish(payload: OnboardingProfilePayload) {
    onComplete(payload);
  }

  function handlePrimaryPress() {
    if (step === "complete") {
      finish(buildProfilePayload(form));
      return;
    }
    if (!canProceed(step, form)) return;
    setStepIndex((i) => nextStepIndex(i));
  }

  function handleBack() {
    setStepIndex((i) => prevStepIndex(i));
  }

  return (
    <LinearGradient
      colors={["#FFF4EC", "#F3EDFF", "#FFFFFF"]}
      locations={[0, 0.38, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0.45 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            style={[styles.iconBtn, stepIndex === 0 && styles.iconBtnHidden]}
            disabled={stepIndex === 0}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={26} color={TEXT_PRIMARY} />
          </Pressable>
          <Pressable
            onPress={() => finish(buildProfilePayload(form))}
            hitSlop={12}
            style={styles.skipWrap}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.progressTrack}>
          {ONBOARDING_STEPS.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.progressSeg,
                idx <= stepIndex ? styles.progressSegFill : styles.progressSegRest,
              ]}
            />
          ))}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderStepBody(
            step,
            form,
            setForm,
            aiContent,
            planBullets,
            (id) => {
              setForm((curr) => {
                const on = curr.networkingIntents.includes(id);
                return {
                  ...curr,
                  networkingIntents: on
                    ? curr.networkingIntents.filter((x) => x !== id)
                    : [...curr.networkingIntents, id],
                };
              });
            },
            (id) => setForm((f) => ({ ...f, aiFollowUpChoice: id }))
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step === "name" && (
            <Text style={styles.disclaimer}>
              Pick a display name — you can change it anytime in settings.
            </Text>
          )}
          <Pressable
            onPress={handlePrimaryPress}
            style={[
              styles.cta,
              disableContinue && step !== "complete" && styles.ctaDisabled,
            ]}
            disabled={disableContinue && step !== "complete"}
          >
            <Text
              style={[
                styles.ctaText,
                disableContinue && step !== "complete" && styles.ctaTextDisabled,
              ]}
            >
              {ctaLabel}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function renderStepBody(
  step: OnboardingStepId,
  form: OnboardingForm,
  setForm: React.Dispatch<React.SetStateAction<OnboardingForm>>,
  aiContent: ReturnType<typeof getAiFollowUpContent>,
  planBullets: string[],
  onToggleIntent: (id: NetworkingIntentId) => void,
  onSelectAiOption: (id: string) => void
) {
  const fn = firstName(form.fullName);

  switch (step) {
    case "name":
      return (
        <View style={styles.block}>
          <Text style={styles.questionTitle}>How should we greet you?</Text>
          <Text style={styles.questionHint}>Tap one option — no typing needed</Text>
          <View style={styles.listGap}>
            {DISPLAY_NAME_OPTIONS.map((opt) => {
              const selected = form.fullName === opt.label;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setForm((f) => ({ ...f, fullName: opt.label }))}
                  style={[styles.optionRow, selected && styles.optionRowSelected]}
                  accessibilityRole="button"
                  accessibilityLabel={opt.label}
                >
                  <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                    {opt.label}
                  </Text>
                  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      );

    case "story":
      return (
        <View style={styles.centerBlock}>
          <Text style={styles.storyText}>
            You have made your first step toward{" "}
            <Text style={styles.storyAccent}>{fn}&apos;s</Text> professional network.
          </Text>
        </View>
      );

    case "role_title":
      return (
        <View style={styles.block}>
          <Text style={styles.questionTitle}>Hi {fn}, what best describes your role?</Text>
          <Text style={styles.questionHint}>Choose the closest match</Text>
          <View style={styles.listGap}>
            {ROLE_OPTIONS.map((opt) => {
              const selected = form.roleTitle === opt.label;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setForm((f) => ({ ...f, roleTitle: opt.label }))}
                  style={[styles.optionRow, selected && styles.optionRowSelected]}
                  accessibilityRole="button"
                  accessibilityLabel={opt.label}
                >
                  <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                    {opt.label}
                  </Text>
                  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      );

    case "company":
      return (
        <View style={styles.block}>
          <Text style={styles.questionTitle}>What kind of organization are you with?</Text>
          <Text style={styles.questionHint}>We use this to tune your card layout</Text>
          <View style={styles.listGap}>
            {COMPANY_OPTIONS.map((opt) => {
              const selected = form.company === opt.label;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setForm((f) => ({ ...f, company: opt.label }))}
                  style={[styles.optionRow, selected && styles.optionRowSelected]}
                  accessibilityRole="button"
                  accessibilityLabel={opt.label}
                >
                  <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                    {opt.label}
                  </Text>
                  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      );

    case "website":
      return (
        <View style={styles.block}>
          <Text style={styles.questionTitle}>How do you show up online?</Text>
          <Text style={styles.questionHint}>
            Pick one — we will tailor suggestions (mock for now)
          </Text>
          <View style={styles.listGap}>
            {WEBSITE_OPTIONS.map((opt) => {
              const selected = form.websiteChoiceMade && form.website === opt.value;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() =>
                    setForm((f) => ({
                      ...f,
                      website: opt.value,
                      websiteChoiceMade: true,
                    }))
                  }
                  style={[styles.optionRow, selected && styles.optionRowSelected]}
                  accessibilityRole="button"
                  accessibilityLabel={opt.label}
                >
                  <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                    {opt.label}
                  </Text>
                  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      );

    case "networking":
      return (
        <View style={styles.block}>
          <Text style={styles.questionTitle}>What are you looking for when you network?</Text>
          <Text style={styles.questionHint}>Choose all that apply</Text>
          <View style={styles.listGap}>
            {NETWORKING_OPTIONS.map((item) => {
              const selected = form.networkingIntents.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => onToggleIntent(item.id)}
                  style={[styles.optionRow, selected && styles.optionRowSelected]}
                >
                  <Text style={styles.optionEmoji}>{item.emoji}</Text>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                    {item.label}
                  </Text>
                  <View style={[styles.checkOuter, selected && styles.checkOuterSelected]}>
                    {selected ? (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      );

    case "ai_followup":
      return (
        <View style={styles.block}>
          <Text style={styles.questionTitle}>{aiContent.headline}</Text>
          <Text style={styles.questionHint}>{aiContent.subtitle}</Text>
          <View style={styles.listGap}>
            {aiContent.options.map((opt) => {
              const selected = form.aiFollowUpChoice === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => onSelectAiOption(opt.id)}
                  style={[styles.optionRow, selected && styles.optionRowSelected]}
                >
                  <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                    {opt.label}
                  </Text>
                  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      );

    case "plan_summary":
      return (
        <View style={styles.block}>
          <Text style={styles.questionTitle}>Got it! We will help you:</Text>
          <View style={styles.listGap}>
            {planBullets.map((line, i) => (
              <View key={i} style={styles.planRow}>
                <Ionicons name="checkmark-circle" size={22} color={CTA_GREEN} />
                <Text style={styles.planText}>{line}</Text>
              </View>
            ))}
          </View>
        </View>
      );

    case "complete":
      return (
        <View style={styles.centerBlock}>
          <Text style={styles.questionTitle}>You are ready, {fn}</Text>
          <Text style={styles.questionHint}>
            Your workspace is tuned from what you shared. You can change everything later in settings.
          </Text>
        </View>
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    maxWidth: layout.contentMaxWidth,
    paddingHorizontal: 8,
    paddingTop: 4,
    minHeight: 44,
    width: "100%",
  },
  iconBtn: { width: 44, height: 44, justifyContent: "center", alignItems: "flex-start" },
  iconBtnHidden: { opacity: 0 },
  skipWrap: { paddingHorizontal: 12, paddingVertical: 8 },
  skipText: { color: "#475569", fontSize: 16, fontWeight: "600" },
  progressTrack: {
    alignSelf: "center",
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 8,
    maxWidth: layout.contentMaxWidth,
    width: "100%",
  },
  progressSeg: { flex: 1, height: 4, borderRadius: 999 },
  progressSegFill: { backgroundColor: TEXT_PRIMARY },
  progressSegRest: { backgroundColor: "#E2E8F0" },
  scroll: { flex: 1 },
  scrollContent: {
    alignSelf: "center",
    maxWidth: layout.contentMaxWidth,
    paddingHorizontal: 22,
    paddingBottom: 24,
    flexGrow: 1,
    width: "100%",
  },
  block: { paddingTop: 8, gap: 8 },
  centerBlock: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 32,
    gap: 12,
  },
  questionTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  questionHint: {
    fontSize: 15,
    color: TEXT_MUTED,
    lineHeight: 22,
    marginTop: -4,
    marginBottom: 8,
  },
  storyText: {
    fontSize: 24,
    fontWeight: "600",
    color: TEXT_PRIMARY,
    lineHeight: 34,
    textAlign: "center",
  },
  storyAccent: { color: ACCENT_ORANGE, fontWeight: "800" },
  listGap: { gap: 10, marginTop: 8 },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  optionRowSelected: {
    borderColor: CTA_GREEN,
    backgroundColor: "#F0FDF4",
  },
  optionEmoji: { fontSize: 22 },
  optionLabel: { flex: 1, fontSize: 16, color: TEXT_PRIMARY, fontWeight: "500", minWidth: 0 },
  optionLabelSelected: { fontWeight: "600" },
  checkOuter: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkOuterSelected: {
    borderColor: CTA_GREEN,
    backgroundColor: CTA_GREEN,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: { borderColor: CTA_GREEN },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: CTA_GREEN,
  },
  planRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  planText: { flex: 1, fontSize: 16, color: "#334155", lineHeight: 24 },
  footer: {
    alignSelf: "center",
    maxWidth: layout.contentMaxWidth,
    paddingHorizontal: 22,
    paddingBottom: 20,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(15,23,42,0.06)",
    backgroundColor: "rgba(255,255,255,0.65)",
    width: "100%",
  },
  disclaimer: {
    textAlign: "center",
    fontSize: 12,
    color: TEXT_MUTED,
    marginBottom: 10,
  },
  cta: {
    borderRadius: 999,
    backgroundColor: CTA_GREEN,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaDisabled: { backgroundColor: CTA_GREEN_DISABLED },
  ctaText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  ctaTextDisabled: { color: "#F1F5F9" },
});
