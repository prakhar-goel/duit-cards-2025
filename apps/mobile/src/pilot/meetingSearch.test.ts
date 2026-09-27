import { describe, it, expect } from "vitest";
import {
  parseMeetingQuery,
  filterPeople,
} from "../../../../packages/meeting-search";
import { introductionMessage, normalisePhone } from "./exchangeMessage";
const p: any = {
  id: "p1",
  name: "Mira",
  company: "Studio",
  countryCode: "BR",
  tags: ["Potential lead"],
};
const e: any = {
  id: "m1",
  personId: "p1",
  occurredAt: "2026-01-12T12:00:00Z",
  location: "Hall 2",
  city: "Gurugram",
  countryCode: "IN",
  eventName: "Startup Summit",
  exchangeType: "Shared my card",
  originalNote: "Packaging",
};
describe("meeting-based people search", () => {
  it("parses month and year and matches city aliases", () => {
    const f = parseMeetingQuery("People I met in Gurgaon in Jan 2026");
    expect(filterPeople([p], [e], f)).toHaveLength(1);
    expect(
      filterPeople([p], [{ ...e, occurredAt: "2025-01-12T12:00:00Z" }], f),
    ).toHaveLength(0);
  });
  it("uses calendar weeks, not a rolling seven-day window", () => {
    const f = parseMeetingQuery("last week", new Date(2026, 8, 27, 12));
    expect(new Date(f.from!).getDate()).toBe(14);
    expect(new Date(f.before!).getDate()).toBe(21);
  });
  it("does not mix date and location from different meetings or profile country", () => {
    const f = { ...parseMeetingQuery("Jan 2026"), country: "BR" };
    expect(
      filterPeople(
        [p],
        [
          e,
          {
            ...e,
            id: "m2",
            occurredAt: "2026-08-12T12:00:00Z",
            countryCode: "BR",
          },
        ],
        f,
      ),
    ).toHaveLength(0);
    expect(
      filterPeople([p], [], { ...parseMeetingQuery(""), country: "BR" }),
    ).toHaveLength(0);
  });
  it("combines event, direction and lead filters and supports received cards without meetings", () => {
    expect(
      filterPeople([p], [e], {
        ...parseMeetingQuery("potential leads startup"),
        direction: "outgoing",
      }),
    ).toHaveLength(1);
    expect(filterPeople([p], [e], parseMeetingQuery("received"))).toHaveLength(
      0,
    );
    expect(
      filterPeople(
        [{ ...p, sourceCardId: "c1" }],
        [],
        parseMeetingQuery("received"),
      ),
    ).toHaveLength(1);
  });
  it("prepares a personal message without claiming WhatsApp delivered it", () => {
    const text = introductionMessage({
      recipient: "Mira",
      sender: "Arjun",
      business: "We build stores.",
      note: "A new website",
      place: "Startup Summit, Gurugram",
      url: "https://duit.test/s/token",
    });
    expect(text).toContain("Mira");
    expect(text).toContain("Arjun");
    expect(text).toContain("Gurugram");
    expect(text).toContain("A new website");
    expect(normalisePhone("+91 98765-43210")).toBe("+919876543210");
  });
});
