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
