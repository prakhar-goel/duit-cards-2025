import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../api/client";
import { signup } from "../api/authApi";
import { colors } from "../theme/colors";
import { layout } from "../theme/layout";
import { spacing } from "../theme/spacing";
import { firstName, type OnboardingProfilePayload } from "./state";

const CTA_GREEN = "#16A34A";
const CTA_GREEN_DISABLED = "#BBD9C3";

type Props = {
  profile: OnboardingProfilePayload;
  onSuccess: () => void;
  onSkip: () => void;
};

export function SignupScreen({ profile, onSuccess, onSkip }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fn = firstName(profile.fullName ?? "");
  const emailValid = /\S+@\S+\.\S+/.test(email.trim());
  const passwordValid = password.length >= 8;
  const canSubmit = emailValid && passwordValid && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await signup(email.trim().toLowerCase(), password, profile);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("An account with this email already exists. Try logging in instead.");
      } else {
        setError("Couldn't create your account — check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Save {fn}&apos;s workspace</Text>
          <Text style={styles.subtitle}>
            Create an account so your card and connections sync across devices.
          </Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#8B8B8B"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            placeholderTextColor="#8B8B8B"
            secureTextEntry
            style={styles.input}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[styles.cta, !canSubmit && styles.ctaDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.ctaText}>Create account</Text>
            )}
          </Pressable>

          <Pressable onPress={onSkip} hitSlop={12} style={styles.skipWrap}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    flex: 1,
    alignSelf: "center",
    justifyContent: "center",
    maxWidth: layout.contentMaxWidth,
    width: "100%",
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  error: {
    color: "#DC2626",
    fontSize: 14,
    marginTop: spacing.sm,
  },
  cta: {
    borderRadius: 999,
    backgroundColor: CTA_GREEN,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  ctaDisabled: { backgroundColor: CTA_GREEN_DISABLED },
  ctaText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  skipWrap: { alignItems: "center", paddingVertical: spacing.lg },
  skipText: { color: colors.textMuted, fontSize: 15, fontWeight: "600" },
});
