export type EventSuggestion = {
  id: string;
  name: string;
  venue?: string;
  city?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  startsAt?: string;
  endsAt?: string;
};
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const rad = (n: number) => (n * Math.PI) / 180;
  const lat = rad(b.latitude - a.latitude),
    lon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(lat / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(lon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
export function suggestEvents(
  events: EventSuggestion[],
  at: string,
  point?: { latitude: number; longitude: number },
) {
  const time = new Date(at).valueOf();
  return events
    .map((event) => {
      const start = new Date(event.startsAt || "").valueOf(),
        end = new Date(event.endsAt || event.startsAt || "").valueOf();
      const nearby =
        point && event.latitude != null && event.longitude != null
          ? distanceKm(point, {
              latitude: event.latitude,
              longitude: event.longitude,
            })
          : null;
      const current =
        Number.isFinite(start) &&
        time >= start - 86400000 &&
        time <= end + 86400000;
      const days = Number.isFinite(start)
        ? Math.abs(time - start) / 86400000
        : 999;
      return {
        event,
        nearby,
        current,
        score:
          (current ? 100 : 0) +
          (nearby != null && nearby < 25 ? 60 - nearby : 0) -
          Math.min(days, 90),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
