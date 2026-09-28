import { Router } from 'express';
import { z } from 'zod';
import { auth } from './auth.js';
import { wrap, fail, rateLimit } from './common.js';

const input = z.object({
  q: z.string().trim().min(3).max(160).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
}).refine(v => (v.latitude === undefined) === (v.longitude === undefined))
  .refine(v => v.q || v.latitude !== undefined);
export function mapPlaces(body) {
  return (body.features || []).flatMap(f => {
    const p = f.properties || {}, [longitude, latitude] = f.geometry?.coordinates || [];
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    const location = [...new Set([p.name, [p.housenumber, p.street].filter(Boolean).join(' ')].filter(Boolean))].join(', ');
    const city = p.city || p.town || p.village || p.county || '';
    return [{ location: location || city || p.country || 'Selected place', city, countryCode: (p.countrycode || '').toUpperCase(),
      label: [...new Set([location, city, p.state, p.country].filter(Boolean))].join(', '), latitude, longitude }];
  });
}
export function locationsRouter({ fetchPlaces = fetch } = {}) {
  const router = Router(), cache = new Map();
  router.get('/locations', auth, rateLimit({ max: 30 }), wrap(async (req, res) => {
    const data = input.parse(req.query);
    const url = new URL(data.q ? '/api/' : '/reverse', 'https://photon.komoot.io');
    url.searchParams.set('limit', data.q ? '5' : '1');
    url.searchParams.set('lang', 'en');
    if (data.q) url.searchParams.set('q', data.q);
    if (data.latitude !== undefined) {
      url.searchParams.set('lat', String(data.latitude));
      url.searchParams.set('lon', String(data.longitude));
    }
    const key = url.href, cached = cache.get(key);
    if (cached && Date.now() - cached.at < 3600000) return res.json(cached.value);
    let response;
    try { response = await fetchPlaces(url, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'DUIT-location-preview/1.0' } }); }
    catch { fail(503, 'Place search is temporarily unavailable. Your GPS coordinates can still be saved.'); }
    if (!response.ok) fail(503, 'Place search is temporarily unavailable. You can enter a place yourself.');
    const value = { places: mapPlaces(await response.json()), attribution: '© OpenStreetMap contributors · Photon' };
    if (cache.size >= 500) cache.delete(cache.keys().next().value);
    cache.set(key, { at: Date.now(), value });
    res.json(value);
  }));
  return router;
}
