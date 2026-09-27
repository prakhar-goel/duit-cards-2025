import { countryNames } from "./countries.js";
const months = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];
const stop = new Set(
  "people person someone who whom i we me my the a an at in on of with from to met meeting meetings last this during find show cards card potential leads lead event conference have has had that and for business".split(
    " ",
  ),
);
export function normalizePlace(s = "") {
  return s
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/gurgaon/g, "gurugram")
    .replace(/bengaluru/g, "bangalore");
}
export function countryName(code = "") {
  return countryNames[code.toUpperCase()] || code;
}
export function parseMeetingQuery(query, now = new Date()) {
  let rest = normalizePlace(query);
  const result = {
    terms: [],
    from: undefined,
    before: undefined,
    leadOnly: /\b(potential leads?|prospects?)\b/.test(rest),
    direction: undefined,
  };
  let from, before;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (/\blast week\b/.test(rest)) {
    before = new Date(start);
    before.setDate(before.getDate() - ((before.getDay() + 6) % 7));
    from = new Date(before);
    from.setDate(from.getDate() - 7);
    rest = rest.replace(/\blast week\b/, "");
  } else if (/\bthis week\b/.test(rest)) {
    from = new Date(start);
    from.setDate(from.getDate() - ((from.getDay() + 6) % 7));
    before = new Date(from);
    before.setDate(before.getDate() + 7);
    rest = rest.replace(/\bthis week\b/, "");
  } else if (/\blast month\b/.test(rest)) {
    from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    before = new Date(now.getFullYear(), now.getMonth(), 1);
    rest = rest.replace(/\blast month\b/, "");
  } else if (/\b(today|yesterday)\b/.test(rest)) {
    from = new Date(start);
    if (rest.includes("yesterday")) from.setDate(from.getDate() - 1);
    before = new Date(from);
    before.setDate(before.getDate() + 1);
    rest = rest.replace(/\b(today|yesterday)\b/, "");
  } else {
    const m = rest.match(
      /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(20\d{2})\b/,
    );
    if (m) {
      const month = months.findIndex((n) => n.startsWith(m[1]));
      from = new Date(Number(m[2]), month, 1);
      before = new Date(Number(m[2]), month + 1, 1);
      rest = rest.replace(m[0], "");
    }
  }
  if (/\b(incoming|received)\b/.test(rest)) result.direction = "incoming";
  if (/\b(outgoing|shared|sent)\b/.test(rest)) result.direction = "outgoing";
  rest = rest
    .replace(/\b(incoming|received|outgoing|shared|sent|prospects?)\b/g, "")
    .replace(/\busa\b/g, "united states")
    .replace(/\buk\b/g, "united kingdom");
  result.terms = [...new Set(rest.match(/[\p{L}\p{N}]+/gu) || [])].filter(
    (t) => !stop.has(t),
  );
  if (from) result.from = from.toISOString();
  if (before) result.before = before.toISOString();
  return result;
}
export function exchangeDirection(type = "") {
  return /both/i.test(type)
    ? "both"
    : /shared|gave|sent/i.test(type)
      ? "outgoing"
      : /received|got/i.test(type)
        ? "incoming"
        : "";
}
export function matchPersonMeeting(person, meetings, filters) {
  if (
    filters.leadOnly &&
    !/lead|prospect|promising|customer/i.test(
      [...(person.tags || []), person.stage || ""].join(" "),
    )
  )
    return null;
  const p = normalizePlace(
    [
      person.name,
      person.company,
      person.role,
      person.bio,
      ...(person.tags || []),
    ]
      .filter(Boolean)
      .join(" "),
  );
  const candidates = meetings.length ? meetings : [null];
  return (
    candidates.find((e) => {
      if ((filters.from || filters.before) && !e) return false;
      const time = e?.occurredAt ? new Date(e.occurredAt).valueOf() : NaN;
      if (filters.from && !(time >= new Date(filters.from).valueOf()))
        return false;
      if (filters.before && !(time < new Date(filters.before).valueOf()))
        return false;
      const direction = e
        ? exchangeDirection(e.exchangeType)
        : person.sourceCardId || person.cardSlug
          ? "incoming"
          : "";
      if (
        filters.direction &&
        direction !== filters.direction &&
        direction !== "both"
      )
        return false;
      // Geography belongs to the encounter, not the person's office or home country.
      const country = e?.countryCode || "";
      if (
        filters.country &&
        normalizePlace(country) !== normalizePlace(filters.country) &&
        normalizePlace(countryName(country)) !== normalizePlace(filters.country)
      )
        return false;
      const place = normalizePlace(
        [e?.location, e?.city, country, countryName(country), e?.eventName]
          .filter(Boolean)
          .join(" "),
      );
      if (filters.place && !place.includes(normalizePlace(filters.place)))
        return false;
      if (
        filters.event &&
        !normalizePlace(e?.eventName || "").includes(
          normalizePlace(filters.event),
        )
      )
        return false;
      const hay = [
        p,
        place,
        normalizePlace(
          [e?.originalNote, e?.recap, e?.relevance].filter(Boolean).join(" "),
        ),
      ].join(" ");
      return filters.terms.every((t) => hay.includes(t));
    }) ?? null
  );
}
export function filterPeople(people, encounters, filters) {
  const byPerson = new Map();
  for (const e of encounters) {
    if (!byPerson.has(e.personId)) byPerson.set(e.personId, []);
    byPerson.get(e.personId).push(e);
  }
  const anyFilter =
    filters.terms.length ||
    filters.from ||
    filters.before ||
    filters.country ||
    filters.place ||
    filters.event ||
    filters.direction ||
    filters.leadOnly;
  return people
    .map((person) => {
      const meetings = (byPerson.get(person.id) || []).sort((a, b) =>
        b.occurredAt.localeCompare(a.occurredAt),
      );
      const meeting = matchPersonMeeting(person, meetings, filters);
      const withoutMeeting =
        !meetings.length &&
        !filters.from &&
        !filters.before &&
        !filters.place &&
        !filters.event &&
        (!filters.direction ||
          (filters.direction === "incoming" &&
            Boolean(person.sourceCardId || person.cardSlug))) &&
        (!filters.leadOnly ||
          /lead|prospect|promising|customer/i.test(
            [...(person.tags || []), person.stage || ""].join(" "),
          )) &&
        !filters.country &&
        filters.terms.every((t) =>
          normalizePlace(
            [
              person.name,
              person.company,
              person.role,
              person.bio,
              person.city,
              countryName(person.countryCode),
            ].join(" "),
          ).includes(t),
        );
      return {
        person,
        meeting,
        visible: !anyFilter || Boolean(meeting) || withoutMeeting,
      };
    })
    .filter((r) => r.visible)
    .sort((a, b) =>
      (b.meeting?.occurredAt || b.person.createdAt || "").localeCompare(
        a.meeting?.occurredAt || a.person.createdAt || "",
      ),
    );
}
