import { describe, it, expect } from "vitest";
import {
  normalizeServer,
  searchPeople,
  capturePayload,
  blankCapture,
  validCapture,
  camel,
  safeUrl,
} from "./domain";
import type { Person } from "./types";
describe("private pilot domain boundaries", () => {
  it("normalizes API suffixes while preserving a private gateway path", () => {
    expect(normalizeServer(" https://pilot.example/private-key/api/v1/ ")).toBe(
      "https://pilot.example/private-key",
    );
    expect(() => normalizeServer("javascript:alert(1)")).toThrow();
    expect(() =>
      normalizeServer("https://name:secret@pilot.example"),
    ).toThrow();
  });
  it("finds relevant people from explicit saved fields, independent of case", () => {
    const people = [
      {
        id: "a",
        name: "Maya Desai",
        role: "Designer",
        company: "Northstar",
        tags: ["B2B"],
        needs: ["packaging partner"],
      },
      {
        id: "b",
        name: "Noah Morgan",
        role: "Founder",
        company: "Fieldwork",
        tags: ["Events"],
      },
    ] as Person[];
    expect(searchPeople(people, "MAYA b2b").map((p) => p.id)).toEqual(["a"]);
    expect(searchPeople(people, "packaging").map((p) => p.id)).toEqual(["a"]);
    expect(searchPeople(people, "photographer")).toEqual([]);
  });
  it("keeps original meeting notes separate from reviewed AI output", () => {
    const draft = {
      ...blankCapture(),
      name: "Maya",
      originalNote: "Promised to send the rough sketch. No date agreed.",
      recap: "Maya asked to see a rough sketch.",
      proposedFollowUp: "Ask when a review would be useful.",
      commitment: "Send rough sketch",
    };
    const payload = capturePayload(draft);
    expect(payload.originalNote).toBe(draft.originalNote);
    expect(payload.recap).toBe(draft.recap);
    expect(payload.commitments).toEqual([{ text: "Send rough sketch" }]);
    expect(payload.commitments[0]).not.toHaveProperty("dueAt");
  });
  it("allows a repeat encounter without inventing a new person", () => {
    expect(validCapture({ ...blankCapture(), personId: "known-person" })).toBe(
      true,
    );
    expect(validCapture(blankCapture())).toBe(false);
  });
  it("normalizes nested API values without changing their content", () => {
    expect(
      camel({
        person_id: "p1",
        original_note: "my_own_words",
        items: [{ due_at: null }],
      }),
    ).toEqual({
      personId: "p1",
      originalNote: "my_own_words",
      items: [{ dueAt: null }],
    });
  });
  it("permits normal contact actions but rejects executable URLs", () => {
    expect(safeUrl("mailto:hello@example.test")).toBe(
      "mailto:hello@example.test",
    );
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("file:///private/key")).toBeNull();
  });
});
