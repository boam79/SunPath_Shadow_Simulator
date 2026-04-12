import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cacheKey,
  readCache,
  writeCache,
  timelineRange,
  CACHE_PREFIX,
  CACHE_TTL_MS,
} from './solar-page-cache';
import type { SolarCalculationResponse } from '@/lib/api';

function minimalSolar(): SolarCalculationResponse {
  return {
    metadata: {
      request_id: 't',
      timestamp: '',
      version: '1',
      accuracy: { position: 1, irradiance: 1 },
    },
    summary: {
      sunrise: '2025-06-21T00:00:00.000Z',
      sunset: '2025-06-21T12:00:00.000Z',
      solar_noon: '2025-06-21T06:00:00.000Z',
      day_length: 1,
      max_altitude: 1,
      total_irradiance: null,
    },
    series: [],
  };
}

describe('cacheKey', () => {
  it('uses prefix and rounded coordinates', () => {
    expect(cacheKey(37.5665, 126.978, '2025-04-05', 10)).toBe(
      `${CACHE_PREFIX}37.5665_126.9780_2025-04-05_10`
    );
  });
});

describe('sessionStorage cache', () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    vi.stubGlobal('sessionStorage', {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.keys(store).forEach((k) => delete store[k]);
  });

  it('roundtrips data before TTL', () => {
    const key = 'k1';
    const data = minimalSolar();
    writeCache(key, data);
    expect(readCache(key)).toEqual(data);
  });

  it('drops expired entries', () => {
    const key = 'k2';
    const data = minimalSolar();
    const oldTs = Date.now() - CACHE_TTL_MS - 1000;
    store[key] = JSON.stringify({ ts: oldTs, data });
    expect(readCache(key)).toBeNull();
    expect(store[key]).toBeUndefined();
  });
});

describe('timelineRange', () => {
  it('returns defaults when data is null', () => {
    expect(timelineRange(null)).toEqual({ start: '05:00', end: '20:00' });
  });

  it('returns hour-based window from summary', () => {
    const r = timelineRange(minimalSolar());
    expect(r.start).toMatch(/^\d{2}:00$/);
    expect(r.end).toMatch(/^\d{2}:00$/);
  });
});
