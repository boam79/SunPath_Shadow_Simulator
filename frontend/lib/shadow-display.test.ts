import { describe, expect, it } from 'vitest';
import {
  pickFiniteNumber,
  resolveShadowLength,
  shadowLengthFromAltitude,
} from './shadow-display';

describe('shadow-display', () => {
  it('computes noon-ish short shadow', () => {
    const L = shadowLengthFromAltitude(10, 75.9);
    expect(L).not.toBeNull();
    expect(L!).toBeGreaterThan(1);
    expect(L!).toBeLessThan(5);
  });

  it('resolve prefers finite API length', () => {
    expect(resolveShadowLength(12.5, 10, 45)).toBe(12.5);
  });

  it('resolve falls back when API null at high sun', () => {
    const L = resolveShadowLength(null, 10, 75.9);
    expect(L).not.toBeNull();
    expect(L!).toBeGreaterThan(1);
  });

  it('pickFiniteNumber uses either side', () => {
    expect(pickFiniteNumber(null, 8)).toBe(8);
    expect(pickFiniteNumber(3, null)).toBe(3);
    expect(pickFiniteNumber(undefined, undefined)).toBeUndefined();
  });
});
