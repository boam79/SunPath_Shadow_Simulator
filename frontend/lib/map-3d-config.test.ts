import { describe, expect, it } from 'vitest';
import {
  altitudeToExtrusionM,
  sunColumnFeature,
  skyForTime,
  shadowSlabFeature,
} from './map-3d-config';

describe('map-3d-config', () => {
  it('maps altitude to positive extrusion height', () => {
    expect(altitudeToExtrusionM(-1)).toBe(0);
    expect(altitudeToExtrusionM(45)).toBeGreaterThan(100);
    expect(altitudeToExtrusionM(90)).toBeLessThanOrEqual(2500);
  });

  it('builds sun column polygon when sun is up', () => {
    const f = sunColumnFeature({ lat: 37.5, lon: 127 }, 40, 180);
    expect(f).not.toBeNull();
    expect(f!.geometry.type).toBe('Polygon');
    expect((f!.properties as { height: number }).height).toBeGreaterThan(0);
  });

  it('returns null sun column below horizon', () => {
    expect(sunColumnFeature({ lat: 37.5, lon: 127 }, -5, 90)).toBeNull();
  });

  it('picks night sky for late hours', () => {
    const sky = skyForTime('23:00');
    expect(sky['sky-color']).toMatch(/#0/);
  });

  it('closes shadow slab ring', () => {
    const f = shadowSlabFeature([
      [127, 37],
      [127.001, 37],
      [127.001, 37.001],
    ]);
    expect(f).not.toBeNull();
    const ring = (f!.geometry as GeoJSON.Polygon).coordinates[0];
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });
});
