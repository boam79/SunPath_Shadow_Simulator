/**
 * Multi-building ground shadow raycast (vector-tile BIM proxy).
 * Uses footprint polygons + height — not full mesh RT, but real occlusion clips.
 */

export type LonLat = { lon: number; lat: number };

export type BuildingObstacle = {
  id: string;
  /** Exterior ring [lon, lat][] (closed or open) */
  ring: number[][];
  heightM: number;
};

export type RaycastHit = {
  buildingId: string;
  distanceM: number;
  point: LonLat;
};

const METERS_PER_DEG_LAT = 111320;

export function metersPerDegLon(lat: number): number {
  return METERS_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
}

export function offsetMeters(
  origin: LonLat,
  eastM: number,
  northM: number
): LonLat {
  return {
    lat: origin.lat + northM / METERS_PER_DEG_LAT,
    lon: origin.lon + eastM / metersPerDegLon(origin.lat),
  };
}

/** Bearing: 0=N, 90=E (same as solar azimuth convention) */
export function destinationPoint(
  origin: LonLat,
  distanceM: number,
  bearingDeg: number
): LonLat {
  const rad = (bearingDeg * Math.PI) / 180;
  const north = distanceM * Math.cos(rad);
  const east = distanceM * Math.sin(rad);
  return offsetMeters(origin, east, north);
}

export function shadowLengthM(objectHeightM: number, sunAltitudeDeg: number): number | null {
  if (!Number.isFinite(objectHeightM) || objectHeightM <= 0) return null;
  if (!Number.isFinite(sunAltitudeDeg) || sunAltitudeDeg <= 0.1) return null;
  return objectHeightM / Math.tan((sunAltitudeDeg * Math.PI) / 180);
}

export function shadowDirectionDeg(sunAzimuthDeg: number): number {
  return (sunAzimuthDeg + 180) % 360;
}

function cross(ax: number, ay: number, bx: number, by: number): number {
  return ax * by - ay * bx;
}

/** Segment intersection in lon/lat plane (local approx OK for city scale) */
export function segmentIntersection(
  a1: LonLat,
  a2: LonLat,
  b1: LonLat,
  b2: LonLat
): LonLat | null {
  const ax = a2.lon - a1.lon;
  const ay = a2.lat - a1.lat;
  const bx = b2.lon - b1.lon;
  const by = b2.lat - b1.lat;
  const den = cross(ax, ay, bx, by);
  if (Math.abs(den) < 1e-18) return null;
  const cx = b1.lon - a1.lon;
  const cy = b1.lat - a1.lat;
  const t = cross(cx, cy, bx, by) / den;
  const u = cross(cx, cy, ax, ay) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { lon: a1.lon + t * ax, lat: a1.lat + t * ay };
}

export function distanceMeters(a: LonLat, b: LonLat): number {
  const dLat = (b.lat - a.lat) * METERS_PER_DEG_LAT;
  const dLon = (b.lon - a.lon) * metersPerDegLon((a.lat + b.lat) / 2);
  return Math.hypot(dLat, dLon);
}

function ensureClosed(ring: number[][]): number[][] {
  if (ring.length < 3) return ring;
  const f = ring[0];
  const l = ring[ring.length - 1];
  if (f[0] === l[0] && f[1] === l[1]) return ring;
  return [...ring, [f[0], f[1]]];
}

