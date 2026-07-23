/**
 * Map projection helpers for true sun path (azimuth ray from site).
 * Distance shrinks as altitude rises (sun appears closer to zenith / site).
 */

export function sunMapOffset(
  lat: number,
  lon: number,
  altitudeDeg: number,
  azimuthDeg: number,
  maxDegrees = 0.012
): { lat: number; lon: number } | null {
  if (!Number.isFinite(altitudeDeg) || altitudeDeg <= 0) return null;
  const distance = ((90 - Math.min(90, altitudeDeg)) / 90) * maxDegrees;
  const azimuthRad = (azimuthDeg * Math.PI) / 180;
  const latOffset = distance * Math.cos(azimuthRad);
  const lonOffset =
    (distance * Math.sin(azimuthRad)) / Math.cos((lat * Math.PI) / 180);
  return { lat: lat + latOffset, lon: lon + lonOffset };
}

/** GeoJSON LineString coords [lon, lat] for daytime sun path */
export function buildSunPathCoordinates(
  site: { lat: number; lon: number },
  series: Array<{ sun: { altitude: number; azimuth: number } }>
): number[][] {
  const coords: number[][] = [];
  for (const p of series) {
    const pos = sunMapOffset(site.lat, site.lon, p.sun.altitude, p.sun.azimuth);
    if (pos) coords.push([pos.lon, pos.lat]);
  }
  return coords;
}

/** Shadow tip trail (endpoint of shadow line) */
export function buildShadowTipCoordinates(
  series: Array<{ shadow?: { coordinates?: number[][] | null } | null }>
): number[][] {
  return series
    .map((p) => p.shadow?.coordinates?.[1])
    .filter((c): c is number[] => Array.isArray(c) && c.length >= 2);
}
