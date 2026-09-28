import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import {
  cacheMedia,
  workspaceKey,
  readExchanges,
  updateExchanges,
  type PendingExchange,
} from "./offline";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as api from "./api";
import { waitForAiJob } from "./aiJobs";
import {
  camel,
  person,
  encounter,
  commitment,
  lead,
  need,
  feedItem,
  capturePayload,
  randomId,
} from "./domain";
import {
  emptySnapshot,
  type Snapshot,
  type Session,
  type CaptureDraft,
  type QueuedCapture,
  type Capabilities,
} from "./types";
type Store = {
  ready: boolean;
  session: Session | null;
  data: Snapshot;
  loading: boolean;
  offline: boolean;
  pendingExchanges: PendingExchange[];
  mediaProgress: { done: number; total: number; finished?: boolean };
  exchange: (
    input: PendingExchange,
  ) => Promise<{ url?: string; queued: boolean }>;
  error: string | null;
  queue: QueuedCapture[];
  capabilities: Capabilities;
  server: string;
  refresh: () => Promise<void>;
  signIn: (
    email: string,
    password: string,
    name?: string,
    inviteCode?: string,
  ) => Promise<void>;
  signInPhone: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setServer: (url: string) => Promise<void>;
  capture: (
    draft: CaptureDraft,
  ) => Promise<{ queued: boolean; personId?: string }>;
  sync: () => Promise<void>;
  removeQueued: (id: string) => Promise<void>;
  notify: (message: string) => void;
  toast: string | null;
  ai: (
    task: string,
    input: any,
    mediaIds?: string[],
    existingJobId?: string,
  ) => Promise<any>;
};
const Context = createContext<Store | null>(null);
const cacheKey = (s: Session, origin = api.getServer()) =>
  `duit:pilot:cache:${encodeURIComponent(origin)}:${s.user.id}`;
const queueKey = (s: Session, origin = api.getServer()) =>
  `duit:pilot:outbox:${encodeURIComponent(origin)}:${s.user.id}`;
