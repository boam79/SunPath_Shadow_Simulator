'use client';

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { SolarCalculationResponse } from '@/lib/api';
import { useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { wallClockHm, hmToMinutes } from '@/lib/time-wallclock';
import type { SeriesWithWeather } from '@/lib/weather-merge';

interface SolarChartProps {
  solarData: SolarCalculationResponse | null;
  currentTime: string;
  seriesOverride?: SeriesWithWeather[] | null;
}

export default function SolarChart({
  solarData,
  currentTime,
  seriesOverride = null,
}: SolarChartProps) {
  const { t } = useI18n();
  const [showWeather, setShowWeather] = useState(true);
  const [showPar, setShowPar] = useState(false);
  const [showPoa, setShowPoa] = useState(true);

  const chartData = useMemo(() => {
    const series = seriesOverride ?? solarData?.series ?? [];
    return series.map((point) => {
      const timeStr = wallClockHm(point.timestamp);
      const weatherGhi =
        'weatherGhi' in point && typeof point.weatherGhi === 'number' ? point.weatherGhi : null;
      return {
        time: timeStr,
        timestamp: Date.parse(point.timestamp),
        altitude: point.sun?.altitude || 0,
        azimuth: point.sun?.azimuth || 0,
        ghi: point.irradiance?.ghi || 0,
        dni: point.irradiance?.dni || 0,
        dhi: point.irradiance?.dhi || 0,
        par: point.irradiance?.par ?? null,
        poa: point.irradiance?.poa ?? null,
        weatherGhi,
        shadowLength:
          typeof point.shadow?.length === 'number' && isFinite(point.shadow.length)
            ? point.shadow.length
            : null,
      };
    });
  }, [seriesOverride, solarData]);

  const hasWeather = chartData.some((d) => d.weatherGhi != null);
  const hasPoa = chartData.some((d) => d.poa != null && Number(d.poa) > 0);
  const hasPar = chartData.some((d) => d.par != null);

  const currentTimeIndex = useMemo(() => {
    if (!solarData || !currentTime) return -1;
    try {
      const targetMin = hmToMinutes(currentTime);
      if (!Number.isFinite(targetMin)) return -1;
      let closestIndex = -1;
      let minDiff = Infinity;
      chartData.forEach((d, index) => {
        const dMin = hmToMinutes(d.time);
        if (Number.isFinite(dMin)) {
          const diff = Math.abs(targetMin - dMin);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = index;
          }
        }
      });
      return minDiff <= 5 ? closestIndex : -1;
    } catch {
      return -1;
    }
  }, [chartData, currentTime, solarData]);

  if (!solarData || chartData.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {hasWeather && (
          <button
            type="button"
            onClick={() => setShowWeather((v) => !v)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              showWeather
                ? 'bg-sky-600 text-white'
                : 'bg-stone-200 text-stone-700 dark:bg-slate-700 dark:text-stone-200'
            }`}
            aria-pressed={showWeather}
          >
            {t('chart.showWeather')}
          </button>
        )}
        {hasPoa && (
          <button
            type="button"
            onClick={() => setShowPoa((v) => !v)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              showPoa
                ? 'bg-amber-600 text-white'
                : 'bg-stone-200 text-stone-700 dark:bg-slate-700 dark:text-stone-200'
            }`}
            aria-pressed={showPoa}
          >
            {t('chart.showPoa')}
          </button>
        )}
        {hasPar && (
          <button
            type="button"
            onClick={() => setShowPar((v) => !v)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              showPar
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-200 text-stone-700 dark:bg-slate-700 dark:text-stone-200'
            }`}
            aria-pressed={showPar}
          >
            {t('chart.showPar')}
          </button>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          {t('chart.altitudeAzimuth')}
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="time" stroke="#6b7280" fontSize={12} interval="preserveStartEnd" />
            <YAxis
              yAxisId="left"
              label={{
                value: `${t('chart.altitude')} (°)`,
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle' },
              }}
              stroke="#f59e0b"
              fontSize={12}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{
                value: `${t('chart.azimuth')} (°)`,
                angle: 90,
                position: 'insideRight',
                style: { textAnchor: 'middle' },
              }}
              stroke="#3b82f6"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="altitude"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name={t('chart.altitude')}
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="azimuth"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name={t('chart.azimuth')}
              isAnimationActive={false}
            />
            {currentTimeIndex >= 0 && currentTimeIndex < chartData.length && (
              <ReferenceLine
                x={chartData[currentTimeIndex]?.time}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{ value: t('chart.current'), position: 'top', fill: '#ef4444' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          {t('chart.ghiArea')}
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="ghiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="time" stroke="#6b7280" fontSize={12} interval="preserveStartEnd" />
            <YAxis
              label={{
                value: t('chart.irradiance'),
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle' },
              }}
              stroke="#f97316"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="ghi"
              stroke="#f97316"
              strokeWidth={2}
              fill="url(#ghiGradient)"
              name={t('chart.ghi')}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="dni"
              stroke="#ea580c"
              strokeWidth={1.5}
              fillOpacity={0}
              name={t('chart.dni')}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="dhi"
              stroke="#fb923c"
              strokeWidth={1.5}
              fillOpacity={0}
              name={t('chart.dhi')}
              isAnimationActive={false}
            />
            {showWeather && hasWeather && (
              <Line
                type="monotone"
                dataKey="weatherGhi"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={false}
                name={t('chart.weatherGhi')}
                isAnimationActive={false}
              />
            )}
            {showPoa && hasPoa && (
              <Line
                type="monotone"
                dataKey="poa"
                stroke="#b45309"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={false}
                name={t('chart.poa')}
                isAnimationActive={false}
              />
            )}
            {showPar && hasPar && (
              <Line
                type="monotone"
                dataKey="par"
                stroke="#059669"
                strokeWidth={2}
                dot={false}
                name={t('chart.par')}
                isAnimationActive={false}
              />
            )}
            {currentTimeIndex >= 0 && currentTimeIndex < chartData.length && (
              <ReferenceLine
                x={chartData[currentTimeIndex]?.time}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{ value: t('chart.current'), position: 'top', fill: '#ef4444' }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          {t('chart.shadowVariation')}
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="time" stroke="#6b7280" fontSize={12} interval="preserveStartEnd" />
            <YAxis
              label={{
                value: t('chart.shadowLength'),
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle' },
              }}
              stroke="#7c3aed"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
              }}
            />
            <Bar dataKey="shadowLength" fill="#8b5cf6" name={t('chart.length')} isAnimationActive={false} />
            {currentTimeIndex >= 0 && currentTimeIndex < chartData.length && (
              <ReferenceLine
                x={chartData[currentTimeIndex]?.time}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="3 3"
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
