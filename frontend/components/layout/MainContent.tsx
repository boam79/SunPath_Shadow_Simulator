'use client';

import dynamic from 'next/dynamic';
import Timeline from '@/components/Timeline';
import SolarChart from '@/components/Chart';
import OptimizationPanel from '@/components/OptimizationPanel';

// Dynamically import Map to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), {
ssr: false,
loading: () => (
<div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
<div className="text-gray-500 dark:text-gray-400">지도 로딩 중...</div>
</div>
)
});

import type { SolarCalculationResponse } from '@/lib/api';

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
  timeline?: {
    currentTime: string;
    onTimeChange: (t: string) => void;
    isPlaying: boolean;
    onPlayPause: () => void;
    startTime?: string;
    endTime?: string;
  };
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
  timeline
}: MainContentProps) {
  const handleLocationChange = (lat: number, lon: number) => {
    if (onLocationChange) {
      onLocationChange({lat, lon});
    }
  };

  // Calculate shadow endpoint coordinates from length and direction
  const calculateShadowEndpoint = (
    startLat: number,
    startLon: number,
    shadowLength: number,
    shadowDirection: number
  ): number[][] | null => {
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
  };

  // Interpolate data point at selected time for smooth animation
  const currentDataPoint = (() => {
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
    } as typeof solarData.series[number];
  })();

  return (
    <main className="flex-1 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto w-full md:max-w-6xl mx-auto px-4">
        {/* Map Container */}
        <div className="bg-gray-100 dark:bg-gray-800 relative h-[25vh] md:h-[30vh] flex-none rounded-lg overflow-hidden mt-4">
        <Map 
          location={location} 
          onLocationChange={handleLocationChange}
          currentDataPoint={currentDataPoint || null}
          solarSeries={solarData?.series || null}
          currentTime={currentTime}
        />
      </div>

      {/* Bottom Panel - Data Display + Timeline */}
      <div className="bg-white dark:bg-gray-800">
        <div className="p-3 md:p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">
            실시간 데이터
          </h2>
          
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">데이터 계산 중...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium mb-1">❌ 오류 발생</p>
                  <p className="text-sm text-red-600 dark:text-red-500">{error}</p>
                </div>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors whitespace-nowrap"
                  >
                    다시 시도
                  </button>
                )}
              </div>
            </div>
          )}

          {!location ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              위치를 선택하면 데이터가 표시됩니다
            </p>
          ) : solarData && !isLoading ? (
            <div className="space-y-4">
              {/* Summary Cards */}
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

              {/* Summary Info */}
              <div className="grid grid-cols-2 gap-2 md:gap-3 text-sm">
                <div className="p-2 md:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">일출</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {(() => {
                      const sunrise = typeof solarData.summary.sunrise === 'string' && solarData.summary.sunrise !== 'N/A'
                        ? new Date(solarData.summary.sunrise)
                        : null;
                      return sunrise && !isNaN(sunrise.getTime())
                        ? sunrise.toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'})
                        : solarData.summary.sunrise || '--';
                    })()}
                  </div>
                </div>
                <div className="p-2 md:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">일몰</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {(() => {
                      const sunset = typeof solarData.summary.sunset === 'string' && solarData.summary.sunset !== 'N/A'
                        ? new Date(solarData.summary.sunset)
                        : null;
                      return sunset && !isNaN(sunset.getTime())
                        ? sunset.toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'})
                        : solarData.summary.sunset || '--';
                    })()}
                  </div>
                </div>
                <div className="p-2 md:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">일조 시간</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {solarData.summary.day_length.toFixed(1)}시간
                  </div>
                </div>
                <div className="p-2 md:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">총 일사량</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {solarData.summary.total_irradiance?.toFixed(2) || '--'} kWh/m²
                  </div>
                </div>
              </div>

              {/* Data Points Info */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                📊 {solarData.series.length}개 데이터 포인트 | 
                📅 {date} | 
                ⏱️ 1시간 간격
              </div>

              {/* Charts */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <SolarChart solarData={solarData} currentTime={currentTime} />
              </div>

              {/* Optimization Panel */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <OptimizationPanel solarData={solarData} />
              </div>
            </div>
          ) : null}
          {/* Timeline inside panel */}
          {timeline && (
            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200 dark:border-gray-700">
              <Timeline
                currentTime={timeline.currentTime}
                onTimeChange={timeline.onTimeChange}
                startTime={timeline.startTime || '05:00'}
                endTime={timeline.endTime || '20:00'}
                isPlaying={timeline.isPlaying}
                onPlayPause={timeline.onPlayPause}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
