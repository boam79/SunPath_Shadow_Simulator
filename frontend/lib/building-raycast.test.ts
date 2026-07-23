import { describe, expect, it } from 'vitest';
import {
  castShadowRay,
  clipShadowByBuildings,
  shadowLengthM,
  destinationPoint,
  pointInRing,
  siteShadedByBuildings,
  parseBuildingHeight,
  buildingsFromMapFeatures,
  type BuildingObstacle,
} from './building-raycast';

const site = { lon: 127.0, lat: 37.5 };

function boxBuilding(
  id: string,
  lon: number,
  lat: number,
  half = 0.00015,
  heightM = 30
): BuildingObstacle {
  return {
    id,
    heightM,
    ring: [
      [lon - half, lat - half],
      [lon + half, lat - half],
      [lon + half, lat + half],
      [lon - half, lat + half],
      [lon - half, lat - half],
    ],
  };
}

describe('building-raycast', () => {
  it('computes finite shadow length', () => {
    const L = shadowLengthM(10, 45);
    expect(L).not.toBeNull();
    expect(L!).toBeCloseTo(10, 0);
  });

  it('hits building along eastward ray', () => {
    // building east of site
    const b = boxBuilding('b1', 127.002, 37.5, 0.0002, 40);
    const hit = castShadowRay(site, 90, 500, [b]);
    expect(hit).not.toBeNull();
    expect(hit!.buildingId).toBe('b1');
    expect(hit!.distanceM).toBeGreaterThan(50);
    expect(hit!.distanceM).toBeLessThan(400);
  });

  it('clips object shadow when building blocks', () => {
    // ~40m east — within long low-sun shadow
    const b = boxBuilding('wall', 127.0004, 37.5, 0.00012, 50);
    // sun from west → shadow to east (az 270 → shadow dir 90); low altitude → long shadow
    const r = clipShadowByBuildings(site, 15, 12, 270, [b]);
    expect(r.freeLengthM).not.toBeNull();
    expect(r.freeLengthM!).toBeGreaterThan(50);
    expect(r.hit).not.toBeNull();
    expect(r.clippedLengthM!).toBeLessThan(r.freeLengthM!);
  });

  it('detects site shaded when building occludes sun ray', () => {
    // Tall building north of site; sun in north → building blocks low sun
    const b = boxBuilding('north', 127.0, 37.5005, 0.00015, 80);
    const shaded = siteShadedByBuildings(site, 10, 0, [b]); // sun north, low
    expect(shaded.shaded).toBe(true);
    expect(shaded.byBuildingId).toBe('north');
  });

  it('not shaded when sun is high over building', () => {
    const b = boxBuilding('north', 127.0, 37.5005, 0.00015, 20);
    const shaded = siteShadedByBuildings(site, 70, 0, [b]);
    expect(shaded.shaded).toBe(false);
  });

  it('pointInRing works for square', () => {
    const b = boxBuilding('sq', 127, 37.5);
    expect(pointInRing({ lon: 127, lat: 37.5 }, b.ring)).toBe(true);
    expect(pointInRing({ lon: 127.01, lat: 37.5 }, b.ring)).toBe(false);
  });

  it('parseBuildingHeight prefers render_height', () => {
    expect(parseBuildingHeight({ render_height: 42 })).toBe(42);
    expect(parseBuildingHeight({ levels: 5 })).toBe(15);
    expect(parseBuildingHeight({})).toBe(12);
  });

  it('destinationPoint moves east', () => {
    const p = destinationPoint(site, 111.32, 90); // ~0.001 deg lon at equator-ish
    expect(p.lon).toBeGreaterThan(site.lon);
  });

  it('buildingsFromMapFeatures dedupes and parses height', () => {
    const feats = [
      {
        id: 1,
        properties: { render_height: 24 },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [127, 37.5],
              [127.001, 37.5],
              [127.001, 37.501],
              [127, 37.501],
              [127, 37.5],
            ],
          ],
        },
      },
      {
        id: 1,
        properties: { render_height: 24 },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [127, 37.5],
              [127.001, 37.5],
              [127.001, 37.501],
              [127, 37.501],
              [127, 37.5],
            ],
          ],
        },
      },
    ];
    const list = buildingsFromMapFeatures(feats);
    expect(list).toHaveLength(1);
    expect(list[0].heightM).toBe(24);
  });
});
