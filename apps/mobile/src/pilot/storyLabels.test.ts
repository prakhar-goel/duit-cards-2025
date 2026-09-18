import { describe, expect, it } from "vitest";
import { shortCtaLabel } from "./storyLabels";
describe("compact card actions", () => {
  it("retains short authored actions and preserves the intent of longer actions", () => {
    expect(shortCtaLabel("Get quote")).toBe("Get quote");
    expect(shortCtaLabel("Plan a gift box")).toBe("Plan gifts");
    expect(shortCtaLabel("Request fabric samples")).toBe("Try samples");
    expect(shortCtaLabel("Book a studio visit")).toBe("Book visit");
    expect(shortCtaLabel("Discuss your next batch")).toBe("Enquire");
    expect(shortCtaLabel("Start a conversation")).toBe("Connect");
  });
  it("never puts long or blank labels on the fixed dock", () => {
    for (const label of [
      "",
      "  ",
      "Discuss your next batch",
      "Extraordinarily comprehensive",
      "See our full seasonal collection",
    ]) {
      const compact = shortCtaLabel(label);
      expect(compact.length).toBeGreaterThan(0);
      expect(compact.length).toBeLessThanOrEqual(18);
      expect(compact.split(/\s+/).length).toBeLessThanOrEqual(2);
    }
  });
});
