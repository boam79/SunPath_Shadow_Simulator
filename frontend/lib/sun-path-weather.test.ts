import { describe, expect, it } from 'vitest';
import { buildSunPathCoordinates, sunMapOffset } from './sun-path-geo';
import { mergeWeatherIntoSeries } from './weather-merge';
import type { SolarCalculationResponse } from '@/lib/api';

describe('sun-path-geo', () => {
  it('returns null when sun below horizon', () => {
    expect(sunMapOffset(37.5, 127, -5, 180)).toBeNull();
  });

  it('builds daytime path with lon/lat pairs', () => {
    const coords = buildSunPathCoordinates(
      { lat: 37.5665, lon: 126.978 },
      [
        { sun: { altitude: 10, azimuth: 90 } },
        { sun: { altitude: 45, azimuth: 180 } },
        { sun: { altitude: -1, azimuth: 270 } },
      ]
    );
    expect(coords).toHaveLength(2);
    expect(coords[0][0]).toBeGreaterThan(126.978);
  });
});

describe('weather-merge', () => {
  const base: SolarCalculationResponse = {
    metadata: {
      request_id: 't',
      timestamp: '2026-06-21T00:00:00Z',
      version: '0.1.0',
      accuracy: { position: 0.05, irradiance: 5 },
    },
    summary: {
      sunrise: '2026-06-21T05:00:00+09:00',
      sunset: '2026-06-21T20:00:00+09:00',
      solar_noon: '2026-06-21T12:30:00+09:00',
      day_length: 14,
      max_altitude: 76,
      total_irradiance: 6.5,
    },
    series: [
      {
        timestamp: '2026-06-21T12:00:00+09:00',
        sun: { altitude: 70, azimuth: 180, zenith: 20, hour_angle: 0 },
        irradiance: { ghi: 800, dni: 700, dhi: 100, par: 360 },
        shadow: null,
      },
    ],
  };

  it('merges shortwave by closest hour', () => {
    const merged = mergeWeatherIntoSeries(base, {
      hourly: {
        time: ['2026-06-21T11:00', '2026-06-21T12:00', '2026-06-21T13:00'],
        cloudcover: [10, 20, 30],
        shortwave_radiation: [500, 650, 600],
        precipitation_probability: [0, 0, 0],
      },
      daily: { sunrise: [], sunset: [] },
    });
    expect(merged[0].weatherGhi).toBe(650);
    expect(merged[0].cloudcover).toBe(20);
  });
});
