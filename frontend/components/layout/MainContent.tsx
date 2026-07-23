'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
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

/** `mapOnly` / `dataOnly`: 모바일 하단 탭용. `full`: 기본(데스크톱 포함). */
export type MainContentLayout = 'full' | 'mapOnly' | 'dataOnly';

interface MainContentProps {
  location: {lat: number; lon: number} | null;
  date: string;
  objectHeight: number;
  currentTime: string;
  onLocationChange?: (loc: {lat: number; lon: number}) => void;
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

  const showMap = layout !== 'dataOnly';
  const showData = layout !== 'mapOnly';
  const mapOnly = layout === 'mapOnly';

  const handleLocationChange = (lat: number, lon: number) => {
    if (onLocationChange) {
      onLocationChange({lat, lon});
    }
  };

  // Calculate shadow endpoint coordinates from length and direction
  function calculateShadowEndpoint(
    startLat: number,
    startLon: number,
    shadowLength: number,
    shadowDirection: number
  ): number[][] | null {
    if (!isFinite(shadowLength) || shadowLength <= 0 || !isFinite(shadowDirection)) {
      return null;
    }

    // Convert direction from degrees to radians
    // Direction: 0° = North, 90° = East, 180° = South, 270° = West
    const directionRad = (shadowDirection * Math.PI) / 180;
    
    // 1 degree latitude ≈ 111,320 meters
    const metersPerDegreeLat = 111320;
    
    // Calculate offset in meters
    const latOffsetMeters = shadowLength * Math.cos(directionRad);
    const lonOffsetMeters = shadowLength * Math.sin(directionRad);
    
    // Convert to degrees (accounting for latitude-dependent longitude spacing)
    const latOffset = latOffsetMeters / metersPerDegreeLat;
    const lonOffset = lonOffsetMeters / (metersPerDegreeLat * Math.cos(startLat * Math.PI / 180));
    
    const endLat = startLat + latOffset;
    const endLon = startLon + lonOffset;
    
    return [[startLon, startLat], [endLon, endLat]];
  }

