/**
 * Client-side shadow length helpers for UI when API length is missing/null.
 */

export function shadowLengthFromAltitude(
  objectHeightM: number,
  sunAltitudeDeg: number
): number | null {
  if (!Number.isFinite(objectHeightM) || objectHeightM <= 0) return null;
  if (!Number.isFinite(sunAltitudeDeg) || sunAltitudeDeg <= 0.1) return null;
  return objectHeightM / Math.tan((sunAltitudeDeg * Math.PI) / 180);
}

/** Prefer finite API length; otherwise derive from height + altitude. */
export function resolveShadowLength(
  apiLength: number | null | undefined,
  objectHeightM: number,
  sunAltitudeDeg: number
): number | null {
  if (typeof apiLength === 'number' && Number.isFinite(apiLength) && apiLength >= 0) {
    return apiLength;
  }
  return shadowLengthFromAltitude(objectHeightM, sunAltitudeDeg);
}

export function pickFiniteNumber(
  a: number | null | undefined,
  b: number | null | undefined
): number | undefined {
  if (typeof a === 'number' && Number.isFinite(a)) return a;
  if (typeof b === 'number' && Number.isFinite(b)) return b;
  return undefined;
}
