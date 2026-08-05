export const ONBOARDING_COMPLETED_KEY = "duit:onboarding:v1:completed";
export const ONBOARDING_PROFILE_KEY = "duit:onboarding:v1:profile";

export type NetworkingIntentId =
  | "pitch_product"
  | "communicate_brand"
  | "partnerships"
  | "hire"
  | "learn_peers"
  | "investment";

export type OnboardingForm = {
  fullName: string;
  roleTitle: string;
  company: string;
  website: string;
  /** True after user picks a website option (including “none”). */
  websiteChoiceMade: boolean;
  networkingIntents: NetworkingIntentId[];
  /** Set on the mock AI follow-up step (single choice). */
  aiFollowUpChoice: string | null;
};

export const ONBOARDING_STEPS = [
  "name",
  "story",
  "role_title",
  "company",
  "website",
  "networking",
  "ai_followup",
  "plan_summary",
  "complete",
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number];

export const NAME_MAX_LENGTH = 60;

export function nextStepIndex(index: number): number {
  return Math.min(index + 1, ONBOARDING_STEPS.length - 1);
}

export function prevStepIndex(index: number): number {
  return Math.max(index - 1, 0);
}

export function firstName(fullName: string): string {
  const part = fullName.trim().split(/\s+/)[0];
  return part && part.length > 0 ? part : "there";
}

function isOptionalWebsite(raw: string): boolean {
  const s = raw.trim();
  if (s.length === 0) return true;
  if (/^https?:\/\//i.test(s)) return s.length >= 12;
  if (s.includes(".")) return s.length >= 4;
  return false;
}

export function canProceed(step: OnboardingStepId, form: OnboardingForm): boolean {
  switch (step) {
    case "name":
      return (
        form.fullName.trim().length >= 2 && form.fullName.trim().length <= NAME_MAX_LENGTH
      );
    case "story":
      return true;
    case "role_title":
      return form.roleTitle.trim().length >= 2;
    case "company":
      return form.company.trim().length >= 2;
    case "website":
      return form.websiteChoiceMade && isOptionalWebsite(form.website);
    case "networking":
      return form.networkingIntents.length > 0;
    case "ai_followup":
      return Boolean(form.aiFollowUpChoice && form.aiFollowUpChoice.length > 0);
    case "plan_summary":
    case "complete":
      return true;
    default:
      return true;
  }
}

export type OnboardingProfilePayload = Omit<OnboardingForm, "websiteChoiceMade"> & {
  completedAt: string;
  mockAiVersion: string;
};

export function buildProfilePayload(form: OnboardingForm): OnboardingProfilePayload {
  const { websiteChoiceMade: _omit, ...rest } = form;
  return {
    ...rest,
    completedAt: new Date().toISOString(),
    mockAiVersion: "1",
  };
}

export function shouldShowOnboarding(flagEnabled: boolean, alreadyCompleted: boolean): boolean {
  return flagEnabled && !alreadyCompleted;
}
