import { expect, it } from "vitest";
import { suggestEvents, distanceKm } from "./meetingContext";
import { blankCapture, capturePayload } from "./domain";
it("ranks a current nearby event ahead of old and distant events without selecting one", () => {
  const suggestions = suggestEvents(
    [
      {
        id: "old",
        name: "Last year",
        startsAt: "2025-09-18",
        latitude: 48.8566,
        longitude: 2.3522,
      },
      {
        id: "near",
        name: "Paris founders",
        startsAt: "2026-09-18T09:00:00Z",
        endsAt: "2026-09-18T18:00:00Z",
        latitude: 48.8566,
        longitude: 2.3522,
      },
      {
        id: "far",
        name: "Singapore",
        startsAt: "2026-09-18T09:00:00Z",
        endsAt: "2026-09-18T18:00:00Z",
        latitude: 1.35,
        longitude: 103.8,
      },
    ],
    "2026-09-18T12:00:00Z",
    { latitude: 48.857, longitude: 2.352 },
  );
  expect(suggestions[0].event.id).toBe("near");
  expect(suggestions[0].nearby).toBeLessThan(1);
  expect(suggestions[1].event.id).toBe("far");
  expect(blankCapture().eventId).toBeUndefined();
});
it("retains the chosen event and editable time when saving or queuing a meeting", () => {
  const payload = capturePayload({
    ...blankCapture(),
    eventId: "chosen-event",
    eventName: "Builders Night",
    location: "Hall B",
    city: "Paris",
    countryCode: "FR",
    occurredAt: "2026-09-16T18:30:00Z",
    coordinates: { latitude: 0, longitude: 0 },
  });
  expect(payload.location).toBe("Hall B");
  expect(payload.city).toBe("Paris");
  expect(payload.countryCode).toBe("FR");
  expect(payload.eventId).toBe("chosen-event");
  expect(payload.occurredAt).toBe("2026-09-16T18:30:00Z");
  expect(payload.coordinates?.latitude).toBe(0);
  expect(
    distanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 }),
  ).toBe(0);
});
