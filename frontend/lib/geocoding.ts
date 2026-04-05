/**
 * Geocoding utilities — 서버사이드 프록시(/api/geocode) 경유
 * 전 세계 주소 검색 지원, Nominatim IP 차단 위험 없음
 */

export interface GeocodeResult {
  lat: number;
  lon: number;
  display_name: string;
  address?: {
    city?: string;
    country?: string;
    state?: string;
    road?: string;
    house_number?: string;
    town?: string;
    county?: string;
  };
}

function formatDisplay(item: {
  display_name: string;
  address?: Record<string, string>;
  namedetails?: Record<string, string>;
}): string {
  const road  = item.address?.road || item.namedetails?.name || '';
  const house = item.address?.house_number ? ` ${item.address.house_number}` : '';
  const city  = item.address?.city || item.address?.town || item.address?.county || '';
  const state = item.address?.state || '';
  return road ? `${road}${house}, ${city} ${state}`.trim() : item.display_name;
}

export async function searchAddress(query: string): Promise<GeocodeResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const params = new URLSearchParams({ q: query.trim(), type: 'search' });
    const res = await fetch(`/api/geocode?${params}`);
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: {
      lat: string; lon: string; display_name: string;
      address?: Record<string, string>; namedetails?: Record<string, string>;
    }) => ({
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      display_name: formatDisplay(item),
      address: item.address,
    }));
  } catch {
    return [];
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({ lat: String(lat), lon: String(lon), type: 'reverse' });
    const res = await fetch(`/api/geocode?${params}`);
    if (!res.ok) return null;

    const data = await res.json();
    return formatDisplay(data) || data.display_name || null;
  } catch {
    return null;
  }
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
