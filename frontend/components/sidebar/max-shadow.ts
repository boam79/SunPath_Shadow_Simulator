import type { SolarCalculationResponse } from '@/lib/api';

export function maxShadowLength(data: SolarCalculationResponse | null | undefined): number {
  if (!data?.series?.length) return 0;
  return Math.max(
    0,
    ...data.series.map((p) =>
      p.shadow?.length != null && Number.isFinite(p.shadow.length) ? p.shadow.length : 0
    )
  );
}
