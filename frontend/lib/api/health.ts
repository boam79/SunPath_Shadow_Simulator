import { fetchWithRetry, resolveApiBaseUrl } from './client';

const isDevelopment = process.env.NODE_ENV === 'development';

export async function healthCheck(): Promise<boolean> {
  const base = resolveApiBaseUrl();
  try {
    const response = await fetchWithRetry(`${base}/health`, {}, 1, 500);
    return response.ok;
  } catch (error) {
    if (isDevelopment) {
      console.error('Health check failed:', error);
    }
    return false;
  }
}
