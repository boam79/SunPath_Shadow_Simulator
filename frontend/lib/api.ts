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
void isVercelEnv; // currently not used but kept for future behavior toggles

/**
 * Fetch with automatic retry using exponential backoff
 * Retries on network errors or 5xx server errors (Render cold start)
 * Does not retry on 4xx client errors
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Don't retry on 4xx client errors (bad request)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }
      
      // Retry on 5xx server errors or network errors
      if (response.ok || attempt === maxRetries) {
        return response;
      }
      
      // If we get here, it's a 5xx error and we should retry
      lastError = new Error(`Server error: ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Network error');
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }
    }
    
    // Exponential backoff: wait before retrying
    // Delay: 1s, 2s, 4s for attempts 0, 1, 2
    const delay = initialDelay * Math.pow(2, attempt);
    console.log(`⚠️ API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Max retries exceeded');
}

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

// Batch calculation interfaces
export interface BatchCalculationRequest {
  requests: SolarCalculationRequest[];
  parallel?: boolean;
}

export interface BatchCalculationResponseItem {
  index: number;
  success: boolean;
  result?: SolarCalculationResponse;
  error?: string;
}

export interface BatchCalculationResponse {
  total_requests: number;
  successful: number;
  failed: number;
  processing_time_ms: number;
  results: BatchCalculationResponseItem[];
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
    const response = await fetchWithRetry(`${API_BASE_URL}/api/integrated/calculate`, {
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
    // 더미 데이터 사용 금지: 실제 백엔드 연결 실패 시 오류를 그대로 전달
    throw error instanceof Error ? error : new Error('Backend API request failed');
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
    const response = await fetchWithRetry(
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
    const response = await fetchWithRetry(
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
    const response = await fetchWithRetry(`${API_BASE_URL}/api/cache/stats`);
    
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
    // Health check doesn't need retries as it's used for keep-alive
    const response = await fetchWithRetry(`${API_BASE_URL}/health`, {}, 1, 500);
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

export interface OptimizationResult {
  status: string;
  optimization: {
    max_irradiance_period: {
      time: string;
      ghi: number;
      altitude: number;
    } | null;
    max_altitude_period: {
      time: string;
      altitude: number;
      ghi: number;
    } | null;
    min_shadow_period: {
      time: string;
      shadow_length: number;
      ghi: number;
    } | null;
    optimal_solar_collection_periods: Array<{
      start: string;
      end: string;
      average_ghi: number;
      duration_hours: number;
    }>;
    shadow_interference_periods: Array<{
      start: string;
      end: string;
      average_ghi: number;
      duration_hours: number;
    }>;
  };
}

/**
 * Analyze solar data to find optimal time periods
 */
export async function optimizePeriods(
  solarData: SolarCalculationResponse
): Promise<OptimizationResult> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/integrated/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(solarData),
    });

    if (!response.ok) {
      const error = await response.json();
      const errorMessage = typeof error.detail === 'string'
        ? error.detail
        : error.message || error.detail?.message || 'Optimization failed';
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Optimization error:', error);
    throw error;
  }
}

/**
 * Batch calculation: process multiple scenarios in a single request
 */
export async function calculateBatch(
  requests: SolarCalculationRequest[],
  parallel: boolean = true
): Promise<BatchCalculationResponse> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/integrated/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests,
        parallel
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      const errorMessage = typeof error.detail === 'string'
        ? error.detail
        : error.message || error.detail?.message || 'Batch calculation failed';
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Batch calculation error:', error);
    throw error;
  }
}
