/**
 * API client for SunPath & Shadow Simulator backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Vercel 환경 감지 (preview/production 또는 VERCEL 환경변수 존재 여부)
const isVercelEnv = !!(
  process.env.VERCEL ||
  process.env.VERCEL_ENV === 'preview' ||
  process.env.VERCEL_ENV === 'production'
);

export interface SolarCalculationRequest {
  location: {
    lat: number;
    lon: number;
    altitude?: number;
    timezone?: string;
  };
  datetime: {
    date: string;
    start_time?: string;
    end_time?: string;
    interval?: number;
  };
  object?: {
    height: number;
    tilt?: number;
    azimuth?: number;
  };
  options?: {
    atmosphere?: boolean;
    precision?: 'low' | 'medium' | 'high';
    include_weather?: boolean;
  };
}

export interface SunPosition {
  altitude: number;
  azimuth: number;
  zenith: number;
  hour_angle: number;
}

export interface Irradiance {
  ghi: number;
  dni: number;
  dhi: number;
  par?: number;
}

export interface Shadow {
  length?: number | null;
  direction?: number | null;
  coordinates?: number[][] | null;
}

export interface SolarDataPoint {
  timestamp: string;
  sun: SunPosition;
  irradiance: Irradiance | null;
  shadow: Shadow | null;
}

export interface SolarSummary {
  sunrise: string;
  sunset: string;
  solar_noon: string;
  day_length: number;
  max_altitude: number;
  total_irradiance: number | null;
}

export interface SolarCalculationResponse {
  metadata: {
    request_id: string;
    timestamp: string;
    version: string;
    accuracy: {
      position: number;
      irradiance: number;
    };
  };
  summary: SolarSummary;
  series: SolarDataPoint[];
}

/**
 * Calculate solar positions, irradiance, and shadows
 */
export async function calculateSolar(
  request: SolarCalculationRequest
): Promise<SolarCalculationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/integrated/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      const errorMessage = typeof error.detail === 'string'
        ? error.detail
        : error.message || error.detail?.message || 'API request failed';
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Calculate solar error:', error);
    
    // Vercel 환경에서 백엔드 API URL이 없거나 연결 실패 시 더미 데이터 반환
    if (isVercelEnv && (!process.env.NEXT_PUBLIC_API_URL || API_BASE_URL === 'http://localhost:8000')) {
      console.warn('⚠️ Backend API not available, returning demo data');
      return generateDemoData(request);
    }
    
    throw error;
  }
}

// 더미 데이터 생성 함수
function generateDemoData(request: SolarCalculationRequest): SolarCalculationResponse {
  const { location, datetime, object } = request;
  const date = new Date(datetime.date);
  const startTime = datetime.start_time || '05:00';
  const endTime = datetime.end_time || '20:00';
  const interval = datetime.interval || 60;
  
  const series: SolarDataPoint[] = [];
  const startHour = parseInt(startTime.split(':')[0]);
  const endHour = parseInt(endTime.split(':')[0]);
  
  for (let hour = startHour; hour <= endHour; hour++) {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    const timestamp = new Date(date);
    timestamp.setHours(hour, 0, 0, 0);
    
    // 간단한 태양 위치 계산 (정확하지 않음)
    const hourAngle = (hour - 12) * 15; // 시간각
    const altitude = Math.max(0, 90 - Math.abs(hourAngle) * 0.5); // 고도
    // 방위각 계산 (0°=북, 180°=남) 및 0~360 정규화
    let azimuth = 180 + hourAngle;
    azimuth = ((azimuth % 360) + 360) % 360;
    
    series.push({
      timestamp: timestamp.toISOString(),
      sun: {
        altitude: altitude,
        azimuth: azimuth,
        zenith: 90 - altitude,
        hour_angle: hourAngle
      },
      irradiance: {
        ghi: altitude > 0 ? altitude * 10 : 0,
        dni: altitude > 0 ? altitude * 8 : 0,
        dhi: altitude > 0 ? altitude * 2 : 0,
        par: altitude > 0 ? altitude * 5 : 0
      },
      shadow: altitude > 0 && object ? {
        length: object.height / Math.tan(altitude * Math.PI / 180),
        direction: azimuth,
        coordinates: null
      } : null
    });
  }
  
  return {
    metadata: {
      request_id: 'demo-' + Date.now(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      accuracy: {
        position: 0.1,
        irradiance: 0.2
      }
    },
    summary: {
      sunrise: '06:00',
      sunset: '18:00',
      solar_noon: '12:00',
      day_length: 12,
      max_altitude: 60,
      total_irradiance: 1000
    },
    series: series
  };
}

/**
 * Get sunrise and sunset times
 */
export async function getSunriseSunset(
  lat: number,
  lon: number,
  date: string
): Promise<{ sunrise: string; sunset: string; [key: string]: unknown }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/solar/sunrise-sunset?lat=${lat}&lon=${lon}&date=${date}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch sunrise/sunset');
    }

    return await response.json();
  } catch (error) {
    console.error('Sunrise/sunset error:', error);
    throw error;
  }
}

/**
 * Calculate shadow for a specific time
 */
export async function calculateShadow(
  lat: number,
  lon: number,
  date: string,
  time: string,
  object_height: number
): Promise<Shadow> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/shadow/calculate?lat=${lat}&lon=${lon}&date=${date}&time=${time}&object_height=${object_height}`
    );

    if (!response.ok) {
      throw new Error('Failed to calculate shadow');
    }

    return await response.json();
  } catch (error) {
    console.error('Shadow calculation error:', error);
    throw error;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{ [key: string]: unknown } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cache/stats`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch cache stats');
    }

    return await response.json();
  } catch (error) {
    console.error('Cache stats error:', error);
    return null;
  }
}

/**
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}
