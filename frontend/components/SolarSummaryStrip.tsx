'use client';

import { useMemo } from 'react';
import type { SolarCalculationResponse } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';
import { wallClockHm } from '@/lib/time-wallclock';

interface SolarSummaryStripProps {
  solarData: SolarCalculationResponse;
}

function fmtHm(iso: string, locale: string): string {
  if (!iso || iso === 'N/A') return '--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return wallClockHm(iso) || iso;
  }
  return d.toLocaleTimeString(locale === 'ko' ? 'ko-KR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Day summary gauge: sunrise · noon · sunset · day length · max alt · total kWh */
export default function SolarSummaryStrip({ solarData }: SolarSummaryStripProps) {
  const { t, locale } = useI18n();
  const s = solarData.summary;

  const cells = useMemo(
    () => [
      { label: t('summary.sunrise'), value: fmtHm(s.sunrise, locale) },
      { label: t('summary.solarNoon'), value: fmtHm(s.solar_noon, locale) },
      { label: t('summary.sunset'), value: fmtHm(s.sunset, locale) },
      {
        label: t('summary.dayLength'),
        value: `${Number(s.day_length).toFixed(1)}${t('summary.hoursSuffix')}`,
      },
      {
        label: t('summary.maxAltitude'),
        value: `${Number(s.max_altitude).toFixed(1)}°`,
      },
      {
        label: t('summary.totalIrradiance'),
        value:
          s.total_irradiance != null
            ? `${s.total_irradiance.toFixed(2)} kWh/m²`
            : '--',
      },
    ],
    [s, t, locale]
  );

  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6"
      role="group"
      aria-label={t('summary.aria')}
    >
      {cells.map((c) => (
        <div key={c.label} className="d1-glass rounded-xl px-2.5 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
            {c.label}
          </div>
          <div className="font-display text-sm font-semibold text-ink dark:text-sky-50">
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}
