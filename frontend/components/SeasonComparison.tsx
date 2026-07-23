'use client';

import { useState } from 'react';
import { Loader2, BarChart3, Calendar } from 'lucide-react';
import { calculateBatch, type SolarCalculationRequest, type SolarSummary } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';
import { seasonalDates } from '@/lib/time-wallclock';

interface SeasonComparisonProps {
  location?: { lat: number; lon: number } | null;
  objectHeight: number;
  siteAltitude?: number;
}

type SeasonResult = {
  season: { name: string; date: string; emoji: string };
  summary: SolarSummary;
  maxAltitude: number;
  dayLength: number;
  totalGhi: number | null;
  maxGhi: number;
  minShadow: number | null;
};

function MetricBars({
  title,
  results,
  valueOf,
  format,
  barClass,
}: {
  title: string;
  results: SeasonResult[];
  valueOf: (r: SeasonResult) => number;
  format: (r: SeasonResult) => string;
  barClass: string;
}) {
  const max = Math.max(...results.map(valueOf), 0.0001);
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">{title}</div>
      <div className="space-y-2">
        {results.map((item, idx) => {
          const v = valueOf(item);
          const percentage = (v / max) * 100;
          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700 dark:text-gray-300">
                  {item.season.emoji} {item.season.name}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">{format(item)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div className={`h-full transition-all duration-500 ${barClass}`} style={{ width: `${percentage}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SeasonComparison({
  location,
  objectHeight,
  siteAltitude = 0,
}: SeasonComparisonProps) {
  const { t } = useI18n();
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<SeasonResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const dates = seasonalDates();
  const seasons = [
    { name: t('seasonComparison.seasons.spring'), date: dates.spring, emoji: t('seasonComparison.seasonEmojis.spring') },
    { name: t('seasonComparison.seasons.summer'), date: dates.summer, emoji: t('seasonComparison.seasonEmojis.summer') },
    { name: t('seasonComparison.seasons.autumn'), date: dates.autumn, emoji: t('seasonComparison.seasonEmojis.autumn') },
    { name: t('seasonComparison.seasons.winter'), date: dates.winter, emoji: t('seasonComparison.seasonEmojis.winter') },
  ];

  const handleCompare = async () => {
    if (!location) return;
    setIsCalculating(true);
    setError(null);
    setResults([]);
    try {
      const requests: SolarCalculationRequest[] = seasons.map((season) => ({
        location: { lat: location.lat, lon: location.lon, altitude: siteAltitude },
        datetime: { date: season.date, start_time: '00:00', end_time: '23:59', interval: 60 },
        object: { height: objectHeight },
        options: { atmosphere: true, precision: 'high' },
      }));
      const response = await calculateBatch(requests, true);
      const seasonResults: SeasonResult[] = response.results
        .filter((item) => item.success && item.result)
        .map((item) => {
          const series = item.result!.series;
          const ghiVals = series.map((s) => s.irradiance?.ghi ?? 0);
          const shadows = series
            .map((s) => s.shadow?.length)
            .filter((n): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0);
          return {
            season: seasons[item.index] ?? seasons[0],
            summary: item.result!.summary,
            maxAltitude: Math.max(...series.map((s) => s.sun.altitude)),
            dayLength: item.result!.summary.day_length,
            totalGhi: item.result!.summary.total_irradiance,
            maxGhi: Math.max(...ghiVals, 0),
            minShadow: shadows.length ? Math.min(...shadows) : null,
          };
        });
      setResults(seasonResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadDataError'));
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <BarChart3 className="h-4 w-4 text-blue-600" />
        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('seasonComparison.title')}</h3>
      </div>
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
        <p className="text-xs text-blue-800 dark:text-blue-400">{t('seasonComparison.description')}</p>
      </div>
      <button
        type="button"
        onClick={handleCompare}
        disabled={isCalculating || !location}
        className="flex w-full items-center justify-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {isCalculating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t('seasonComparison.calculating')}</span>
          </>
        ) : (
          <>
            <Calendar className="h-4 w-4" />
            <span>{t('seasonComparison.calculateStart')}</span>
          </>
        )}
      </button>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-xs text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('seasonComparison.results')}</div>
          <MetricBars
            title={t('seasonComparison.maxAltitude')}
            results={results}
            valueOf={(r) => r.maxAltitude}
            format={(r) => `${r.maxAltitude.toFixed(1)}°`}
            barClass="bg-gradient-to-r from-blue-400 to-blue-600"
          />
          <MetricBars
            title={t('seasonComparison.dayLength')}
            results={results}
            valueOf={(r) => r.dayLength}
            format={(r) => {
              const hours = Math.floor(r.dayLength);
              const minutes = Math.floor((r.dayLength - hours) * 60);
              return `${hours}:${minutes.toString().padStart(2, '0')}`;
            }}
            barClass="bg-gradient-to-r from-yellow-400 to-orange-600"
          />
          <MetricBars
            title={t('seasonComparison.totalGhi')}
            results={results}
            valueOf={(r) => r.totalGhi ?? 0}
            format={(r) => (r.totalGhi != null ? r.totalGhi.toFixed(2) : '--')}
            barClass="bg-gradient-to-r from-orange-400 to-amber-600"
          />
          <MetricBars
            title={t('seasonComparison.maxGhi')}
            results={results}
            valueOf={(r) => r.maxGhi}
            format={(r) => `${Math.round(r.maxGhi)}`}
            barClass="bg-gradient-to-r from-amber-400 to-red-500"
          />
          <MetricBars
            title={t('seasonComparison.minShadow')}
            results={results}
            valueOf={(r) => (r.minShadow != null ? 1 / (r.minShadow + 0.1) : 0)}
            format={(r) => (r.minShadow != null ? r.minShadow.toFixed(1) : '--')}
            barClass="bg-gradient-to-r from-slate-400 to-slate-600"
          />
        </div>
      )}
    </div>
  );
}
