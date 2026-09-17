import type {
  Person,
  Encounter,
  Commitment,
  Lead,
  NeedOffer,
  FeedItem,
  CaptureDraft,
} from "./types";
export function camel<T = any>(v: any): T {
  if (Array.isArray(v)) return v.map(camel) as T;
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [
        k.replace(/_([a-z])/g, (_, s) => s.toUpperCase()),
        camel(x),
      ]),
    ) as T;
  return v as T;
}
export function person(v: any): Person {
  return { ...camel(v), tags: v.tags ?? [] };
}
export function encounter(v: any): Encounter {
  return camel(v);
}
export function commitment(v: any): Commitment {
  return camel(v);
}
export function lead(v: any): Lead {
  return camel(v);
}
export function need(v: any): NeedOffer {
  return camel(v);
}
export function feedItem(v: any): FeedItem {
  return {
    ...camel(v),
    ...(v.person ? { person: person(v.person) } : {}),
    ...(v.commitment ? { commitment: commitment(v.commitment) } : {}),
  };
}
export function initials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0])
      .join("")
      .toUpperCase() || "D"
  );
}
export function firstName(name?: string) {
  return (name ?? "").split(/\s+/)[0] || "there";
}
export function dateLabel(value?: string, withTime = false) {
  if (!value) return "Date not recorded";
  const d = new Date(value);
  if (Number.isNaN(d.valueOf())) return "Date not recorded";
  return (
    d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      ...(d.getFullYear() !== new Date().getFullYear()
        ? { year: "numeric" }
        : {}),
    }) +
    (withTime
      ? " · " +
        d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      : "")
  );
}
export function fullDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
export function normalizeServer(value: string) {
  const s = value
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/v1$/, "");
  const u = new URL(s);
  if (!["http:", "https:"].includes(u.protocol))
    throw new Error("Use an http:// or https:// server address.");
  if (u.username || u.password)
    throw new Error("The server address must not contain a password.");
  return s;
}
export function searchPeople(people: Person[], q: string) {
  const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return people.filter((p) =>
    words.every((w) =>
      [
        p.name,
        p.role,
        p.company,
        p.email,
        p.city,
        p.eventName,
        p.notes,
        ...p.tags,
        ...(p.needs ?? []),
        ...(p.offers ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(w),
    ),
  );
}
export function capturePayload(d: CaptureDraft) {
  return {
    occurredAt: d.occurredAt,
    location: d.location || undefined,
    eventName: d.eventName || undefined,
    meetingType: d.meetingType,
    exchangeType: d.exchangeType,
    originalNote: d.originalNote,
    recap: d.recap,
    proposedFollowUp: d.proposedFollowUp,
    coordinates: d.coordinates,
    commitments: d.commitment.trim()
      ? [{ text: d.commitment.trim(), ...(d.dueAt ? { dueAt: d.dueAt } : {}) }]
      : [],
  };
}
export function blankCapture(): CaptureDraft {
  return {
    name: "",
    role: "",
    company: "",
    email: "",
    phone: "",
    originalNote: "",
    location: "",
    eventName: "",
    occurredAt: new Date().toISOString(),
    meetingType: "Conference",
    exchangeType: "Both exchanged cards",
    commitment: "",
  };
}
export function validCapture(d: CaptureDraft) {
  return Boolean(d.personId || d.name.trim().length >= 2);
}
export function randomId() {
  return (
    "capture-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 12)
  );
}
export function safeUrl(value: string) {
  try {
    const u = new URL(value);
    return ["http:", "https:", "mailto:", "tel:"].includes(u.protocol)
      ? value
      : null;
  } catch {
    return null;
  }
}

export function localDateInput(date = new Date()) {
  return new Date(date.valueOf() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
