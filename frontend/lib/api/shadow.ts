import { fetchWithRetry, resolveApiBaseUrl, API_VERSION_PREFIX } from './client';
import type { Shadow } from './types';

const isDevelopment = process.env.NODE_ENV === 'development';

export async function calculateShadow(
  lat: number,
  lon: number,
  date: string,
  time: string,
  object_height: number
): Promise<Shadow> {
  const base = resolveApiBaseUrl();
  try {
    const response = await fetchWithRetry(
      `${base}${API_VERSION_PREFIX}/shadow/calculate?lat=${lat}&lon=${lon}&date=${date}&time=${time}&object_height=${object_height}`
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
