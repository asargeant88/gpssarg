/**
 * Spatial Elevation Lookup Service
 * High-accuracy DEM terrain elevation service (meters & feet)
 */

export async function fetchElevation(lat, lng) {
  if (lat == null || lng == null) return null;

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`);
    const data = await res.json();
    if (data && Array.isArray(data.elevation) && data.elevation.length > 0 && data.elevation[0] != null) {
      return Math.round(data.elevation[0]);
    }
  } catch (e) {}

  // Fallback to open-elevation API
  try {
    const res = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`);
    const data = await res.json();
    if (data && data.results && data.results[0] && data.results[0].elevation != null) {
      return Math.round(data.results[0].elevation);
    }
  } catch (e) {}

  return null;
}

export async function fetchBatchElevations(points = []) {
  if (!points || points.length === 0) return {};

  const validPoints = points.filter((p) => p.lat != null && p.lng != null);
  if (validPoints.length === 0) return {};

  const lats = validPoints.map((p) => p.lat).join(',');
  const lngs = validPoints.map((p) => p.lng).join(',');

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`);
    const data = await res.json();
    if (data && Array.isArray(data.elevation)) {
      const elevationMap = {};
      validPoints.forEach((p, idx) => {
        if (data.elevation[idx] != null) {
          elevationMap[p.id || `${p.lat}_${p.lng}`] = Math.round(data.elevation[idx]);
        }
      });
      return elevationMap;
    }
  } catch (e) {}

  return {};
}
