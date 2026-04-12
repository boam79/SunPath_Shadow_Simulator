import { fetchWithRetry, resolveApiBaseUrl, API_VERSION_PREFIX } from './client';
import type {
  SolarCalculationRequest,
  SolarCalculationResponse,
  BatchCalculationResponse,
  OptimizationResult,
} from './types';

const isDevelopment = process.env.NODE_ENV === 'development';

export async function calculateSolar(
  request: SolarCalculationRequest
): Promise<SolarCalculationResponse> {
  const base = resolveApiBaseUrl();
  try {
    const response = await fetchWithRetry(
      `${base}${API_VERSION_PREFIX}/integrated/calculate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      let errorMessage = 'API request failed';
      try {
        const error = await response.json();
        errorMessage =
          error.message ||
          (typeof error.detail === 'string' ? error.detail : error.detail?.message) ||
          `Server returned status ${response.status}`;
      } catch {
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
    if (isDevelopment) {
      console.error('Calculate solar error:', error);
    }
    throw error instanceof Error ? error : new Error('Backend API request failed');
  }
}

export async function optimizePeriods(
  solarData: SolarCalculationResponse
): Promise<OptimizationResult> {
  const base = resolveApiBaseUrl();
  try {
    const response = await fetchWithRetry(`${base}${API_VERSION_PREFIX}/integrated/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(solarData),
    });

    if (!response.ok) {
      const error = await response.json();
      const errorMessage =
        typeof error.detail === 'string'
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

export async function calculateBatch(
  requests: SolarCalculationRequest[],
  parallel: boolean = true
): Promise<BatchCalculationResponse> {
  const base = resolveApiBaseUrl();
  try {
    const response = await fetchWithRetry(`${base}${API_VERSION_PREFIX}/integrated/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests, parallel }),
    });

    if (!response.ok) {
      const error = await response.json();
      const errorMessage =
        typeof error.detail === 'string'
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
