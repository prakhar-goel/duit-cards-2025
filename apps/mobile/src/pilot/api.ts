import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import type { Session } from "./types";
import { normalizeServer } from "./domain";
const SERVER_KEY = "duit:pilot:server:v1";
const SESSION_KEY = "duit.pilot.session.v1";
export const DEFAULT_SERVER = (
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android"
    ? "http://10.0.2.2:48152"
    : "http://localhost:48152")
).replace(/\/api\/v1\/?$/, "");
let server = DEFAULT_SERVER;
let session: Session | null = null;
let refreshFlight: Promise<void> | null = null;
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: any,
  ) {
    super(message);
  }
}
export function getServer() {
  return server;
}
export function getSession() {
  return session;
}
export function workspaceMatches(ownerId: string | undefined, origin: string) {
  return session?.user.id === ownerId && server === origin;
}
export function assertWorkspace(ownerId: string | undefined, origin: string) {
  if (!workspaceMatches(ownerId, origin))
    throw new ApiError(
      409,
      "The account or server changed. Open this action again in the selected workspace.",
    );
}
export async function loadConfig() {
  server = (await AsyncStorage.getItem(SERVER_KEY)) ?? DEFAULT_SERVER;
  const raw =
    Platform.OS === "web"
      ? await AsyncStorage.getItem(SESSION_KEY)
      : await SecureStore.getItemAsync(SESSION_KEY);
  try {
    session = raw ? JSON.parse(raw) : null;
  } catch {
    session = null;
  }
  return { server, session };
}
export async function saveSession(s: Session | null) {
  session = s;
  if (Platform.OS === "web") {
    if (s) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else await AsyncStorage.removeItem(SESSION_KEY);
  } else {
    if (s) await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(s));
    else await SecureStore.deleteItemAsync(SESSION_KEY);
  }
}
export async function changeServer(next: string) {
  server = normalizeServer(next);
  await saveSession(null);
  await AsyncStorage.setItem(SERVER_KEY, server);
}
export function mediaUrl(value?: string | null) {
  if (!value) return undefined;
  const ownRoute = value.match(
    /\/api\/v1\/(?:public\/)?media\/[a-f0-9-]{36}(?:$|\?)/i,
  );
  if (ownRoute) return server + ownRoute[0].replace(/\?$/, "");
  try {
    const parsed = new URL(value);
    if (
      parsed.pathname.startsWith("/demo/") &&
      ["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname)
    )
      return server + parsed.pathname;
  } catch {}
  return value.startsWith("/") ? server + value : value;
}
export function shareUrl(value: string) {
  try {
    const parsed = new URL(value);
    const route = parsed.pathname.match(/\/(?:c|s)\/[^/]+$/);
    if (route) return server + route[0] + parsed.search;
  } catch {}
  return value;
}
export function mediaHeaders(uri?: string) {
  return uri?.startsWith(server + "/api/v1/media/") && session
    ? { Authorization: `Bearer ${session.accessToken}` }
    : undefined;
}
export async function request<T = any>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const sentToken = session?.accessToken;
  const ownerId = session?.user.id;
  const origin = server;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  let res: Response;
  try {
    res = await fetch(`${origin}/api/v1${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    assertWorkspace(ownerId, origin);
    throw new ApiError(
      0,
      error instanceof Error && error.name === "AbortError"
        ? "The server took too long. Your work is still here."
        : "Cannot reach the server. Check your connection and server address.",
    );
  } finally {
    clearTimeout(timer);
  }
  assertWorkspace(ownerId, origin);
  if (
    res.status === 401 &&
    session?.refreshToken &&
    retry &&
    path != "/auth/refresh"
  ) {
    try {
      if (session.accessToken !== sentToken)
        return request<T>(path, init, false);
      if (!refreshFlight) {
        const original = session;
        refreshFlight = (async () => {
          const refreshed = await request<any>(
            "/auth/refresh",
            {
              method: "POST",
              body: JSON.stringify({ refreshToken: original.refreshToken }),
            },
            false,
          );
          if (session?.user.id === original.user.id && server === origin)
            await saveSession({ ...original, ...refreshed });
        })().finally(() => {
          refreshFlight = null;
        });
      }
      await refreshFlight;
      assertWorkspace(ownerId, origin);
      return request<T>(path, init, false);
    } catch {
      assertWorkspace(ownerId, origin);
      throw new ApiError(
        401,
        "Your session has expired. Please sign in again.",
      );
    }
  }
  const body =
    res.status === 204 ? undefined : await res.json().catch(() => undefined);
  if (!res.ok)
    throw new ApiError(
      res.status,
      body?.error?.message ?? `Request failed (${res.status}).`,
      body?.error?.details,
    );
  return body as T;
}
export const get = <T = any>(path: string) => request<T>(path);
export const post = <T = any>(
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
) =>
  request<T>(path, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
    headers,
  });
export const patch = <T = any>(path: string, body: unknown) =>
  request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
export const del = <T = any>(path: string) =>
  request<T>(path, { method: "DELETE" });
export async function fileBase64(uri: string): Promise<string> {
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(",")[1]);
      r.onerror = () => reject(new Error("Could not read this file."));
      r.readAsDataURL(blob);
    });
  }
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}
export async function upload(
  uri: string,
  mimeType = "image/jpeg",
  filename = "upload.jpg",
  purpose = "portrait",
) {
  const owner = session?.user.id;
  const origin = server;
  const data = await fileBase64(uri);
  assertWorkspace(owner, origin);
  return post("/media", { filename, mimeType, data, purpose });
}