export function pointInRing(point: LonLat, ring: number[][]): boolean {
  const closed = ensureClosed(ring);
  let inside = false;
  for (let i = 0, j = closed.length - 1; i < closed.length; j = i++) {
    const xi = closed[i][0];
    const yi = closed[i][1];
    const xj = closed[j][0];
    const yj = closed[j][1];
    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lon < ((xj - xi) * (point.lat - yi)) / (yj - yi + 1e-18) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Cast a ground ray from origin along bearing for maxDistanceM.
 * Returns nearest building edge hit (excluding buildings that contain the origin).
 */
export function castShadowRay(
  origin: LonLat,
  bearingDeg: number,
  maxDistanceM: number,
  buildings: BuildingObstacle[]
): RaycastHit | null {
  if (maxDistanceM <= 0 || buildings.length === 0) return null;
  const end = destinationPoint(origin, maxDistanceM, bearingDeg);
  let best: RaycastHit | null = null;

  for (const b of buildings) {
    if (b.ring.length < 3) continue;
    if (pointInRing(origin, b.ring)) continue;
    const ring = ensureClosed(b.ring);
    for (let i = 0; i < ring.length - 1; i++) {
      const p1 = { lon: ring[i][0], lat: ring[i][1] };
      const p2 = { lon: ring[i + 1][0], lat: ring[i + 1][1] };
      const hit = segmentIntersection(origin, end, p1, p2);
      if (!hit) continue;
      const d = distanceMeters(origin, hit);
      if (d < 0.5) continue;
      if (!best || d < best.distanceM) {
        best = { buildingId: b.id, distanceM: d, point: hit };
      }
    }
  }
  return best;
}

/** Clip free-space shadow length by first building hit along shadow direction */
export function clipShadowByBuildings(
  origin: LonLat,
  objectHeightM: number,
  sunAltitudeDeg: number,
  sunAzimuthDeg: number,
  buildings: BuildingObstacle[]
): {
  freeLengthM: number | null;
  clippedLengthM: number | null;
  hit: RaycastHit | null;
  directionDeg: number;
  endpoint: LonLat | null;
} {
  const directionDeg = shadowDirectionDeg(sunAzimuthDeg);
  const freeLengthM = shadowLengthM(objectHeightM, sunAltitudeDeg);
  if (freeLengthM == null) {
    return {
      freeLengthM: null,
      clippedLengthM: null,
      hit: null,
      directionDeg,
      endpoint: null,
    };
  }
  const hit = castShadowRay(origin, directionDeg, freeLengthM, buildings);
  const clippedLengthM = hit ? Math.min(freeLengthM, hit.distanceM) : freeLengthM;
  const endpoint = destinationPoint(origin, clippedLengthM, directionDeg);
  return { freeLengthM, clippedLengthM, hit, directionDeg, endpoint };
}

/**
 * Is the site in shade from any building?
 * Ray toward the sun: if a building top subtends elevation > sun altitude, it occludes.
 */
export function siteShadedByBuildings(
  site: LonLat,
  sunAltitudeDeg: number,
  sunAzimuthDeg: number,
  buildings: BuildingObstacle[]
): { shaded: boolean; byBuildingId: string | null; elevationToTopDeg?: number } {
  if (sunAltitudeDeg <= 0.1) return { shaded: false, byBuildingId: null };
  const maxR = 600;
  const hit = castShadowRay(site, sunAzimuthDeg, maxR, buildings);
  if (!hit) return { shaded: false, byBuildingId: null };
  const b = buildings.find((x) => x.id === hit.buildingId);
  if (!b) return { shaded: false, byBuildingId: null };
  const elevToTop = (Math.atan2(b.heightM, hit.distanceM) * 180) / Math.PI;
  if (elevToTop > sunAltitudeDeg) {
    return { shaded: true, byBuildingId: b.id, elevationToTopDeg: elevToTop };
  }
  return { shaded: false, byBuildingId: null, elevationToTopDeg: elevToTop };
}

/** Sweep building ring by shadow vector → approximate shadow polygon ring [lon,lat][] */
export function buildingShadowFootprint(
  ring: number[][],
  shadowLengthMVal: number,
  shadowDirDeg: number
): number[][] | null {
  if (ring.length < 3 || shadowLengthMVal <= 0) return null;
  const base = ensureClosed(ring).slice(0, -1);
  if (base.length < 3) return null;
  const tips = base.map(([lon, lat]) => {
    const p = destinationPoint({ lon, lat }, shadowLengthMVal, shadowDirDeg);
    return [p.lon, p.lat] as number[];
  });
  // polygon: base forward + tips reversed (same pattern as backend shadow polygon)
  const poly = [...base, ...tips.reverse()];
  return ensureClosed(poly);
}

export function buildingShadowsGeoJSON(
  buildings: BuildingObstacle[],
  sunAltitudeDeg: number,
  sunAzimuthDeg: number,
  maxBuildings = 48
): GeoJSON.FeatureCollection {
  const dir = shadowDirectionDeg(sunAzimuthDeg);
  const features: GeoJSON.Feature[] = [];
  const list = buildings.slice(0, maxBuildings);
  for (const b of list) {
    const L = shadowLengthM(b.heightM, sunAltitudeDeg);
    if (L == null) continue;
    const fp = buildingShadowFootprint(b.ring, Math.min(L, 400), dir);
    if (!fp) continue;
    features.push({
      type: 'Feature',
      properties: {
        buildingId: b.id,
        height: b.heightM,
        shadowLength: L,
      },
      geometry: { type: 'Polygon', coordinates: [fp] },
    });
  }
  return { type: 'FeatureCollection', features };
}

export function parseBuildingHeight(props: Record<string, unknown> | null | undefined): number {
  if (!props) return 12;
  const rh = props.render_height ?? props.height;
  if (typeof rh === 'number' && Number.isFinite(rh) && rh > 1) return rh;
  if (typeof rh === 'string') {
    const n = parseFloat(rh);
    if (Number.isFinite(n) && n > 1) return n;
  }
  const levels = props.levels ?? props['building:levels'];
  if (typeof levels === 'number' && levels > 0) return levels * 3;
  if (typeof levels === 'string') {
    const n = parseFloat(levels);
    if (Number.isFinite(n) && n > 0) return n * 3;
  }
  return 12;
}

export function ringFromGeometry(geometry: GeoJSON.Geometry | null | undefined): number[][] | null {
  if (!geometry) return null;
  if (geometry.type === 'Polygon' && geometry.coordinates[0]?.length >= 3) {
    return geometry.coordinates[0].map((c) => [c[0], c[1]]);
  }
  if (geometry.type === 'MultiPolygon' && geometry.coordinates[0]?.[0]?.length >= 3) {
    return geometry.coordinates[0][0].map((c) => [c[0], c[1]]);
  }
  return null;
}

/** Convert MapLibre vector-tile building features → obstacles (deduped). */
export function buildingsFromMapFeatures(
  features: Array<{
    id?: string | number;
    properties?: Record<string, unknown> | null;
    geometry?: GeoJSON.Geometry | null;
  }>
): BuildingObstacle[] {
  const out: BuildingObstacle[] = [];
  const seen = new Set<string>();
  for (const f of features) {
    const ring = ringFromGeometry(f.geometry ?? undefined);
    if (!ring || ring.length < 3) continue;
    const props = (f.properties ?? {}) as Record<string, unknown>;
    const id = String(
      f.id ?? props.osm_id ?? props.id ?? `${ring[0][0].toFixed(5)},${ring[0][1].toFixed(5)}`
    );
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, ring, heightM: parseBuildingHeight(props) });
  }
  return out;
}

/** Keep buildings near site (meters) */
export function filterBuildingsNear(
  site: LonLat,
  buildings: BuildingObstacle[],
  radiusM: number,
  limit = 64
): BuildingObstacle[] {
  return buildings
    .map((b) => {
      const c = ringCentroid(b.ring);
      return { b, d: c ? distanceMeters(site, c) : Infinity };
    })
    .filter((x) => x.d <= radiusM)
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map((x) => x.b);
}

export function ringCentroid(ring: number[][]): LonLat | null {
  if (!ring.length) return null;
  let lon = 0;
  let lat = 0;
  const n = ring.length - (ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? 1 : 0);
  const use = n > 0 ? n : ring.length;
  for (let i = 0; i < use; i++) {
    lon += ring[i][0];
    lat += ring[i][1];
  }
  return { lon: lon / use, lat: lat / use };
}
