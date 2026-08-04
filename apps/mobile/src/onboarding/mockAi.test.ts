import { describe, expect, it } from "vitest";
import { getAiFollowUpContent, getPlanBullets } from "./mockAi";
import type { OnboardingForm } from "./state";

const form = (patch: Partial<OnboardingForm>): OnboardingForm => ({
  fullName: "Sam Lee",
  roleTitle: "Founder",
  company: "Acme",
  website: "",
  websiteChoiceMade: true,
  networkingIntents: [],
  aiFollowUpChoice: null,
  ...patch,
});

describe("mockAi", () => {
  it("routes follow-up copy for pitch intent", () => {
    const c = getAiFollowUpContent(form({ networkingIntents: ["pitch_product"] }));
    expect(c.headline).toContain("Sam");
    expect(c.options.length).toBeGreaterThan(0);
  });

  it("mentions website enrichment when URL present", () => {
    const c = getAiFollowUpContent(
      form({ networkingIntents: ["learn_peers"], website: "https://acme.com" })
    );
    expect(c.subtitle.toLowerCase()).toContain("site");
  });

  it("builds plan bullets from answers", () => {
    const bullets = getPlanBullets(
      form({
        networkingIntents: ["communicate_brand"],
        website: "acme.com",
      })
    );
    expect(bullets.length).toBeGreaterThan(0);
    expect(bullets.some((b) => b.toLowerCase().includes("brand"))).toBe(true);
  });
});
