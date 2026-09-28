import {
  exchangeDirection,
  filterPeople,
  matchPersonMeeting,
  countryName,
} from "../../../../packages/meeting-search/index.js";
import type { Person, Encounter } from "./types";
export function networkRows(
  people: Person[],
  encounters: Encounter[],
  mode: "cards" | "sent",
  filters: any,
) {
  if (mode === "sent") {
    const byId = new Map(people.map((p) => [p.id, p]));
    return encounters
      .filter((e) =>
        ["outgoing", "both"].includes(exchangeDirection(e.exchangeType)),
      )
      .flatMap((meeting) => {
        const person = byId.get(meeting.personId);
        return person && matchPersonMeeting(person, [meeting], filters)
          ? [{ person, meeting }]
          : [];
      })
      .sort((a, b) => b.meeting.occurredAt.localeCompare(a.meeting.occurredAt));
  }
  const received = new Set(
    encounters
      .filter((e) =>
        ["incoming", "both"].includes(exchangeDirection(e.exchangeType)),
      )
      .map((e) => e.personId),
  );
  return filterPeople(
    people.filter(
      (p) => p.cardSlug || p.cardId || p.businessCardUrl || received.has(p.id),
    ),
    encounters,
    filters,
  ) as { person: Person; meeting: Encounter | null }[];
}
export function exchangeFilterOptions(encounters: Encounter[]) {
  const counts = (values: string[]) => [
    ...values.reduce((m, v) => {
      if (v) m.set(v, (m.get(v) || 0) + 1);
      return m;
    }, new Map<string, number>()),
  ];
  return {
    months: counts(encounters.map((e) => e.occurredAt.slice(0, 7))).sort(
      (a, b) => b[0].localeCompare(a[0]),
    ),
    places: counts(encounters.map((e) => e.city || e.location || "")).sort(
      (a, b) => b[1] - a[1],
    ),
    events: counts(encounters.map((e) => e.eventName || "")).sort(
      (a, b) => b[1] - a[1],
    ),
    countries: counts(encounters.map((e) => e.countryCode || "")).map(
      ([code, count]) => ({ code, name: countryName(code), count }),
    ),
  };
}
export function meetingPlace(e?: Encounter | null) {
  return [
    ...new Set([e?.eventName, e?.location, e?.city].filter(Boolean)),
  ].join(" · ");
}