  // Interpolate data point at selected time for smooth animation
  // Match currentTime as location wall-clock (same offset as series timestamps)
  const currentDataPoint = useMemo((): SolarDataPoint | null => {
    if (!solarData || solarData.series.length === 0) return null;
    const sample = solarData.series[0]?.timestamp
      ?? solarData.summary.sunrise
      ?? solarData.summary.solar_noon;
    const tt = wallClockInstant(date, currentTime, sample);
    if (!Number.isFinite(tt)) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Invalid date/time: ${date}T${currentTime}`);
      }
      return null;
    }
    const series = solarData.series.map(p => ({ p, t: Date.parse(p.timestamp) }));

    // find neighbors
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
      const diff = ((b - a + 540) % 360) - 180; // shortest path
      return (a + diff * ratio + 360) % 360;
    };

    const sunAlt = lerp(prev.p.sun.altitude, next.p.sun.altitude);
    const sunAzi = lerpAngle(prev.p.sun.azimuth, next.p.sun.azimuth);
    const sunZen = lerp(prev.p.sun.zenith, next.p.sun.zenith);

    // Calculate interpolated shadow
    let interpolatedShadow = null;
    if (prev.p.shadow || next.p.shadow) {
      if (prev.p.shadow && next.p.shadow) {
        const shadowLength = (typeof prev.p.shadow.length === 'number' && typeof next.p.shadow.length === 'number') 
          ? lerp(prev.p.shadow.length, next.p.shadow.length) 
          : undefined;
        const shadowDirection = (typeof prev.p.shadow.direction === 'number' && typeof next.p.shadow.direction === 'number') 
          ? lerpAngle(prev.p.shadow.direction, next.p.shadow.direction) 
          : undefined;
        
        // Calculate coordinates if location and shadow data are available
        let shadowCoordinates = null;
        if (location && typeof shadowLength === 'number' && shadowLength > 0 && typeof shadowDirection === 'number') {
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
          coordinates: shadowCoordinates
        };
      } else {
        // Use existing shadow data if only one side has it
        interpolatedShadow = prev.p.shadow || next.p.shadow;
      }
    }

    return {
      timestamp: new Date(tt).toISOString(),
      sun: {
        altitude: sunAlt,
        azimuth: sunAzi,
        zenith: sunZen,
        hour_angle: 0
      },
      irradiance: prev.p.irradiance && next.p.irradiance ? {
        ghi: lerp(prev.p.irradiance.ghi, next.p.irradiance.ghi),
        dni: lerp(prev.p.irradiance.dni, next.p.irradiance.dni),
        dhi: lerp(prev.p.irradiance.dhi, next.p.irradiance.dhi),
        par: prev.p.irradiance.par && next.p.irradiance.par ? lerp(prev.p.irradiance.par, next.p.irradiance.par) : undefined
      } : null,
      shadow: interpolatedShadow
    };
  }, [solarData, date, currentTime, location]);

  const sunriseStr = useMemo(() => {
    const s = solarData?.summary?.sunrise;
    if (typeof s === 'string' && s !== 'N/A') {
      const d = new Date(s);
      if (!isNaN(d.getTime())) return d.toLocaleTimeString(locale === 'ko' ? 'ko-KR' : 'en-US', {hour: '2-digit', minute: '2-digit'});
      return s;
    }
    return s || '--';
  }, [solarData?.summary?.sunrise, locale]);

  const sunsetStr = useMemo(() => {
    const s = solarData?.summary?.sunset;
    if (typeof s === 'string' && s !== 'N/A') {
      const d = new Date(s);
      if (!isNaN(d.getTime())) return d.toLocaleTimeString(locale === 'ko' ? 'ko-KR' : 'en-US', {hour: '2-digit', minute: '2-digit'});
      return s;
    }
    return s || '--';
  }, [solarData?.summary?.sunset, locale]);

  return (
    <div className={`flex h-full min-h-0 flex-1 flex-col overflow-hidden ${mapOnly ? '' : ''}`}>
      {showMap && (
        <div
          className={`z-20 min-h-0 ${
            mapOnly ? 'relative flex flex-1 flex-col' : 'sticky top-0 shrink-0'
          }`}
        >
          <div
            className={`relative w-full ${
              mapOnly ? 'min-h-0 flex-1' : ''
            }`}
          >
            <div
              className={`d1-map-stage relative bg-[#dbeaf5] dark:bg-slate-950 ${
                mapOnly
                  ? 'absolute inset-0 min-h-[240px]'
                  : 'h-[min(72vh,780px)] flex-none md:h-[calc(100vh-7.5rem)]'
              }`}
            >
              <div className="absolute inset-0 min-h-[240px] w-full overflow-hidden">
                <Map
                  location={location}
                  onLocationChange={handleLocationChange}
                  currentDataPoint={currentDataPoint || null}
                  solarSeries={solarData?.series || null}
                  currentTime={currentTime}
                />
              </div>
            </div>
            {/* Reserve height when map is absolute (mapOnly) */}
            {mapOnly && <div className="h-full min-h-[50dvh] w-full" aria-hidden />}
          </div>
        </div>
      )}

      {showData && error && (
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

      {showData && (
      <div className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-3 md:px-4">
        <div className={`pb-6 ${mapOnly ? 'pt-2' : 'pt-3'}`}>
          {layout === 'dataOnly' && (isLoading || !solarData || !location) && !error && (
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
                    {currentDataPoint ? currentDataPoint.sun.altitude.toFixed(1) : solarData.summary.max_altitude.toFixed(1)}°
                  </div>
                </div>
                <div className="d1-glass rounded-2xl p-2 md:p-3">
                  <div className="mb-1 text-xs font-semibold text-ink-muted">{t('map.irradiance')} (GHI)</div>
                  <div className="font-display text-xl font-semibold text-ink dark:text-orange-100">
                    {currentDataPoint?.irradiance ? Math.round(currentDataPoint.irradiance.ghi) : '--'} W/m²
                  </div>
                </div>
                <div className="d1-glass rounded-2xl p-2 md:p-3">
                  <div className="mb-1 text-xs font-semibold text-ink-muted">{t('map.shadowLength')}</div>
                  <div className="font-display text-xl font-semibold text-ink dark:text-stone-100">
                    {typeof currentDataPoint?.shadow?.length === 'number' ? currentDataPoint.shadow.length.toFixed(2) : '--'} m
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm md:gap-3">
                <div className="d1-glass rounded-2xl p-2 md:p-3">
                  <div className="mb-1 text-xs font-semibold text-ink-muted">{t('optimization.sunrise')}</div>
                  <div className="font-semibold text-ink dark:text-sky-50">{sunriseStr}</div>
                </div>
                <div className="d1-glass rounded-2xl p-2 md:p-3">
                  <div className="mb-1 text-xs font-semibold text-ink-muted">{t('optimization.sunset')}</div>
                  <div className="font-semibold text-ink dark:text-sky-50">{sunsetStr}</div>
                </div>
              </div>

              <div className="mt-4 border-t border-[color:var(--glass-border)] pt-4">
                <SolarChart solarData={solarData} currentTime={currentTime} />
              </div>

              <div className="mt-4 border-t border-[color:var(--glass-border)] pt-4">
                <OptimizationPanel solarData={solarData} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
      )}
    </div>
  );
}
