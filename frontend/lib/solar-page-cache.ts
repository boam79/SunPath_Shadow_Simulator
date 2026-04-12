import type { SolarCalculationResponse } from '@/lib/api';

export const CACHE_PREFIX = 'sunpath_v1_';
export const CACHE_TTL_MS = 30 * 60 * 1000;

export function cacheKey(lat: number, lon: number, date: string, height: number): string {
  return `${CACHE_PREFIX}${lat.toFixed(4)}_${lon.toFixed(4)}_${date}_${height}`;
}

export function readCache(key: string): SolarCalculationResponse | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw) as { ts: number; data: SolarCalculationResponse };
    if (Date.now() - ts > CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function writeCache(key: string, data: SolarCalculationResponse): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    /* quota */
  }
}

export function timelineRange(
  solarData: SolarCalculationResponse | null
): { start: string; end: string } {
  if (!solarData) return { start: '05:00', end: '20:00' };
  try {
    const sr = new Date(solarData.summary.sunrise);
    const ss = new Date(solarData.summary.sunset);
    const pad = (n: number) => String(n).padStart(2, '0');
    const startH = Math.max(0, sr.getHours() - 1);
    const endH = Math.min(23, ss.getHours() + 1);
    return { start: `${pad(startH)}:00`, end: `${pad(endH)}:00` };
  } catch {
    return { start: '05:00', end: '20:00' };
  }
}
