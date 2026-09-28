import { afterEach, describe, expect, it, vi } from "vitest";
const platform = vi.hoisted(() => ({ OS: "android" }));
const native = vi.hoisted(() => ({
  DuitPhoneNumberHint: undefined as
    undefined | { requestNumber: ReturnType<typeof vi.fn> },
}));
vi.mock("react-native", () => ({ Platform: platform, NativeModules: native }));
afterEach(() => {
  vi.resetModules();
  platform.OS = "android";
  native.DuitPhoneNumberHint = undefined;
});
describe("phone number selection", () => {
  it("keeps manual entry available in builds without the Android bridge", async () => {
    const picker = await import("./phoneNumberHint.native");
    expect(picker.canChoosePhoneNumber).toBe(false);
    expect(await picker.choosePhoneNumber()).toBeNull();
  });
  it("keeps the chosen country code and treats dismissal as no selection", async () => {
    native.DuitPhoneNumberHint = {
      requestNumber: vi
        .fn()
        .mockResolvedValueOnce("+44 (7700) 900-123")
        .mockResolvedValueOnce(null),
    };
    const picker = await import("./phoneNumberHint.native");
    expect(picker.canChoosePhoneNumber).toBe(true);
    expect(await picker.choosePhoneNumber()).toBe("+447700900123");
    expect(await picker.choosePhoneNumber()).toBeNull();
  });
  it("does not invent a country code or swallow a picker failure", async () => {
    native.DuitPhoneNumberHint = {
      requestNumber: vi
        .fn()
        .mockResolvedValueOnce("9876543210")
        .mockRejectedValueOnce(Error("No SIM number")),
    };
    const picker = await import("./phoneNumberHint.native");
    expect(await picker.choosePhoneNumber()).toBe("9876543210");
    await expect(picker.choosePhoneNumber()).rejects.toThrow("No SIM number");
  });
  it("does not invoke the Android bridge on iOS", async () => {
    platform.OS = "ios";
    native.DuitPhoneNumberHint = { requestNumber: vi.fn() };
    const picker = await import("./phoneNumberHint.native");
    expect(picker.canChoosePhoneNumber).toBe(false);
    expect(await picker.choosePhoneNumber()).toBeNull();
    expect(native.DuitPhoneNumberHint.requestNumber).not.toHaveBeenCalled();
  });
});
