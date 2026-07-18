import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MainNavigator } from "./src/navigation/MainNavigator";
import { featureFlags } from "./src/onboarding/featureFlags";
import { OnboardingWizard } from "./src/onboarding/OnboardingWizard";
import {
  ONBOARDING_COMPLETED_KEY,
  ONBOARDING_PROFILE_KEY,
  shouldShowOnboarding,
  type OnboardingProfilePayload,
} from "./src/onboarding/state";

export default function App() {
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY)
      .then((value) => {
        setShowOnboarding(shouldShowOnboarding(featureFlags.onboardingWizardV1, value === "true"));
      })
      .finally(() => setCheckingOnboarding(false));
  }, []);

  async function handleOnboardingComplete(payload: OnboardingProfilePayload) {
    // Cached locally for now — this becomes the source-of-truth sync target once
    // account creation (POST /auth/signup with onboardingProfile) is wired in.
    await AsyncStorage.multiSet([
      [ONBOARDING_COMPLETED_KEY, "true"],
      [ONBOARDING_PROFILE_KEY, JSON.stringify(payload)],
    ]);
    setShowOnboarding(false);
  }

  if (checkingOnboarding) {
    return null;
  }

  return (
    <SafeAreaProvider>
      {showOnboarding ? (
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      ) : (
        <MainNavigator />
      )}
    </SafeAreaProvider>
  );
}
