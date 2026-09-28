import { googlePlaces } from "./google-places.js";
import { transaction } from "./db.js";
import { mapPlaces } from "./place-results.js";
import { Router } from "express";
import { z } from "zod";
import { auth } from "./auth.js";
import { wrap, fail, rateLimit } from "./common.js";

const input = z
  .object({
    q: z.string().trim().min(3).max(160).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
  })
  .refine((v) => (v.latitude === undefined) === (v.longitude === undefined))
  .refine((v) => v.q || v.latitude !== undefined);
export function reserveMapLookup(userId, kind) {
  return transaction(async (db) => {
    await db.query("SELECT pg_advisory_xact_lock(26092809)");
    const {
      rows: [usage],
    } = await db.query(
      `SELECT count(*)::int AS total,
          count(*) FILTER(WHERE created_at > now()-interval '24 hours')::int AS daily,
          count(*) FILTER(WHERE created_at > now()-interval '24 hours' AND user_id=$1)::int AS personal
          FROM maps_requests`,
      [userId],
    );
    if (usage.total >= 1000 || usage.daily >= 100 || usage.personal >= 50)
      fail(
        429,
        "Map lookup allowance reached. You can still save GPS or type the meeting place.",
        "MAPS_LIMIT",
      );
    await db.query("INSERT INTO maps_requests(user_id,kind) VALUES($1,$2)", [
      userId,
      kind,
    ]);
  });
}
export function locationsRouter({ fetchPlaces = fetch } = {}) {
  const router = Router(),
    cache = new Map();
  router.get(
    "/locations",
    auth,
    rateLimit({ max: 30 }),
    wrap(async (req, res) => {
      const data = input.parse(req.query);
      const googleKey = process.env.GOOGLE_MAPS_API_KEY;
      if (googleKey) {
        // Persistent shared ceilings include failed/uncertain calls and survive deploys.
        await reserveMapLookup(req.userId, data.q ? "search" : "reverse");
        res.setHeader("Cache-Control", "private, no-store");
        return res.json(await googlePlaces(data, googleKey, fetchPlaces));
      }
      const url = new URL(
        data.q ? "/api/" : "/reverse",
        "https://photon.komoot.io",
      );
      url.searchParams.set("limit", data.q ? "5" : "1");
      url.searchParams.set("lang", "en");
      if (data.q) url.searchParams.set("q", data.q);
      if (data.latitude !== undefined) {
        url.searchParams.set("lat", String(data.latitude));
        url.searchParams.set("lon", String(data.longitude));
      }
      const key = url.href,
        cached = cache.get(key);
      if (cached && Date.now() - cached.at < 3600000)
        return res.json(cached.value);
      let response;
      try {
        response = await fetchPlaces(url, {
          signal: AbortSignal.timeout(8000),
          headers: { "User-Agent": "DUIT-location-preview/1.0" },
        });
      } catch {
        fail(
          503,
          "Place search is temporarily unavailable. Your GPS coordinates can still be saved.",
        );
      }
      if (!response.ok)
        fail(
          503,
          "Place search is temporarily unavailable. You can enter a place yourself.",
        );
      const value = {
        places: mapPlaces(await response.json()),
        provider: "photon",
        attribution: "© OpenStreetMap contributors · Photon",
      };
      if (cache.size >= 500) cache.delete(cache.keys().next().value);
      cache.set(key, { at: Date.now(), value });
      res.json(value);
    }),
  );
  return router;
}
