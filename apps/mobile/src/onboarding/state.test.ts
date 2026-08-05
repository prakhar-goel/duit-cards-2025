import { describe, expect, it } from "vitest";
import {
  canProceed,
  firstName,
  NAME_MAX_LENGTH,
  nextStepIndex,
  ONBOARDING_STEPS,
  prevStepIndex,
  shouldShowOnboarding,
  type OnboardingForm,
} from "./state";

const baseForm: OnboardingForm = {
  fullName: "Alex Doe",
  roleTitle: "Engineer",
  company: "Duit Cards",
  website: "https://duitcards.app",
  websiteChoiceMade: true,
  networkingIntents: ["pitch_product"],
  aiFollowUpChoice: "pitch_problem",
};

describe("onboarding state helpers", () => {
  it("clamps next and previous step bounds", () => {
    expect(prevStepIndex(0)).toBe(0);
    expect(nextStepIndex(ONBOARDING_STEPS.length - 1)).toBe(ONBOARDING_STEPS.length - 1);
    expect(nextStepIndex(1)).toBe(2);
  });

  it("derives first name", () => {
    expect(firstName("  Prakhar Goel ")).toBe("Prakhar");
    expect(firstName("")).toBe("there");
  });

  it("validates name step", () => {
    expect(canProceed("name", { ...baseForm, fullName: "" })).toBe(false);
    expect(canProceed("name", { ...baseForm, fullName: "A" })).toBe(false);
    expect(canProceed("name", { ...baseForm, fullName: "Al" })).toBe(true);
    expect(
      canProceed("name", {
        ...baseForm,
        fullName: "x".repeat(NAME_MAX_LENGTH + 1),
      })
    ).toBe(false);
  });

  it("validates role, company, website", () => {
    expect(canProceed("role_title", { ...baseForm, roleTitle: "" })).toBe(false);
    expect(canProceed("company", { ...baseForm, company: "x" })).toBe(false);
    expect(
      canProceed("website", { ...baseForm, website: "", websiteChoiceMade: false })
    ).toBe(false);
    expect(canProceed("website", { ...baseForm, website: "", websiteChoiceMade: true })).toBe(
      true
    );
    expect(canProceed("website", { ...baseForm, website: "bad", websiteChoiceMade: true })).toBe(
      false
    );
    expect(
      canProceed("website", { ...baseForm, website: "duitcards.app", websiteChoiceMade: true })
    ).toBe(true);
  });

  it("requires networking intents and AI choice", () => {
    expect(canProceed("networking", { ...baseForm, networkingIntents: [] })).toBe(false);
    expect(canProceed("ai_followup", { ...baseForm, aiFollowUpChoice: null })).toBe(false);
    expect(canProceed("ai_followup", baseForm)).toBe(true);
  });

  it("respects feature flag and completion status", () => {
    expect(shouldShowOnboarding(true, false)).toBe(true);
    expect(shouldShowOnboarding(false, false)).toBe(false);
    expect(shouldShowOnboarding(true, true)).toBe(false);
  });
});
