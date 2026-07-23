'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import SolarChart from '@/components/Chart';
import OptimizationPanel from '@/components/OptimizationPanel';
import { useI18n } from '@/lib/i18n-context';
import type { SolarCalculationResponse, SolarDataPoint } from '@/lib/api';
import { wallClockInstant } from '@/lib/time-wallclock';

// Dynamically import Map to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[240px] w-full items-center justify-center bg-[#dbeaf5] text-sm font-medium text-ink-muted dark:bg-slate-900">
      Loading map…
    </div>
  ),
});

/** `mapOnly` / `dataOnly`: 모바일 하단 탭용. `full`: 데스크톱 map-first. */
export type MainContentLayout = 'full' | 'mapOnly' | 'dataOnly';

interface MainContentProps {
  location: { lat: number; lon: number } | null;
  date: string;
  objectHeight: number;
  currentTime: string;
  onLocationChange?: (loc: { lat: number; lon: number }) => void;
  solarData: SolarCalculationResponse | null;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  layout?: MainContentLayout;
}

export default function MainContent({
  location,
  date,
  currentTime,
  onLocationChange,
  solarData,
  isLoading,
  error,
  onRetry,
  layout = 'full',
}: MainContentProps) {
  const { t, locale } = useI18n();
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const showMap = layout !== 'dataOnly';
  const showStackedData = layout === 'dataOnly';
  const mapFills = layout === 'mapOnly' || layout === 'full';
  const desktopHud = layout === 'full';

  const handleLocationChange = (lat: number, lon: number) => {
    if (onLocationChange) {
      onLocationChange({ lat, lon });
    }
  };

  function calculateShadowEndpoint(
    startLat: number,
    startLon: number,
    shadowLength: number,
    shadowDirection: number
  ): number[][] | null {
    if (!isFinite(shadowLength) || shadowLength <= 0 || !isFinite(shadowDirection)) {
      return null;
    }

    const directionRad = (shadowDirection * Math.PI) / 180;
    const metersPerDegreeLat = 111320;
    const latOffsetMeters = shadowLength * Math.cos(directionRad);
    const lonOffsetMeters = shadowLength * Math.sin(directionRad);
    const latOffset = latOffsetMeters / metersPerDegreeLat;
    const lonOffset = lonOffsetMeters / (metersPerDegreeLat * Math.cos((startLat * Math.PI) / 180));

    return [
      [startLon, startLat],
      [startLon + lonOffset, startLat + latOffset],
    ];
  }

  const currentDataPoint = useMemo((): SolarDataPoint | null => {
    if (!solarData || solarData.series.length === 0) return null;
    const sample =
      solarData.series[0]?.timestamp ?? solarData.summary.sunrise ?? solarData.summary.solar_noon;
    const tt = wallClockInstant(date, currentTime, sample);
    if (!Number.isFinite(tt)) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Invalid date/time: ${date}T${currentTime}`);
      }
      return null;
    }
    const series = solarData.series.map((p) => ({ p, t: Date.parse(p.timestamp) }));

    let prev = series[0];
    let next = series[series.length - 1];
    for (let i = 0; i < series.length - 1; i++) {
      if (series[i].t <= tt && tt <= series[i + 1].t) {
        prev = series[i];
        next = series[i + 1];
        break;
      }
    }

    const span = next.t - prev.t;
    if (span <= 0) return prev.p;
    const ratio = Math.min(1, Math.max(0, (tt - prev.t) / span));

    const lerp = (a: number, b: number) => a + (b - a) * ratio;
    const lerpAngle = (a: number, b: number) => {
      const diff = ((b - a + 540) % 360) - 180;
      return (a + diff * ratio + 360) % 360;
    };

    const sunAlt = lerp(prev.p.sun.altitude, next.p.sun.altitude);
    const sunAzi = lerpAngle(prev.p.sun.azimuth, next.p.sun.azimuth);
    const sunZen = lerp(prev.p.sun.zenith, next.p.sun.zenith);

    let interpolatedShadow = null;
    if (prev.p.shadow || next.p.shadow) {
      if (prev.p.shadow && next.p.shadow) {
        const shadowLength =
          typeof prev.p.shadow.length === 'number' && typeof next.p.shadow.length === 'number'
            ? lerp(prev.p.shadow.length, next.p.shadow.length)
            : undefined;
        const shadowDirection =
          typeof prev.p.shadow.direction === 'number' && typeof next.p.shadow.direction === 'number'
            ? lerpAngle(prev.p.shadow.direction, next.p.shadow.direction)
            : undefined;

        let shadowCoordinates = null;
        if (
          location &&
          typeof shadowLength === 'number' &&
          shadowLength > 0 &&
          typeof shadowDirection === 'number'
        ) {
          shadowCoordinates = calculateShadowEndpoint(
            location.lat,
            location.lon,
            shadowLength,
            shadowDirection
          );
        }

        interpolatedShadow = {
          length: shadowLength,
          direction: shadowDirection,
          coordinates: shadowCoordinates,
        };
      } else {
        interpolatedShadow = prev.p.shadow || next.p.shadow;
      }
    }

    return {
      timestamp: new Date(tt).toISOString(),
      sun: {
        altitude: sunAlt,
        azimuth: sunAzi,
        zenith: sunZen,
        hour_angle: 0,
      },
      irradiance:
        prev.p.irradiance && next.p.irradiance
          ? {
              ghi: lerp(prev.p.irradiance.ghi, next.p.irradiance.ghi),
              dni: lerp(prev.p.irradiance.dni, next.p.irradiance.dni),
              dhi: lerp(prev.p.irradiance.dhi, next.p.irradiance.dhi),
              par:
                prev.p.irradiance.par && next.p.irradiance.par
                  ? lerp(prev.p.irradiance.par, next.p.irradiance.par)
                  : undefined,
            }
          : null,
      shadow: interpolatedShadow,
    };
  }, [solarData, date, currentTime, location]);

  const sunriseStr = useMemo(() => {
    const s = solarData?.summary?.sunrise;
    if (typeof s === 'string' && s !== 'N/A') {
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString(locale === 'ko' ? 'ko-KR' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      return s;
    }
    return s || '--';
  }, [solarData?.summary?.sunrise, locale]);

  const sunsetStr = useMemo(() => {
    const s = solarData?.summary?.sunset;
    if (typeof s === 'string' && s !== 'N/A') {
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString(locale === 'ko' ? 'ko-KR' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      return s;
    }
    return s || '--';
  }, [solarData?.summary?.sunset, locale]);

  const metricAltitude = currentDataPoint
    ? currentDataPoint.sun.altitude.toFixed(1)
    : solarData?.summary.max_altitude.toFixed(1);
  const metricGhi = currentDataPoint?.irradiance
    ? Math.round(currentDataPoint.irradiance.ghi)
    : null;
  const metricShadow =
    typeof currentDataPoint?.shadow?.length === 'number'
      ? currentDataPoint.shadow.length.toFixed(2)
      : null;

  const analyticsBody =
    location && solarData && !isLoading ? (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm md:gap-3">
          <div className="d1-glass rounded-xl px-3 py-2">
            <div className="text-[11px] font-semibold text-ink-muted">{t('optimization.sunrise')}</div>
            <div className="font-semibold text-ink dark:text-sky-50">{sunriseStr}</div>
          </div>
          <div className="d1-glass rounded-xl px-3 py-2">
            <div className="text-[11px] font-semibold text-ink-muted">{t('optimization.sunset')}</div>
            <div className="font-semibold text-ink dark:text-sky-50">{sunsetStr}</div>
          </div>
        </div>
        <div className="border-t border-[color:var(--glass-border)] pt-3">
          <SolarChart solarData={solarData} currentTime={currentTime} />
        </div>
        <div className="border-t border-[color:var(--glass-border)] pt-3">
          <OptimizationPanel solarData={solarData} />
        </div>
      </div>
    ) : null;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {showMap && (
        <div className={`relative min-h-0 ${mapFills ? 'flex flex-1 flex-col' : 'shrink-0'}`}>
          <div className={`relative w-full ${mapFills ? 'min-h-0 flex-1' : ''}`}>
            <div
              className={`d1-map-stage bg-[#dbeaf5] dark:bg-slate-950 ${
                mapFills
                  ? 'absolute inset-0 min-h-[240px]'
                  : 'relative h-[min(56vh,560px)] flex-none'
              }`}
            >
              <div className="absolute inset-0 min-h-[240px] w-full overflow-hidden">
                <Map
                  location={location}
                  onLocationChange={handleLocationChange}
                  currentDataPoint={currentDataPoint || null}
                  solarSeries={solarData?.series || null}
                  currentTime={currentTime}
                  overlayMode={desktopHud ? 'hud' : 'default'}
                />
              </div>

              {/* Desktop: live metrics + optional analytics drawer over the map */}
              {desktopHud && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-stone-900/35 via-stone-900/10 to-transparent px-3 pb-3 pt-16 md:px-4 md:pb-4">
                  <div className="pointer-events-auto mx-auto flex w-full max-w-3xl flex-col gap-2">
                    {error && (
                      <div
                        className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/95 p-3 dark:border-rose-800 dark:bg-rose-950/40"
                        role="alert"
                      >
                        <p className="text-sm font-medium text-rose-800 dark:text-rose-200">{error}</p>
                        {onRetry && (
                          <button
                            type="button"
                            onClick={onRetry}
                            className="shrink-0 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700"
                          >
                            {t('optimization.retry')}
                          </button>
                        )}
                      </div>
                    )}

                    {location && solarData && !isLoading && (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="d1-glass rounded-2xl px-2.5 py-2 shadow-soft md:px-3">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted md:text-[11px]">
                              {t('map.solarAltitude')}
                            </div>
                            <div className="font-display text-lg font-semibold text-ink md:text-xl dark:text-amber-100">
                              {metricAltitude}°
                            </div>
                          </div>
                          <div className="d1-glass rounded-2xl px-2.5 py-2 shadow-soft md:px-3">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted md:text-[11px]">
                              {t('map.irradiance')}
                            </div>
                            <div className="font-display text-lg font-semibold text-ink md:text-xl dark:text-orange-100">
                              {metricGhi != null ? `${metricGhi}` : '--'}
                              <span className="ml-0.5 text-xs font-medium text-ink-muted">W/m²</span>
                            </div>
                          </div>
                          <div className="d1-glass rounded-2xl px-2.5 py-2 shadow-soft md:px-3">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted md:text-[11px]">
                              {t('map.shadowLength')}
                            </div>
                            <div className="font-display text-lg font-semibold text-ink md:text-xl dark:text-stone-100">
                              {metricShadow != null ? metricShadow : '--'}
                              <span className="ml-0.5 text-xs font-medium text-ink-muted">m</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setAnalyticsOpen((v) => !v)}
                          className="d1-glass flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold text-ink shadow-soft transition hover:bg-white/90 dark:text-sky-50 dark:hover:bg-slate-900/90"
                          aria-expanded={analyticsOpen}
                        >
                          {analyticsOpen ? (
                            <ChevronDown className="h-4 w-4 text-ink-muted" aria-hidden />
                          ) : (
                            <ChevronUp className="h-4 w-4 text-ink-muted" aria-hidden />
                          )}
                          {analyticsOpen ? t('main.collapseAnalytics') : t('main.expandAnalytics')}
                        </button>

                        <div
                          className={`d1-analytics-drawer d1-glass overflow-hidden rounded-2xl shadow-soft transition-[max-height,opacity] duration-300 ease-out ${
                            analyticsOpen
                              ? 'max-h-[min(42dvh,440px)] opacity-100'
                              : 'max-h-0 opacity-0'
                          }`}
                          aria-hidden={!analyticsOpen}
                        >
                          <div className="max-h-[min(42dvh,440px)] overflow-y-auto overscroll-contain p-3 md:p-4">
                            {analyticsBody}
                          </div>
                        </div>
                      </>
                    )}

                    {isLoading && (
                      <div className="d1-glass rounded-2xl px-4 py-3 text-center text-sm font-medium text-ink-muted shadow-soft">
                        {t('main.dataLoading')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {mapFills && <div className="h-full min-h-[50dvh] w-full" aria-hidden />}
          </div>
        </div>
      )}

      {/* Mobile data tab: stacked charts (unchanged) */}
      {showStackedData && error && (
        <div className="mx-auto mt-3 w-full max-w-6xl px-3 md:px-4" role="alert" aria-live="assertive">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/95 p-3 dark:border-rose-800 dark:bg-rose-950/40">
            <p className="text-sm font-medium text-rose-800 dark:text-rose-200">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="shrink-0 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700"
              >
                {t('optimization.retry')}
              </button>
            )}
          </div>
        </div>
      )}

      {showStackedData && (
        <div className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-3 md:px-4">
          <div className="pb-6 pt-3">
            {(isLoading || !solarData || !location) && !error && (
              <div className="rounded-2xl border border-amber-100/90 bg-white/90 px-4 py-12 text-center text-sm font-medium text-stone-600 dark:border-slate-600 dark:bg-slate-800/80 dark:text-stone-300">
                {isLoading ? t('main.dataLoading') : t('main.dataWaiting')}
              </div>
            )}
            {location && solarData && !isLoading ? (
              <div className="space-y-4 p-2 md:p-4">
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  <div className="d1-glass rounded-2xl p-2 md:p-3">
                    <div className="mb-1 text-xs font-semibold text-ink-muted">{t('map.solarAltitude')}</div>
                    <div className="font-display text-xl font-semibold text-ink dark:text-amber-100">
                      {metricAltitude}°
                    </div>
                  </div>
                  <div className="d1-glass rounded-2xl p-2 md:p-3">
                    <div className="mb-1 text-xs font-semibold text-ink-muted">
                      {t('map.irradiance')} (GHI)
                    </div>
                    <div className="font-display text-xl font-semibold text-ink dark:text-orange-100">
                      {metricGhi != null ? metricGhi : '--'} W/m²
                    </div>
                  </div>
                  <div className="d1-glass rounded-2xl p-2 md:p-3">
                    <div className="mb-1 text-xs font-semibold text-ink-muted">{t('map.shadowLength')}</div>
                    <div className="font-display text-xl font-semibold text-ink dark:text-stone-100">
                      {metricShadow != null ? metricShadow : '--'} m
                    </div>
                  </div>
                </div>
                {analyticsBody}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
