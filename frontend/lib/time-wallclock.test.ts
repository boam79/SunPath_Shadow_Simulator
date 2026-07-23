import { describe, it, expect } from 'vitest';
import {
  wallClockHm,
  wallClockHour,
  wallClockInstant,
  hmToMinutes,
  seasonalDates,
} from './time-wallclock';

describe('wallClockHm', () => {
  it('reads civil time from offset ISO', () => {
    expect(wallClockHm('2025-06-21T12:30:00+09:00')).toBe('12:30');
  });
});

describe('wallClockHour', () => {
  it('reads hour from ISO', () => {
    expect(wallClockHour('2025-06-21T05:00:00+09:00')).toBe(5);
  });
});

describe('wallClockInstant', () => {
  it('matches series offset so browser TZ does not shift', () => {
    const sample = '2025-06-21T12:00:00+09:00';
    const t = wallClockInstant('2025-06-21', '12:00', sample);
    expect(t).toBe(Date.parse(sample));
  });
});

describe('hmToMinutes', () => {
  it('parses HH:mm', () => {
    expect(hmToMinutes('14:30')).toBe(14 * 60 + 30);
  });
});

describe('seasonalDates', () => {
  it('uses given year', () => {
    expect(seasonalDates(2026).summer).toBe('2026-06-21');
  });
});
