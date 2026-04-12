/** 공통 HTTP 클라이언트 (베이스 URL, 재시도) */

export const API_VERSION_PREFIX = '/api/v1';

const isDevelopment = process.env.NODE_ENV === 'development';

export const log = (...args: unknown[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

/** 매 요청 시 호출 — SSR 이후 클라이언트에서 프록시 경로가 올바르게 잡히도록 */
export function resolveApiBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  if (typeof window !== 'undefined') {
    try {
      const apiOrigin = new URL(apiUrl, window.location.href).origin;
      if (apiOrigin !== window.location.origin) {
        return '/api/backend';
      }
    } catch {
      if (window.location.protocol === 'https:' && apiUrl.startsWith('http://')) {
        return '/api/backend';
      }
    }
  }

  return apiUrl;
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
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

        if (response.status === 504) {
          return response;
        }

        if (response.status >= 400 && response.status < 500) {
          return response;
        }

        if (response.ok || attempt === maxRetries) {
          return response;
        }

        lastError = new Error(`Server error: ${response.status}`);
      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          lastError = new Error(
            `Request timeout: 요청이 ${TIMEOUT_MS / 1000}초 내에 완료되지 않았습니다.`
          );
          break;
        }

        lastError = fetchError instanceof Error ? fetchError : new Error('Network error');

        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Network error');

      if (attempt === maxRetries) {
        throw lastError;
      }
    }

    const delay = initialDelay * Math.pow(2, attempt);
    log(`⚠️ API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw lastError || new Error('Max retries exceeded');
}
