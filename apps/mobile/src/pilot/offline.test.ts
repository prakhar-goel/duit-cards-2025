import { beforeEach, describe, expect, it, vi } from "vitest";
const storage = vi.hoisted(() => new Map<string, string>());
vi.mock("react-native", () => ({ Platform: { OS: "web" } }));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (key: string) => storage.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      await Promise.resolve();
      storage.set(key, value);
    },
  },
}));
vi.mock("expo-secure-store", () => ({}));
vi.mock("expo-file-system/legacy", () => ({}));
import { updateExchanges, readExchanges, mediaIn } from "./offline";
import { nearbyEvents } from "./meetingContext";
import { shareDisabledReason } from "./exchangeMessage";
const item = (clientId: string) => ({
  clientId,
  cardId: "card",
  name: "Mira",
  phone: "+919876543210",
  occurredAt: "2026-09-28T09:00:00Z",
});
describe("offline exchange persistence", () => {
  beforeEach(() => storage.clear());
  it("serializes a new share and replay acknowledgement without losing the new meeting", async () => {
    await updateExchanges("maya:local", () => [item("first")]);
    await Promise.all([
      updateExchanges("maya:local", (rows) => [...rows, item("second")]),
      updateExchanges("maya:local", (rows) =>
        rows.filter((r) => r.clientId !== "first"),
      ),
    ]);
    expect((await readExchanges("maya:local")).map((r) => r.clientId)).toEqual([
      "second",
    ]);
  });
  it("keeps outboxes separate by account and server and retains errors", async () => {
    await updateExchanges("maya:local", () => [
      { ...item("a"), error: "Card no longer published" },
    ]);
    expect(await readExchanges("noah:local")).toEqual([]);
    expect(await readExchanges("maya:staging")).toEqual([]);
    expect((await readExchanges("maya:local"))[0].error).toBe(
      "Card no longer published",
    );
  });
  it("includes gallery media and excludes business website and CTA links", () => {
    const urls = mediaIn({
      imageUrl: "https://images.test/portrait.jpg",
      businessMedia: [{ url: "https://images.test/clip.mp4", type: "video" }],
      contact: { website: "https://business.test" },
      links: [{ url: "https://shop.test/buy" }],
    });
    expect(urls).toContain("https://images.test/portrait.jpg");
    expect(urls).toContain("https://images.test/clip.mp4");
    expect(urls).toHaveLength(2);
  });
});
it("suggests only active events within two kilometres; never yesterday or a remote city", () => {
  const event = {
    id: "near",
    name: "Builders Night",
    latitude: 28.4,
    longitude: 77.1,
    startsAt: "2026-09-28T08:00:00Z",
    endsAt: "2026-09-28T18:00:00Z",
  };
  const rows = [
    event,
    { ...event, id: "far", latitude: 30 },
    {
      ...event,
      id: "yesterday",
      startsAt: "2026-09-27T08:00:00Z",
      endsAt: "2026-09-27T18:00:00Z",
    },
  ];
  expect(
    nearbyEvents(rows, "2026-09-28T09:00:00Z", {
      latitude: 28.4,
      longitude: 77.1,
    }).map((r) => r.event.id),
  ).toEqual(["near"]);
  expect(nearbyEvents(rows, "2026-09-28T09:00:00Z")).toEqual([]);
});
it("explains every disabled share state without blocking optional GPS or notes", () => {
  expect(shareDisabledReason("", "+91", "Hello")).toMatch(/name/);
  expect(shareDisabledReason("Mira", "+91", "Hello")).toMatch(/number/);
  expect(shareDisabledReason("Mira", "+91 98765 43210", "")).toMatch(/message/);
  expect(shareDisabledReason("Mira", "+91 98765 43210", "Hello")).toBe("");
});

it('reads persisted image bytes after a fresh runtime while the network is unavailable', async () => {
  const entries = new Map<string, Response>();
  vi.stubGlobal('caches', { open: async () => ({ match: async (key: string) => entries.get(key)?.clone(), put: async (key: string, response: Response) => { entries.set(key, response); } }) });
  const fetcher = vi.fn().mockResolvedValue(new Response(new Blob(['image-bytes'], { type: 'image/png' })));
  vi.stubGlobal('fetch', fetcher);
  let module = await import('./offline');
  const uri = 'https://media.test/offline-image.png';
  expect(await module.offlineMedia(uri)).toMatch(/^blob:/);
  expect(fetcher).toHaveBeenCalledTimes(1);
  vi.resetModules();
  fetcher.mockRejectedValue(new TypeError('Offline'));
  module = await import('./offline');
  expect(await module.offlineMedia(uri)).toMatch(/^blob:/);
  expect(fetcher).toHaveBeenCalledTimes(1);
  vi.unstubAllGlobals();
});
