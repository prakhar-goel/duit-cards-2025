import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MainNavigator } from "./src/navigation/MainNavigator";
import { featureFlags } from "./src/onboarding/featureFlags";
import { OnboardingWizard } from "./src/onboarding/OnboardingWizard";
import { SignupScreen } from "./src/onboarding/SignupScreen";
import {
  ONBOARDING_COMPLETED_KEY,
  ONBOARDING_PROFILE_KEY,
  shouldShowOnboarding,
  type OnboardingProfilePayload,
} from "./src/onboarding/state";

type Stage = "checking" | "onboarding" | "signup" | "app";

export default function App() {
  const [stage, setStage] = useState<Stage>("checking");
  const [pendingProfile, setPendingProfile] = useState<OnboardingProfilePayload | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY).then((value) => {
      const shouldOnboard = shouldShowOnboarding(featureFlags.onboardingWizardV1, value === "true");
      setStage(shouldOnboard ? "onboarding" : "app");
    });
  }, []);

  function handleOnboardingComplete(payload: OnboardingProfilePayload) {
    setPendingProfile(payload);
    setStage("signup");
  }

  async function persistLocally(payload: OnboardingProfilePayload) {
    // Local cache for fast-boot/offline use — the server copy (written by
    // POST /auth/signup below) is the source of truth once an account exists.
    await AsyncStorage.multiSet([
      [ONBOARDING_COMPLETED_KEY, "true"],
      [ONBOARDING_PROFILE_KEY, JSON.stringify(payload)],
    ]);
  }

  async function handleSignupDone() {
    if (pendingProfile) await persistLocally(pendingProfile);
    setStage("app");
  }

  async function handleSkipSignup() {
    if (pendingProfile) await persistLocally(pendingProfile);
    setStage("app");
  }

  if (stage === "checking") {
    return null;
  }

  return (
    <SafeAreaProvider>
      {stage === "onboarding" && <OnboardingWizard onComplete={handleOnboardingComplete} />}
      {stage === "signup" && pendingProfile && (
        <SignupScreen profile={pendingProfile} onSuccess={handleSignupDone} onSkip={handleSkipSignup} />
      )}
      {stage === "app" && <MainNavigator />}
    </SafeAreaProvider>
  );
}
