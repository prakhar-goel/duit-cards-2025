import { describe, expect, it } from "vitest";
import { themes, themeStorageKey } from "./theme";

describe("appearance themes", () => {
  it("keeps stable, unique IDs for persisted selections", () => {
    expect(new Set(themes.map((theme) => theme.id)).size).toBe(themes.length);
    expect(themeStorageKey).toContain("v1");
  });

  it("defines every semantic color for every variant", () => {
    const keys = Object.keys(themes[0].colors).sort();
    for (const theme of themes) {
      expect(Object.keys(theme.colors).sort()).toEqual(keys);
      expect(theme.colors.bg).toMatch(/^#[0-9A-F]{6}$/i);
      expect(theme.colors.teal).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});
