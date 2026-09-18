import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const storage = vi.hoisted(() => new Map<string, string>());
vi.mock("react-native", () => ({ Platform: { OS: "web" } }));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (key: string) => storage.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: async (key: string) => {
      storage.delete(key);
    },
  },
}));
vi.mock("expo-secure-store", () => ({}));
vi.mock("expo-file-system/legacy", () => ({}));
import { changeServer, request, saveSession } from "./api";
const session = (id: string) =>
  ({
    user: { id, email: `${id}@example.test` },
    accessToken: `${id}-access`,
    refreshToken: `${id}-refresh`,
  }) as any;
describe("in-flight workspace isolation", () => {
  beforeEach(async () => {
    await changeServer("https://pilot.example");
    await saveSession(session("maya"));
  });
  afterEach(() => vi.unstubAllGlobals());
  it("does not deliver an earlier user's response into the newly selected account", async () => {
    let respond!: (r: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((r) => {
            respond = r;
          }),
      ),
    );
    const pending = request("/people");
    await saveSession(session("noah"));
    respond(
      new Response(
        JSON.stringify({ people: [{ name: "Maya's private connection" }] }),
        { status: 200 },
      ),
    );
    await expect(pending).rejects.toMatchObject({ status: 409 });
  });
  it("does not retry an expired request using the new account's credentials", async () => {
    let respond!: (r: Response) => void;
    const fetch = vi.fn(
      () =>
        new Promise<Response>((r) => {
          respond = r;
        }),
    );
    vi.stubGlobal("fetch", fetch);
    const pending = request("/people", { method: "POST", body: "{}" });
    await saveSession(session("noah"));
    respond(new Response("{}", { status: 401 }));
    await expect(pending).rejects.toMatchObject({ status: 409 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("rejects a response when a server changes even if the user id is identical", async () => {
    let respond!: (r: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((r) => {
            respond = r;
          }),
      ),
    );
    const pending = request("/people");
    await changeServer("https://another-pilot.example");
    await saveSession(session("maya"));
    respond(new Response("{}", { status: 200 }));
    await expect(pending).rejects.toMatchObject({ status: 409 });
  });
});
