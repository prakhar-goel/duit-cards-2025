import { describe, expect, it } from "vitest";
import { themes, themeStorageKey } from "./theme";

describe("appearance themes", () => {
  it("keeps stable, unique IDs for persisted selections", () => {
    expect(new Set(themes.map((theme) => theme.id)).size).toBe(themes.length);
    expect(themeStorageKey).toContain("v2");
  });

  it("defines every semantic color for every variant", () => {
    const keys = Object.keys(themes[0].colors).sort();
    for (const theme of themes) {
      expect(Object.keys(theme.colors).sort()).toEqual(keys);
      expect(theme.colors.bg).toMatch(/^#[0-9A-F]{6}$/i);
      expect(theme.colors.teal).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it("keeps the original theme and provides a borderless professional feed", () => {
    expect(themes.some((theme) => theme.id === "duit")).toBe(true);
    const professional = themes.find((theme) => theme.id === "linkedin");
    expect(professional?.radius.feedBorder).toBe(0);
    expect(professional?.radius.feedGutter).toBe(0);
    expect(professional?.colors.nav).toBe("#FFFFFF");
  });
});
