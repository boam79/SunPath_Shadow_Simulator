/**
 * MapLibre 3D helpers: DEM, sun elevation columns, time-based sky.
 */

import { sunMapOffset } from '@/lib/sun-path-geo';

export const OPENFREEMAP_LIBERTY = 'https://tiles.openfreemap.org/styles/liberty';

/** Mapzen Terrarium DEM (AWS public) */
export const TERRAIN_DEM = {
  id: 'terrain-dem',
  tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
  tileSize: 256,
  maxzoom: 15,
  encoding: 'terrarium' as const,
};

export function squareRing(
  lon: number,
  lat: number,
  halfDeg = 0.00006
): number[][] {
  return [
    [lon - halfDeg, lat - halfDeg],
    [lon + halfDeg, lat - halfDeg],
    [lon + halfDeg, lat + halfDeg],
    [lon - halfDeg, lat + halfDeg],
    [lon - halfDeg, lat - halfDeg],
  ];
}

/** Visual extrusion height (m) from solar altitude degrees */
export function altitudeToExtrusionM(altitudeDeg: number): number {
  if (!Number.isFinite(altitudeDeg) || altitudeDeg <= 0) return 0;
  return Math.min(2500, 30 + altitudeDeg * 14);
}

export function sunColumnFeature(
  site: { lat: number; lon: number },
  altitudeDeg: number,
  azimuthDeg: number
): GeoJSON.Feature | null {
  const pos = sunMapOffset(site.lat, site.lon, altitudeDeg, azimuthDeg);
  if (!pos) return null;
  const h = altitudeToExtrusionM(altitudeDeg);
  return {
    type: 'Feature',
    properties: { height: h, kind: 'sun-column' },
    geometry: {
      type: 'Polygon',
      coordinates: [squareRing(pos.lon, pos.lat, 0.00009)],
    },
  };
}

export function sunPathColumnsFeatureCollection(
  site: { lat: number; lon: number },
  series: Array<{ sun: { altitude: number; azimuth: number } }>
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (const p of series) {
    const f = sunColumnFeature(site, p.sun.altitude, p.sun.azimuth);
    if (f) features.push(f);
  }
  return { type: 'FeatureCollection', features };
}

export function sunRayLine(
  site: { lat: number; lon: number },
  altitudeDeg: number,
  azimuthDeg: number
): GeoJSON.Feature | null {
  const pos = sunMapOffset(site.lat, site.lon, altitudeDeg, azimuthDeg, 0.014);
  if (!pos) return null;
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [
        [site.lon, site.lat],
        [pos.lon, pos.lat],
      ],
    },
  };
}

/** Approximate shadow slab for 3D pitch (low extrusion) */
export function shadowSlabFeature(
  polygon: number[][],
  heightM = 2.5
): GeoJSON.Feature | null {
  if (!polygon || polygon.length < 3) return null;
  const ring = [...polygon];
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([...first]);
  }
  return {
    type: 'Feature',
    properties: { height: heightM },
    geometry: { type: 'Polygon', coordinates: [ring] },
  };
}

export type SkyPaint = {
  'sky-color': string;
  'sky-horizon-blend': number;
  'horizon-color': string;
  'horizon-fog-blend': number;
  'fog-color': string;
  'fog-ground-blend': number;
};

/** Time-of-day sky tint (decorative, not physical) */
export function skyForTime(hm: string | undefined): SkyPaint {
  const [h, m] = (hm || '12:00').split(':').map(Number);
  const minutes = (h || 12) * 60 + (m || 0);
  if (minutes < 360 || minutes > 1140) {
    return {
      'sky-color': '#0b1a33',
      'sky-horizon-blend': 0.6,
      'horizon-color': '#1e3a5f',
      'horizon-fog-blend': 0.7,
      'fog-color': '#0f172a',
      'fog-ground-blend': 0.5,
    };
  }
  if (minutes < 480 || minutes > 1080) {
    return {
      'sky-color': '#f97316',
      'sky-horizon-blend': 0.85,
      'horizon-color': '#fbbf24',
      'horizon-fog-blend': 0.6,
      'fog-color': '#fed7aa',
      'fog-ground-blend': 0.35,
    };
  }
  return {
    'sky-color': '#7eb6e8',
    'sky-horizon-blend': 0.8,
    'horizon-color': '#e8f4fc',
    'horizon-fog-blend': 0.5,
    'fog-color': '#ffffff',
    'fog-ground-blend': 0.25,
  };
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
