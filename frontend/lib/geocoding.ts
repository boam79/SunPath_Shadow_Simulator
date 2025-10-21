/**
 * Geocoding utilities using Nominatim API
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

export interface GeocodeResult {
  lat: number;
  lon: number;
  display_name: string;
  address?: {
    city?: string;
    country?: string;
    state?: string;
  };
}

/**
 * Search address using Nominatim geocoding API
 * @param query Address query string
 * @returns Array of geocode results
 */
export async function searchAddress(query: string): Promise<GeocodeResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'jsonv2',
      addressdetails: '1',
      namedetails: '1',
      'accept-language': 'ko,en',
      countrycodes: 'kr',
      limit: '5'
    });
    const response = await fetch(`${NOMINATIM_URL}/search?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.map((item: { lat: string; lon: string; display_name: string; address?: Record<string, string>; namedetails?: Record<string, string> }) => {
      const road = item?.address?.road || item?.namedetails?.name || '';
      const house = item?.address?.house_number ? ` ${item.address.house_number}` : '';
      const city = item?.address?.city || item?.address?.town || item?.address?.county || '';
      const state = item?.address?.state || '';
      const display = road ? `${road}${house}, ${city} ${state}`.trim() : item.display_name;
      return {
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        display_name: display,
        address: item.address
      };
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
}

/**
 * Reverse geocode coordinates to address
 * @param lat Latitude
 * @param lon Longitude
 * @returns Address information
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      format: 'jsonv2',
      addressdetails: '1',
      namedetails: '1',
      zoom: '18',
      'accept-language': 'ko,en'
    });
    const response = await fetch(`${NOMINATIM_URL}/reverse?${params.toString()}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const road = data?.address?.road || data?.namedetails?.name || '';
    const house = data?.address?.house_number ? ` ${data.address.house_number}` : '';
    const city = data?.address?.city || data?.address?.town || data?.address?.county || '';
    const state = data?.address?.state || '';
    const display = road ? `${road}${house}, ${city} ${state}`.trim() : data.display_name || null;
    return display;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
