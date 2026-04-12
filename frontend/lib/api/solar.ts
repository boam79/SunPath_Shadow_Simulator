import { fetchWithRetry, resolveApiBaseUrl, API_VERSION_PREFIX } from './client';

const isDevelopment = process.env.NODE_ENV === 'development';

export async function getSunriseSunset(
  lat: number,
  lon: number,
  date: string
): Promise<{ sunrise: string; sunset: string; [key: string]: unknown }> {
  const base = resolveApiBaseUrl();
  try {
    const response = await fetchWithRetry(
      `${base}${API_VERSION_PREFIX}/solar/sunrise-sunset?lat=${lat}&lon=${lon}&date=${date}`
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
