export const API = "/api/v1";
export type Row = Record<string, any>;
const key = "duit.pilot.web.session";
export function session(): Row | null {
  try {
    return JSON.parse(sessionStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}
export function saveSession(value: Row | null) {
  if (value) sessionStorage.setItem(key, JSON.stringify(value));
  else sessionStorage.removeItem(key);
}
let refreshing: Promise<Row | null> | null = null;
async function refreshSession() {
  if (!refreshing)
    refreshing = (async () => {
      const current = session();
      if (!current?.refreshToken) return null;
      const response = await fetch(API + "/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      });
      if (!response.ok) {
        saveSession(null);
        return null;
      }
      const next = await response.json();
      saveSession(next);
      return next;
    })().finally(() => {
      refreshing = null;
    });
  return refreshing;
}
export async function api(
  path: string,
  options: RequestInit = {},
): Promise<any> {
  const token = session()?.accessToken;
  const request = (value?: string) =>
    fetch(API + path, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(value ? { Authorization: `Bearer ${value}` } : {}),
        ...options.headers,
      },
    });
  let res = await request(token);
  if (res.status === 401 && token && !path.startsWith("/auth/")) {
    const next = await refreshSession();
    if (next) res = await request(next.accessToken);
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(data.error?.message || `Request failed (${res.status})`);
  return data;
}
export const post = (path: string, data: unknown) =>
  api(path, { method: "POST", body: JSON.stringify(data) });
export const patch = (path: string, data: unknown) =>
  api(path, { method: "PATCH", body: JSON.stringify(data) });
export function date(value?: string, time = false) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(time ? { hour: "numeric", minute: "2-digit" } : {}),
      });
}
export function count(value: unknown) {
  return Number(value || 0).toLocaleString("en");
}
export function safeUrl(value?: string) {
  try {
    const u = new URL(value || "");
    return ["https:", "http:"].includes(u.protocol) ? u.href : undefined;
  } catch {
    return undefined;
  }
}
