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

  return <div />;
}
