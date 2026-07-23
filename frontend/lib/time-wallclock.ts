/**
 * Location wall-clock helpers.
 * Backend timestamps are ISO with offset (e.g. 2025-06-21T12:00:00+09:00).
 * Always read HH:mm from the string so browser TZ does not shift solar matching.
 */

/** Extract "HH:mm" from an ISO timestamp's civil time (before offset/Z). */
export function wallClockHm(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : '12:00';
}

/** Extract hour (0–23) from ISO civil time. */
export function wallClockHour(iso: string): number {
  const m = iso.match(/T(\d{2}):/);
  return m ? Number(m[1]) : 12;
}

/** Offset suffix from ISO (+09:00, -05:00, Z). */
export function isoOffsetSuffix(iso: string): string {
  if (/Z$/i.test(iso)) return 'Z';
  const m = iso.match(/([+-]\d{2}:\d{2})$/);
  return m ? m[1] : 'Z';
}

/**
 * Instant for date + HH:mm interpreted in the same offset as `sampleIso`.
 * Falls back to UTC if sample has no offset.
 */
export function wallClockInstant(date: string, hm: string, sampleIso?: string | null): number {
  const offset = sampleIso ? isoOffsetSuffix(sampleIso) : 'Z';
  const normalized = hm.length === 5 ? `${hm}:00` : hm;
  const iso = `${date}T${normalized}${offset}`;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : Date.parse(`${date}T${normalized}Z`);
}

/** Minutes since midnight from "HH:mm". */
export function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

/** Current year equinox/solstice approx dates (civil calendar). */
export function seasonalDates(year = new Date().getFullYear()): {
  spring: string;
  summer: string;
  autumn: string;
  winter: string;
} {
  return {
    spring: `${year}-03-20`,
    summer: `${year}-06-21`,
    autumn: `${year}-09-23`,
    winter: `${year}-12-21`,
  };
}
