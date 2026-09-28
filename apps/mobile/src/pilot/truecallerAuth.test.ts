import { afterEach, expect, it, vi } from "vitest";
const platform = vi.hoisted(() => ({ OS: "android" }));
const native = vi.hoisted(() => ({
  DuitTruecaller: undefined as
    undefined | { clientId: string; authorize: ReturnType<typeof vi.fn> },
}));
vi.mock("react-native", () => ({ Platform: platform, NativeModules: native }));
afterEach(() => {
  vi.resetModules();
  platform.OS = "android";
  native.DuitTruecaller = undefined;
});
it("requires Android, a native bridge and the matching server client ID", async () => {
  native.DuitTruecaller = { clientId: "duit", authorize: vi.fn() };
  const auth = await import("./truecallerAuth.native");
  expect(auth.canUseTruecaller("duit")).toBe(true);
  expect(auth.canUseTruecaller("other")).toBe(false);
  expect(auth.canUseTruecaller(null)).toBe(false);
  platform.OS = "ios";
  expect(auth.canUseTruecaller("duit")).toBe(false);
  await expect(auth.authorizeTruecaller("duit")).rejects.toThrow();
  expect(native.DuitTruecaller.authorize).not.toHaveBeenCalled();
});
it("passes only OAuth proof and preserves cancellation/fallback errors", async () => {
  const proof = { authorizationCode: "one-use", codeVerifier: "verifier" };
  native.DuitTruecaller = {
    clientId: "duit",
    authorize: vi
      .fn()
      .mockResolvedValueOnce(proof)
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(Error("Use SMS")),
  };
  const auth = await import("./truecallerAuth.native");
  expect(await auth.authorizeTruecaller("duit")).toEqual(proof);
  expect(await auth.authorizeTruecaller("duit")).toBeNull();
  await expect(auth.authorizeTruecaller("duit")).rejects.toThrow("Use SMS");
});
