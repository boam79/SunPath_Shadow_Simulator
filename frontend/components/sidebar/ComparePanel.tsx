'use client';

import BatchCalculator from '@/components/BatchCalculator';
import SeasonComparison from '@/components/SeasonComparison';
import { useI18n } from '@/lib/i18n-context';
import type { SolarCalculationResponse } from '@/lib/api';
import { maxShadowLength } from './max-shadow';

interface ComparePanelProps {
  location: { lat: number; lon: number } | null;
  objectHeight: number;
  compareEnabled?: boolean;
  setCompareEnabled?: (v: boolean) => void;
  compareHeight?: number;
  setCompareHeight?: (h: number) => void;
  solarData?: SolarCalculationResponse | null;
  solarDataB?: SolarCalculationResponse | null;
}

export default function ComparePanel({
  location,
  objectHeight,
  compareEnabled = false,
  setCompareEnabled,
  compareHeight = 5,
  setCompareHeight,
  solarData,
  solarDataB = null,
}: ComparePanelProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-5">
      {setCompareEnabled && setCompareHeight && (
        <section className="space-y-2 rounded-2xl border border-dashed border-[color:var(--glass-border)] p-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink">
            <input
              type="checkbox"
              className="rounded border-amber-200"
              checked={compareEnabled}
              onChange={(e) => setCompareEnabled(e.target.checked)}
            />
            {t('sidebar.compareToggle')}
          </label>
          {compareEnabled && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-ink-muted">
                <span>{t('sidebar.compareHeight')}</span>
                <span className="font-semibold text-ink">{compareHeight}m</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={compareHeight}
                onChange={(e) => setCompareHeight(parseFloat(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>
          )}
          {compareEnabled && solarData && solarDataB && (
            <div className="rounded-xl bg-amber-50/80 p-2 text-xs dark:bg-amber-950/30">
              <div className="mb-1 font-semibold text-amber-900 dark:text-amber-200">
                {t('sidebar.compareTableTitle')}
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="pr-2" />
                    <th className="text-amber-800 dark:text-amber-300">{t('sidebar.compareColA')}</th>
                    <th className="text-amber-800 dark:text-amber-300">{t('sidebar.compareColB')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="pr-2 font-medium">max</td>
                    <td>{maxShadowLength(solarData).toFixed(2)}</td>
                    <td>{maxShadowLength(solarDataB).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-xs font-semibold text-ink-muted">{t('sidebar.tabs.season')}</h3>
        <SeasonComparison location={location} objectHeight={objectHeight} />
      </section>

      <section className="space-y-2 border-t border-[color:var(--glass-border)] pt-4">
        <h3 className="text-xs font-semibold text-ink-muted">{t('sidebar.tabs.batch')}</h3>
        <BatchCalculator />
      </section>
    </div>
  );
}
