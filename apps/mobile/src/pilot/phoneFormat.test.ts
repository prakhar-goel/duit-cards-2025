import { expect, it } from "vitest";
import { phoneDigits, internationalPhone } from "./phoneFormat";
it("allows only ASCII digits in the local number box, including pasted text", () => {
  expect(phoneDigits("98ab 76-54.32/10+")).toBe("9876543210");
  expect(phoneDigits("١٢٣abc")).toBe("");
  expect(phoneDigits("1".repeat(30))).toHaveLength(15);
});
it("combines the selected country and national number without doubling trunk codes", () => {
  expect(internationalPhone("IN", "9876543210")).toBe("+919876543210");
  expect(internationalPhone("GB", "07700900123")).toBe("+447700900123");
  expect(internationalPhone("US", "2025550123")).toBe("+12025550123");
  expect(internationalPhone("IN", "")).toBe("");
});
