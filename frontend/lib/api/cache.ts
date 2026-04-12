import { fetchWithRetry, resolveApiBaseUrl, API_VERSION_PREFIX } from './client';

const isDevelopment = process.env.NODE_ENV === 'development';

export async function getCacheStats(): Promise<{ [key: string]: unknown } | null> {
  const base = resolveApiBaseUrl();
  try {
    const response = await fetchWithRetry(`${base}${API_VERSION_PREFIX}/cache/stats`);

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