async function listAll(path: string, key: string) {
  let items: any[] = [];
  for (let offset = 0; ; offset += 200) {
    const res = await api.get<any>(
      `${path}${path.includes("?") ? "&" : "?"}limit=200&offset=${offset}`,
    );
    const rows = res[key] ?? [];
    items.push(...rows);
    if (rows.length < 200 || items.length >= (res.total ?? items.length)) break;
  }
  return items;
}
export function PilotProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [data, setData] = useState<Snapshot>(emptySnapshot);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueuedCapture[]>([]);
  const [capabilities, setCapabilities] = useState<Capabilities>({});
  const [server, setServerState] = useState(api.getServer());
  const [toast, setToast] = useState<string | null>(null);
  const [pendingExchanges, setPendingExchanges] = useState<PendingExchange[]>(
    [],
  );
  const [mediaProgress, setMediaProgress] = useState<{
    done: number;
    total: number;
    finished?: boolean;
  }>({ done: 0, total: 0 });
  const mediaRun = useRef(0);
  const refreshing = useRef<string | null>(null);
  const syncing = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function notify(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4600);
  }
  async function refresh() {
    const active = api.getSession();
    if (!active) return;
    const refreshScope = workspaceKey();
    if (refreshing.current === refreshScope) return;
    refreshing.current = refreshScope;
    const origin = api.getServer();
    setLoading(true);
    setError(null);
    try {
      const [
        me,
        people,
        cards,
        encounters,
        commitments,
        leads,
        needs,
        feed,
        caps,
        walletCards,
        examples,
        events,
      ] = await Promise.all([
        api.get("/me"),
        listAll("/people", "people"),
        listAll("/cards", "cards"),
        listAll("/encounters", "encounters"),
        listAll("/commitments?status=all", "commitments"),
        listAll("/leads", "leads"),
        api.get("/need-offers"),
        api.get("/feed").catch(() => ({ items: [] })),
        api.get("/ai/capabilities").catch(() => ({ enabled: false })),
        listAll("/wallet/cards", "cards"),
        api.get("/examples/cards"),
        api.get("/events"),
      ]);
      if (!api.workspaceMatches(active.user.id, origin)) return;
      const snapshot: Snapshot = {
        user: me.user,
        walletCards,
        examples: examples.cards || [],
        events: events.events || [],
        people: people.map(person),
        cards: cards.map(camel),
        encounters: encounters.map(encounter),
        commitments: commitments.map(commitment),
        leads: leads.map(lead),
        needs: (needs.needOffers ?? []).map(need),
        feed: (feed.items ?? []).map(feedItem),
        updatedAt: new Date().toISOString(),
      };
      setData(snapshot);
      setCapabilities(caps);
      setOffline(false);
      setSession(api.getSession());
      await AsyncStorage.setItem(
        cacheKey(active, origin),
        JSON.stringify(snapshot),
      );
      const run = ++mediaRun.current;
      void cacheMedia(snapshot, (done, total) => {
        if (
          run === mediaRun.current &&
          api.workspaceMatches(active.user.id, origin)
        )
          setMediaProgress((prev) => ({
            done: Math.max(prev.total === total ? prev.done : 0, done),
            total,
          }));
      }).then(() => {
        if (
          run === mediaRun.current &&
          api.workspaceMatches(active.user.id, origin)
        )
          setMediaProgress((prev) => ({ ...prev, finished: true }));
      });
    } catch (e) {
      if (!api.workspaceMatches(active.user.id, origin)) return;
      const message =
        e instanceof Error ? e.message : "Could not refresh your workspace.";
      setError(message);
      setOffline(e instanceof api.ApiError && e.status === 0);
      if (e instanceof api.ApiError && e.status === 401) {
        await api.saveSession(null);
        setSession(null);
        setData(emptySnapshot);
        setQueue([]);
        setPendingExchanges([]);
        setMediaProgress({ done: 0, total: 0 });
      }
    } finally {
      if (refreshing.current === refreshScope) {
        refreshing.current = null;
        setLoading(false);
      }
    }
  }
  async function boot() {
    const config = await api.loadConfig();
    setServerState(config.server);
    setSession(config.session);
    if (config.session) {
      const [cache, outbox] = await Promise.all([
        AsyncStorage.getItem(cacheKey(config.session)),
        AsyncStorage.getItem(queueKey(config.session)),
      ]);
      if (cache)
        try {
          setData(JSON.parse(cache));
        } catch {}
      if (outbox)
        try {
          setQueue(JSON.parse(outbox));
        } catch {}
    }
    setReady(true);
    if (config.session) void refresh();
  }
  useEffect(() => {
    void boot();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);
  async function signIn(
    email: string,
    password: string,
    name?: string,
    inviteCode?: string,
  ) {
    const res = await api.post<Session>(name ? "/auth/signup" : "/auth/login", {
      email: email.trim(),
      password,
      ...(name
        ? { displayName: name, inviteCode: inviteCode || undefined }
        : {}),
    });
    await api.saveSession(res);
    setSession(res);
    setData(emptySnapshot);
    setQueue([]);
    setPendingExchanges([]);
    setMediaProgress({ done: 0, total: 0 });
    const [cache, outbox] = await Promise.all([
      AsyncStorage.getItem(cacheKey(res)),
      AsyncStorage.getItem(queueKey(res)),
    ]);
    if (cache)
      try {
        setData(JSON.parse(cache));
      } catch {}
    if (outbox)
      try {
        setQueue(JSON.parse(outbox));
      } catch {}
    await refresh();
  }
  async function logout() {
    const active = api.getSession();
    try {
      if (active)
        await api.post("/auth/logout", { refreshToken: active.refreshToken });
    } catch {}
    await api.saveSession(null);
    setSession(null);
    setData(emptySnapshot);
    setQueue([]);
    setPendingExchanges([]);
    setMediaProgress({ done: 0, total: 0 });
    setCapabilities({});
    setError(null);
    setOffline(false);
  }
  async function signInPhone(idToken: string) {
    const res = await api.post<Session>("/auth/phone", { idToken });
    await api.saveSession(res);
    setSession(res);
    setData(emptySnapshot);
    setQueue([]);
    setPendingExchanges([]);
    setMediaProgress({ done: 0, total: 0 });
    const [cache, outbox] = await Promise.all([
      AsyncStorage.getItem(cacheKey(res)),
      AsyncStorage.getItem(queueKey(res)),
    ]);
    if (cache)
      try {
        setData(JSON.parse(cache));
      } catch {}
    if (outbox)
      try {
        setQueue(JSON.parse(outbox));
      } catch {}
    await refresh();
  }
  async function setServer(url: string) {
    await api.changeServer(url);
    setServerState(api.getServer());
    setSession(null);
    setData(emptySnapshot);
    setQueue([]);
    setPendingExchanges([]);
    setMediaProgress({ done: 0, total: 0 });
    setError(null);
    setOffline(false);
  }
  async function persistQueue(
    items: QueuedCapture[],
    owner: Session,
    origin: string,
  ) {
    if (!api.workspaceMatches(owner.user.id, origin)) return;
    setQueue(items);
    await AsyncStorage.setItem(queueKey(owner, origin), JSON.stringify(items));
  }
  async function submitCapture(item: QueuedCapture) {
    api.assertWorkspace(item.ownerId, item.server);
    const owner = api.getSession()!;
    let personId = item.personId ?? item.draft.personId;
    if (!personId) {
      const d = item.draft;
      const created = await api.post("/people", {
        name: d.name.trim(),
        role: d.role.trim(),
        company: d.company.trim(),
        email: d.email.trim() || undefined,
        phone: d.phone.trim() || undefined,
        photoUrl: d.photoUrl,
        businessCardUrl: d.businessCardUrl,
        tags: [],
        clientId: item.id + "-person",
      });
      api.assertWorkspace(item.ownerId, item.server);
      personId = created.person.id;
      item.personId = personId;
      const stored = JSON.parse(
        (await AsyncStorage.getItem(queueKey(owner, item.server))) ?? "[]",
      ) as QueuedCapture[];
      api.assertWorkspace(item.ownerId, item.server);
      await persistQueue(
        stored.map((q) => (q.id === item.id ? item : q)),
        owner,
        item.server,
      );
    }
    api.assertWorkspace(item.ownerId, item.server);
    await api.post(`/people/${personId}/encounters`, {
      ...capturePayload(item.draft),
      ...(item.draft.coordinates
        ? {
            latitude: item.draft.coordinates.latitude,
            longitude: item.draft.coordinates.longitude,
          }
        : {}),
      clientId: item.id,
    });
    api.assertWorkspace(item.ownerId, item.server);
    return personId;
  }
  async function capture(draft: CaptureDraft) {
    const active = api.getSession();
    if (!active) throw new Error("Please sign in first.");
    const origin = api.getServer();
    const item: QueuedCapture = {
      id: randomId(),
      ownerId: active.user.id,
      server: origin,
      draft,
      createdAt: new Date().toISOString(),
    };
    const key = queueKey(active, origin);
    const current = JSON.parse(
      (await AsyncStorage.getItem(key)) ?? "[]",
    ) as QueuedCapture[];
    api.assertWorkspace(active.user.id, origin);
    await persistQueue([...current, item], active, origin);
    try {
      const personId = await submitCapture(item);
      const stored = JSON.parse(
        (await AsyncStorage.getItem(key)) ?? "[]",
      ) as QueuedCapture[];
      api.assertWorkspace(active.user.id, origin);
      await persistQueue(
        stored.filter((q) => q.id !== item.id),
        active,
        origin,
      );
      await refresh();
      return { queued: false, personId };
    } catch (e) {
      api.assertWorkspace(active.user.id, origin);
      if (e instanceof api.ApiError && e.status === 0) {
        setOffline(true);
        notify("Saved on this phone. We’ll sync when you reconnect.");
        return { queued: true };
      }
      const stored = JSON.parse(
        (await AsyncStorage.getItem(key)) ?? "[]",
      ) as QueuedCapture[];
      await persistQueue(
        stored.map((q) =>
          q.id === item.id
            ? {
                ...q,
                error:
                  e instanceof Error
                    ? e.message
                    : "Please review this capture.",
              }
            : q,
        ),
        active,
        origin,
      );
      throw e;
    }
  }
  async function removeQueued(id: string) {
    const active = api.getSession();
    if (!active) return;
    const origin = api.getServer();
    const stored = JSON.parse(
      (await AsyncStorage.getItem(queueKey(active, origin))) ?? "[]",
    ) as QueuedCapture[];
    await persistQueue(
      stored.filter((item) => item.id !== id),
      active,
      origin,
    );
  }
  async function sync() {
    if (syncing.current || !api.getSession()) return;
    syncing.current = true;
    const active = api.getSession()!;
    const origin = api.getServer();
    const key = queueKey(active, origin);
    try {
      const stored = JSON.parse(
        (await AsyncStorage.getItem(key)) ?? "[]",
      ) as QueuedCapture[];
      for (const item of stored) {
        if (!api.workspaceMatches(active.user.id, origin)) return;
        if (item.ownerId !== active.user.id || item.server !== origin) continue;
        try {
          await submitCapture(item);
          const now = JSON.parse(
            (await AsyncStorage.getItem(key)) ?? "[]",
          ) as QueuedCapture[];
          await persistQueue(
            now.filter((q) => q.id !== item.id),
            active,
            origin,
          );
        } catch (e) {
          if (!api.workspaceMatches(active.user.id, origin)) return;
          if (e instanceof api.ApiError && e.status === 0) break;
          const now = JSON.parse(
            (await AsyncStorage.getItem(key)) ?? "[]",
          ) as QueuedCapture[];
          await persistQueue(
            now.map((q) =>
              q.id === item.id
                ? {
                    ...q,
                    error: e instanceof Error ? e.message : "Could not sync.",
                  }
                : q,
            ),
            active,
            origin,
          );
        }
      }
      if (api.workspaceMatches(active.user.id, origin)) {
        await syncExchanges();
        await refresh();
      }
    } finally {
      syncing.current = false;
    }
  }
  async function exchange(input: PendingExchange) {
    const owner = api.getSession()?.user.id,
      origin = api.getServer(),
      scope = workspaceKey();
    if (!owner) throw new Error("Please sign in first.");
    const stored = await updateExchanges(scope, (items) => [
      ...items.filter((i) => i.clientId !== input.clientId),
      input,
    ]);
    api.assertWorkspace(owner, origin);
    setPendingExchanges(stored);
    if (offline) return { queued: true };
    try {
      const result = await api.post("/exchanges", input);
      const remaining = await updateExchanges(scope, (items) =>
        items.filter((i) => i.clientId !== input.clientId),
      );
      api.assertWorkspace(owner, origin);
      setPendingExchanges(remaining);
      void refresh();
      return { queued: false, url: result.url };
    } catch (e) {
      api.assertWorkspace(owner, origin);
      if (e instanceof api.ApiError && (e.status === 0 || e.status >= 500)) {
        setOffline(true);
        return { queued: true };
      }
      const remaining = await updateExchanges(scope, (items) =>
        items.map((i) =>
          i.clientId === input.clientId
            ? {
                ...i,
                error:
                  e instanceof Error
                    ? e.message
                    : "Please review this exchange.",
              }
            : i,
        ),
      );
      if (workspaceKey() === scope) setPendingExchanges(remaining);
      throw e;
    }
  }
  async function syncExchanges() {
    const owner = api.getSession()?.user.id,
      origin = api.getServer(),
      scope = workspaceKey();
    if (!owner) return;
    for (const item of await readExchanges(scope)) {
      api.assertWorkspace(owner, origin);
      if (item.error) continue;
      try {
        // Coordinates captured offline are useful even when address lookup failed.
        // Resolve them on reconnect without replacing a place the user entered.
        if (!item.location && item.latitude != null && item.longitude != null) {
          const lookup = await api.get(`/locations?latitude=${item.latitude}&longitude=${item.longitude}`).catch(() => null);
          const place = lookup?.places?.[0];
          if (place) {
            item.location = place.location; item.city = place.city; item.countryCode = place.countryCode;
            await updateExchanges(scope, items => items.map(i => i.clientId === item.clientId ? item : i));
          }
        }
        api.assertWorkspace(owner, origin);
        await api.post("/exchanges", item);
        const remaining = await updateExchanges(scope, (items) =>
          items.filter((i) => i.clientId !== item.clientId),
        );
        api.assertWorkspace(owner, origin);
        setPendingExchanges(remaining);
      } catch (e) {
        api.assertWorkspace(owner, origin);
        if (
          e instanceof api.ApiError &&
          (e.status === 0 || e.status >= 500 || e.status === 401)
        )
          break;
        const remaining = await updateExchanges(scope, (items) =>
          items.map((i) =>
            i.clientId === item.clientId
              ? {
                  ...i,
                  error: e instanceof Error ? e.message : "Could not sync.",
                }
              : i,
          ),
        );
        if (workspaceKey() === scope) setPendingExchanges(remaining);
      }
    }
  }
  useEffect(() => {
    if (!session) return;
    const scope = workspaceKey();
    void readExchanges(scope).then((items) => {
      if (scope === workspaceKey()) setPendingExchanges(items);
    });
    let checking = false,
      disposed = false;
    async function reconnect() {
      if (checking || disposed || scope !== workspaceKey()) return;
      checking = true;
      try {
        await api.get("/me");
        if (disposed || scope !== workspaceKey()) return;
        setOffline(false);
        await sync();
      } catch (e) {
        if (
          !disposed &&
          scope === workspaceKey() &&
          e instanceof api.ApiError &&
          e.status === 0
        )
          setOffline(true);
      } finally {
        checking = false;
      }
    }
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected === false || state.isInternetReachable === false)
        setOffline(true);
      else void reconnect();
    });
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") void reconnect();
    });
    const interval = setInterval(() => {
      if (AppState.currentState !== "background") void reconnect();
    }, 30000);
    return () => {
      disposed = true;
      unsubscribe();
      appState.remove();
      clearInterval(interval);
    };
  }, [session?.user.id, server]);
  async function ai(
    task: string,
    input: any,
    mediaIds?: string[],
    existingJobId?: string,
  ) {
    if (!capabilities.enabled)
      throw new Error(
        capabilities.reason ??
          "AI is not connected yet. You can continue manually.",
      );
    const owner = api.getSession()?.user.id;
    const origin = api.getServer();
    const res = existingJobId
      ? await api.get(`/ai/jobs/${encodeURIComponent(existingJobId)}`)
      : await api.post("/ai/jobs", { task, input, mediaIds });
    const job = await waitForAiJob(res.job, {
      load: async (id) =>
        (await api.get(`/ai/jobs/${encodeURIComponent(id)}`)).job,
      assertWorkspace: () => api.assertWorkspace(owner, origin),
      // Image requests have a 180s server timeout; allow media persistence too.
      timeoutMs:
        task.endsWith("_cleanup") || task === "business_visual"
          ? 240000
          : 120000,
    });
    return job.result;
  }
  return (
    <Context.Provider
      value={{
        ready,
        session,
        data,
        loading,
        offline,
        pendingExchanges,
        mediaProgress,
        exchange,
        error,
        queue,
        capabilities,
        server,
        refresh,
        signIn,
        signInPhone,
        logout,
        setServer,
        capture,
        sync,
        removeQueued,
        notify,
        toast,
        ai,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function usePilot() {
  const c = useContext(Context);
  if (!c) throw new Error("PilotProvider is required");
  return c;
}
