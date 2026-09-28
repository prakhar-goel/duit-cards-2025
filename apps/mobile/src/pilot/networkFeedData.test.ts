import { it, expect } from "vitest";
import { networkRows, exchangeFilterOptions } from "./networkFeedData";
import type { Person, Encounter } from "./types";
const people: Person[] = [
  {
    id: "a",
    name: "Aisha",
    company: "Loop",
    role: "Founder",
    tags: [],
    cardSlug: "aisha",
  },
  { id: "b", name: "Ravi", company: "", role: "", tags: [] },
];
const encounters: Encounter[] = [
  {
    id: "one",
    personId: "a",
    occurredAt: "2026-01-02T10:00:00Z",
    exchangeType: "Received their card",
    meetingType: "In person",
    originalNote: "",
    city: "Paris",
    countryCode: "FR",
    eventName: "Paris AI",
  },
  {
    id: "two",
    personId: "b",
    occurredAt: "2026-09-20T10:00:00Z",
    exchangeType: "Shared my card",
    meetingType: "In person",
    originalNote: "",
    city: "Gurugram",
    countryCode: "IN",
    eventName: "Founders night",
  },
  {
    id: "three",
    personId: "b",
    occurredAt: "2026-09-21T10:00:00Z",
    exchangeType: "Shared my card",
    meetingType: "In person",
    originalNote: "",
    city: "Delhi",
    countryCode: "IN",
  },
];
it("keeps outgoing contacts separate, with every share visible even for a repeat recipient", () => {
  expect(
    networkRows(people, encounters, "cards", { terms: [] }).map(
      (r) => r.person.id,
    ),
  ).toEqual(["a"]);
  expect(
    networkRows(people, encounters, "sent", { terms: [] }).map(
      (r) => r.meeting?.id,
    ),
  ).toEqual(["three", "two"]);
  expect(
    networkRows(people, encounters, "sent", {
      terms: [],
      place: "gurgaon",
    }).map((r) => r.meeting?.id),
  ).toEqual(["two"]);
});
it("derives filter values and counts from actual exchanges only", () => {
  const choices = exchangeFilterOptions(encounters.slice(1));
  expect(choices.months).toEqual([["2026-09", 2]]);
  expect(choices.events).toEqual([["Founders night", 1]]);
  expect(choices.countries).toEqual([{ code: "IN", name: "India", count: 2 }]);
  expect(exchangeFilterOptions([]).months).toEqual([]);
});
