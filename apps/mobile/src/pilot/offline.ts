import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as api from "./api";
import { randomId } from "./domain";
import manifest from "./media-manifest.json";

export function workspaceKey() {
  return `${encodeURIComponent(api.getServer())}:${api.getSession()?.user.id || "signed-out"}`;
}
export function optimizedMedia(value?: string | null, thumbnail = false) {
  let path = value || "";
  try {
    path = new URL(path).pathname;
  } catch {}
  const item = (manifest as Record<string, { image: string; thumb: string }>)[
    path
  ];
  return api.mediaUrl(item ? item[thumbnail ? "thumb" : "image"] : value);
}
const flights = new Map<string, Promise<string>>();
const urls = new Map<string, string>();
const webFiles = new Map<string, Promise<Response>>();
async function persistWebMedia(uri: string, scope: string) {
  const key = `${scope}:${uri}`;
  let flight = webFiles.get(key);
  if (!flight) {
    flight = (async () => {
      const cache = typeof caches !== "undefined" ? await caches.open(`duit-media:${scope}`) : null;
      const saved = await cache?.match(uri);
      if (saved) return saved;
      const response = await fetch(uri, { headers: api.mediaHeaders(uri), signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error("Media unavailable");
      if (cache) await cache.put(uri, response.clone());
      return response;
    })().finally(() => webFiles.delete(key));
    webFiles.set(key, flight);
  }
  return (await flight).clone();
}
// Public and private files are both isolated by server and signed-in account.
// CacheStorage persists browser bytes; native files live in documentDirectory.
export async function offlineMedia(uri: string): Promise<string> {
  const scope = workspaceKey(),
    owner = api.getSession()?.user.id,
    origin = api.getServer();
  const key = `duit:media:${scope}:${uri}`;
  if (urls.has(key)) return urls.get(key)!;
  if (flights.has(key)) return flights.get(key)!;
  const work = (async () => {
    let result: string;
    if (Platform.OS === "web") {
      const response = await persistWebMedia(uri, scope);
      result = URL.createObjectURL(await response.blob());
    } else {
      const existing = await AsyncStorage.getItem(key);
      if (existing && (await FileSystem.getInfoAsync(existing)).exists)
        return existing;
      const dir = `${FileSystem.documentDirectory}duit-offline/`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      const extension =
        new URL(uri).pathname.match(
          /\.(png|jpg|jpeg|webp|mp4|mov|svg)$/i,
        )?.[1] || "jpg";
      const target = `${dir}${randomId()}.${extension}`;
      const download = await FileSystem.downloadAsync(uri, target, {
        headers: api.mediaHeaders(uri),
      });
      if (download.status !== 200) {
        await FileSystem.deleteAsync(target, { idempotent: true });
        throw new Error("Media unavailable");
      }
      await AsyncStorage.setItem(key, target);
      result = target;
    }
    api.assertWorkspace(owner, origin);
    urls.set(key, result);
    return result;
  })().finally(() => flights.delete(key));
  flights.set(key, work);
  return work;
}
export function mediaIn(value: unknown): string[] {
  const found = new Set<string>();
  function walk(v: any, key = "") {
    if (
      typeof v === "string" &&
      /^(imageUrl|photoUrl|businessCardUrl|businessCardBackUrl|coverUrl|logoUrl|posterUrl|url)$/.test(
        key,
      ) &&
      (key !== "url" || /\/demo\/|\/media\/|\/public\/media\/|\.(png|jpe?g|webp|mp4|svg)(\?|$)/i.test(v))
    ) {
      const image = optimizedMedia(v),
        thumb = optimizedMedia(v, true);
      if (image) found.add(image);
      if (thumb) found.add(thumb);
    } else if (Array.isArray(v)) v.forEach((x) => walk(x));
    else if (v && typeof v === "object")
      Object.entries(v).forEach(([k, x]) => walk(x, k));
  }
  walk(value);
  return [...found];
}
export async function cacheMedia(
  value: unknown,
  progress: (done: number, total: number) => void,
) {
  const scope = workspaceKey(),
    items = mediaIn(value);
  let cursor = 0,
    done = 0;
  progress(0, items.length);
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      while (cursor < items.length && scope === workspaceKey()) {
        const uri = items[cursor++];
        try {
          if (Platform.OS === "web") await persistWebMedia(uri, scope);
          else await offlineMedia(uri);
          done++;
        } catch {}
        if (scope === workspaceKey()) progress(done, items.length);
      }
    }),
  );
}

export type PendingExchange = {
  clientId: string;
  cardId: string;
  name: string;
  phone: string;
  occurredAt: string;
  location?: string;
  city?: string;
  countryCode?: string;
  note?: string;
  eventName?: string;
  latitude?: number;
  longitude?: number;
  eventId?: string;
  potentialLead?: boolean;
  error?: string;
};
// Serialize disk changes: reconnect and a new share must never overwrite one another.
let writes: Promise<unknown> = Promise.resolve();
export function updateExchanges(
  scope: string,
  change: (items: PendingExchange[]) => PendingExchange[],
) {
  const next = writes
    .catch(() => {})
    .then(async () => {
      const key = `duit:exchanges:${scope}`;
      const items = change(
        JSON.parse((await AsyncStorage.getItem(key)) || "[]"),
      );
      await AsyncStorage.setItem(key, JSON.stringify(items));
      return items;
    });
  writes = next;
  return next;
}
export async function readExchanges(
  scope = workspaceKey(),
): Promise<PendingExchange[]> {
  await writes.catch(() => {});
  return JSON.parse(
    (await AsyncStorage.getItem(`duit:exchanges:${scope}`)) || "[]",
  );
}
