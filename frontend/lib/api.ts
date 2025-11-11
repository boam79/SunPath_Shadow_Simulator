/**
 * API client for SunPath & Shadow Simulator backend
 */

// Development mode check
const isDevelopment = process.env.NODE_ENV === 'development';

// 개발 모드에서만 로그 출력
const log = (...args: unknown[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

// API URL 설정
// Vercel 환경에서 HTTP 백엔드를 사용하는 경우 프록시를 통해 요청하여 Mixed Content 문제 해결
const getApiBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  // 브라우저에서 실행 중인 경우
  if (typeof window !== 'undefined') {
    // Vercel 환경 확인 (hostname 기반)
    const isVercel = window.location.hostname.includes('vercel.app') || 
                     window.location.hostname.includes('vercel.dev');
    
    // HTTPS 페이지에서 HTTP 백엔드로 요청하는 경우 프록시 사용
    if (window.location.protocol === 'https:' && apiUrl.startsWith('http://')) {
      // Mixed Content 문제를 해결하기 위해 Next.js API Route 프록시 사용
      return '/api/proxy';
    }
  }
  
  return apiUrl;
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Fetch with automatic retry using exponential backoff
 * Retries on network errors or 5xx server errors (but not 504 timeout)
 * Does not retry on 4xx client errors or 504 timeout errors
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
      // 타임아웃 설정 (65초 - 프록시보다 약간 길게)
      const TIMEOUT_MS = 65000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      
      const fetchOptions = {
        ...options,
        signal: controller.signal,
      };
      
      try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        
        // 504 Gateway Timeout은 재시도하지 않음 (백엔드 문제)
        if (response.status === 504) {
          return response;
        }
        
        // Don't retry on 4xx client errors (bad request)
        if (response.status >= 400 && response.status < 500) {
          return response;
        }
        
        // Retry on 5xx server errors (except 504) or network errors
        if (response.ok || attempt === maxRetries) {
          return response;
        }
        
        // If we get here, it's a 5xx error and we should retry
        lastError = new Error(`Server error: ${response.status}`);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // 타임아웃 에러는 재시도하지 않음
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          lastError = new Error(`Request timeout: 요청이 ${TIMEOUT_MS / 1000}초 내에 완료되지 않았습니다.`);
          break; // 타임아웃은 재시도하지 않음
        }
        
        lastError = fetchError instanceof Error ? fetchError : new Error('Network error');
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          throw lastError;
        }
      }
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
    log(`⚠️ API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
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
      let errorMessage = 'API request failed';
      try {
        const error = await response.json();
        // 프록시에서 반환한 에러 메시지 우선 사용
        errorMessage = error.message || 
          (typeof error.detail === 'string' ? error.detail : error.detail?.message) ||
          `Server returned status ${response.status}`;
      } catch {
        // JSON 파싱 실패 시 상태 코드 기반 메시지
        if (response.status === 504) {
          errorMessage = '요청이 타임아웃되었습니다. 백엔드 서버 응답이 너무 오래 걸립니다.';
        } else if (response.status >= 500) {
          errorMessage = '백엔드 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        } else if (response.status === 404) {
          errorMessage = '요청한 리소스를 찾을 수 없습니다.';
        } else {
          errorMessage = `서버 오류 (${response.status})`;
        }
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    // 프로덕션에서도 에러 로그는 유지 (디버깅 필요)
    if (isDevelopment) {
      console.error('Calculate solar error:', error);
    }
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
    if (isDevelopment) {
      console.error('Sunrise/sunset error:', error);
    }
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
    if (isDevelopment) {
      console.error('Shadow calculation error:', error);
    }
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
    if (isDevelopment) {
      console.error('Cache stats error:', error);
    }
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
    if (isDevelopment) {
      console.error('Health check failed:', error);
    }
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
    if (isDevelopment) {
      console.error('Optimization error:', error);
    }
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
    if (isDevelopment) {
      console.error('Batch calculation error:', error);
    }
    throw error;
  }
}
