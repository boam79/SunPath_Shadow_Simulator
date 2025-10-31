'use client';

import dynamic from 'next/dynamic';
import SolarChart from '@/components/Chart';
import OptimizationPanel from '@/components/OptimizationPanel';
import type { SolarCalculationResponse, SolarDataPoint } from '@/lib/api';

// Dynamically import Map to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false
});

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
}

export default function MainContent({
  location,
  date,
  currentTime,
  onLocationChange,
  solarData,
  isLoading,
  error,
  onRetry
}: MainContentProps) {
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
  const getCurrentDataPoint = (): SolarDataPoint | null => {
    if (!solarData) return null;
    // Use explicit timezone to avoid parsing issues
    // Format: YYYY-MM-DDTHH:mm:ss (local timezone)
    const target = new Date(`${date}T${currentTime}:00`);
    if (isNaN(target.getTime())) {
      console.error(`Invalid date/time: ${date}T${currentTime}:00`);
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
  };

  const currentDataPoint = getCurrentDataPoint();
  const sunriseStr = (() => {
    const s = solarData?.summary?.sunrise;
    if (typeof s === 'string' && s !== 'N/A') {
      const d = new Date(s);
      if (!isNaN(d.getTime())) return d.toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'});
      return s;
    }
    return s || '--';
  })();
  const sunsetStr = (() => {
    const s = solarData?.summary?.sunset;
    if (typeof s === 'string' && s !== 'N/A') {
      const d = new Date(s);
      if (!isNaN(d.getTime())) return d.toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'});
      return s;
    }
    return s || '--';
  })();

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="w-full md:max-w-6xl mx-auto px-4 pt-4 pb-2">
          <div className="bg-gray-100 dark:bg-gray-800 relative h-[60vh] md:h-[70vh] flex-none rounded-lg overflow-hidden">
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

      {/* Error banner and retry */}
      {error && (
        <div className="w-full md:max-w-6xl mx-auto px-4 mt-3">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center justify-between">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            {onRetry && (
              <button onClick={onRetry} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-md">다시 시도</button>
            )}
          </div>
        </div>
      )}

      {/* Scrollable Content: Data Display (safe minimal) */}
      <div className="flex-1 overflow-y-auto w-full md:max-w-6xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 pt-4 pb-4">
          {location && solarData && !isLoading ? (
            <div className="space-y-4 p-3 md:p-4">
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <div className="p-2 md:p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="text-xs text-yellow-700 dark:text-yellow-400 mb-1">태양 고도</div>
                  <div className="text-xl font-bold text-yellow-900 dark:text-yellow-300">
                    {currentDataPoint ? currentDataPoint.sun.altitude.toFixed(1) : solarData.summary.max_altitude.toFixed(1)}°
                  </div>
                </div>
                <div className="p-2 md:p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="text-xs text-orange-700 dark:text-orange-400 mb-1">일사량 (GHI)</div>
                  <div className="text-xl font-bold text-orange-900 dark:text-orange-300">
                    {currentDataPoint?.irradiance ? Math.round(currentDataPoint.irradiance.ghi) : '--'} W/m²
                  </div>
                </div>
                <div className="p-2 md:p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-xs text-purple-700 dark:text-purple-400 mb-1">그림자 길이</div>
                  <div className="text-xl font-bold text-purple-900 dark:text-purple-300">
                    {typeof currentDataPoint?.shadow?.length === 'number' ? currentDataPoint.shadow.length.toFixed(2) : '--'} m
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 md:gap-3 text-sm">
                <div className="p-2 md:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">일출</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{sunriseStr}</div>
                </div>
                <div className="p-2 md:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">일몰</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{sunsetStr}</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <SolarChart solarData={solarData} currentTime={currentTime} />
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <OptimizationPanel solarData={solarData} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
