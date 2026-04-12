'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import SolarChart from '@/components/Chart';
import OptimizationPanel from '@/components/OptimizationPanel';
import { useI18n } from '@/lib/i18n-context';
import type { SolarCalculationResponse, SolarDataPoint } from '@/lib/api';

// Dynamically import Map to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false
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
  // Use useMemo to prevent recalculating on every render
  const currentDataPoint = useMemo((): SolarDataPoint | null => {
    if (!solarData) return null;
    // Use explicit timezone to avoid parsing issues
    // Format: YYYY-MM-DDTHH:mm:ss (local timezone)
    const target = new Date(`${date}T${currentTime}:00`);
    if (isNaN(target.getTime())) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Invalid date/time: ${date}T${currentTime}:00`);
      }
      return null;
    }
    const series = solarData.series.map(p => ({ p, t: new Date(p.timestamp).getTime() }));
    const tt = target.getTime();

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
      timestamp: target.toISOString(),
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
    <div className={`flex flex-1 flex-col overflow-hidden ${mapOnly ? 'min-h-0' : ''}`}>
      {showMap && (
        <div
          className={`z-20 border-b border-amber-100/80 bg-white/80 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/80 ${
            mapOnly ? 'flex min-h-0 flex-1 flex-col' : 'sticky top-0'
          }`}
        >
          <div
            className={`mx-auto w-full max-w-6xl ${
              mapOnly
                ? 'flex min-h-0 flex-1 flex-col px-2 pb-2 pt-2'
                : 'px-3 pb-2 pt-3 md:px-4 md:pt-4'
            }`}
          >
            <div
              className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-white to-amber-50 p-1 shadow-card ring-2 ring-amber-100/70 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 dark:ring-slate-600 ${
                mapOnly ? 'flex min-h-0 flex-1 flex-col' : 'h-[60vh] flex-none md:h-[70vh]'
              }`}
            >
              <div className="relative h-full min-h-0 w-full flex-1 overflow-hidden rounded-[1.15rem] bg-stone-100 dark:bg-slate-950">
                <Map
                  location={location}
                  onLocationChange={handleLocationChange}
                  currentDataPoint={currentDataPoint || null}
                  solarSeries={solarData?.series || null}
                  currentTime={currentTime}
                />
              </div>
            </div>
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
                <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-yellow-50 p-2 shadow-sm dark:border-amber-800/50 dark:from-amber-950/40 dark:to-yellow-950/30 md:p-3">
                  <div className="mb-1 text-xs font-semibold text-amber-800 dark:text-amber-200">{t('map.solarAltitude')}</div>
                  <div className="text-xl font-bold text-amber-950 dark:text-amber-100">
                    {currentDataPoint ? currentDataPoint.sun.altitude.toFixed(1) : solarData.summary.max_altitude.toFixed(1)}°
                  </div>
                </div>
                <div className="rounded-2xl border border-orange-200/90 bg-gradient-to-br from-orange-50 to-amber-50 p-2 shadow-sm dark:border-orange-800/50 dark:from-orange-950/40 dark:to-amber-950/30 md:p-3">
                  <div className="mb-1 text-xs font-semibold text-orange-800 dark:text-orange-200">{t('map.irradiance')} (GHI)</div>
                  <div className="text-xl font-bold text-orange-950 dark:text-orange-100">
                    {currentDataPoint?.irradiance ? Math.round(currentDataPoint.irradiance.ghi) : '--'} W/m²
                  </div>
                </div>
                <div className="rounded-2xl border border-violet-200/90 bg-gradient-to-br from-violet-50 to-purple-50 p-2 shadow-sm dark:border-violet-800/50 dark:from-violet-950/40 dark:to-purple-950/30 md:p-3">
                  <div className="mb-1 text-xs font-semibold text-violet-800 dark:text-violet-200">{t('map.shadowLength')}</div>
                  <div className="text-xl font-bold text-violet-950 dark:text-violet-100">
                    {typeof currentDataPoint?.shadow?.length === 'number' ? currentDataPoint.shadow.length.toFixed(2) : '--'} m
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm md:gap-3">
                <div className="rounded-2xl border border-sky-100 bg-sky-50/90 p-2 dark:border-sky-900/40 dark:bg-sky-950/30 md:p-3">
                  <div className="mb-1 text-xs font-semibold text-sky-800 dark:text-sky-200">{t('optimization.sunrise')}</div>
                  <div className="font-bold text-sky-950 dark:text-sky-50">{sunriseStr}</div>
                </div>
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/90 p-2 dark:border-indigo-900/40 dark:bg-indigo-950/30 md:p-3">
                  <div className="mb-1 text-xs font-semibold text-indigo-800 dark:text-indigo-200">{t('optimization.sunset')}</div>
                  <div className="font-bold text-indigo-950 dark:text-indigo-50">{sunsetStr}</div>
                </div>
              </div>

              <div className="mt-4 border-t border-amber-100/90 pt-4 dark:border-slate-700">
                <SolarChart solarData={solarData} currentTime={currentTime} />
              </div>

              <div className="mt-4 border-t border-amber-100/90 pt-4 dark:border-slate-700">
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
