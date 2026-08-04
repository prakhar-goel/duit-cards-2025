import { apiPost } from "./client";
import type { AiFollowUpOption } from "../onboarding/mockAi";
import type { OnboardingForm } from "../onboarding/state";

type OnboardingAnswers = {
  fullName?: string;
  roleTitle?: string;
  company?: string;
  website?: string;
  networkingIntents?: OnboardingForm["networkingIntents"];
};

function toAnswers(form: OnboardingForm): OnboardingAnswers {
  return {
    fullName: form.fullName || undefined,
    roleTitle: form.roleTitle || undefined,
    company: form.company || undefined,
    website: form.website || undefined,
    networkingIntents: form.networkingIntents,
  };
}

export function fetchAiFollowUp(form: OnboardingForm): Promise<{
  headline: string;
  subtitle: string;
  options: AiFollowUpOption[];
}> {
  return apiPost("/onboarding/ai-step", { step: "followup", answers: toAnswers(form) });
}

export async function fetchPlanBullets(form: OnboardingForm): Promise<string[]> {
  const res = await apiPost<{ bullets: string[] }>("/onboarding/ai-step", {
    step: "plan",
    answers: toAnswers(form),
  });
  return res.bullets;
}
