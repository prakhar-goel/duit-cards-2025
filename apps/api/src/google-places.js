import { fail } from "./common.js";
export function googlePlace(p, legacy = false) {
  const components = legacy
    ? p.address_components || []
    : p.addressComponents || [];
  const component = (type, short = false) => {
    const c = components.find((c) => c.types?.includes(type));
    return legacy
      ? c?.[short ? "short_name" : "long_name"] || ""
      : c?.[short ? "shortText" : "longText"] || "";
  };
  const latitude = legacy ? p.geometry?.location?.lat : p.location?.latitude;
  const longitude = legacy ? p.geometry?.location?.lng : p.location?.longitude;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const street = [component("street_number"), component("route")]
    .filter(Boolean)
    .join(" ");
  const city =
    component("locality") ||
    component("postal_town") ||
    component("administrative_area_level_2");
  const label = (legacy ? p.formatted_address : p.formattedAddress) || "";
  return {
    location:
      (!legacy && p.displayName?.text) ||
      component("premise") ||
      street ||
      label,
    city,
    countryCode: component("country", true),
    label,
    latitude,
    longitude,
    placeId: legacy ? p.place_id : p.id,
  };
}
export async function googlePlaces(input, key, fetcher = fetch) {
  const options = { signal: AbortSignal.timeout(8000), redirect: "error" };
  let response;
  try {
    if (input.q) {
      response = await fetcher(
        "https://places.googleapis.com/v1/places:searchText",
        {
          ...options,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.addressComponents,places.location",
          },
          body: JSON.stringify({
            textQuery: input.q,
            languageCode: "en",
            pageSize: 5,
            ...(input.latitude !== undefined
              ? {
                  locationBias: {
                    circle: {
                      center: {
                        latitude: input.latitude,
                        longitude: input.longitude,
                      },
                      radius: 10000,
                    },
                  },
                }
              : {}),
          }),
        },
      );
    } else {
      const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
      url.searchParams.set("latlng", `${input.latitude},${input.longitude}`);
      url.searchParams.set("language", "en");
      url.searchParams.set("key", key);
      response = await fetcher(url, options);
    }
  } catch {
    fail(
      503,
      "Google Maps is unavailable. Your GPS can still be saved.",
      "MAPS_UNAVAILABLE",
    );
  }
  if (!response.ok)
    fail(
      503,
      "Google Maps lookup is unavailable. You can type your meeting place.",
      "MAPS_UNAVAILABLE",
    );
  let body;
  try {
    body = await response.json();
  } catch {
    fail(502, "Google Maps returned an invalid response.", "MAPS_UNAVAILABLE");
  }
  if (!input.q && !["OK", "ZERO_RESULTS"].includes(body.status))
    fail(
      503,
      "Google Maps lookup is unavailable. You can type your meeting place.",
      "MAPS_UNAVAILABLE",
    );
  return {
    places: (input.q ? body.places || [] : (body.results || []).slice(0, 1))
      .map((p) => googlePlace(p, !input.q))
      .filter(Boolean),
    provider: "google",
    attribution: "Google Maps",
  };
}
