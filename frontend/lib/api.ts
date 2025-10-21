/**
 * API client for SunPath & Shadow Simulator backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
      throw new Error(error.detail || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Calculate solar error:', error);
    throw error;
  }
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
export async function getCacheStats(): Promise<{ [key: string]: unknown }> {
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
