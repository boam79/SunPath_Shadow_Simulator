/**
 * Open-Meteo 기상 데이터 클라이언트
 */
export interface WeatherHourly {
  time: string[];
  cloudcover: number[];
  shortwave_radiation: number[];
  precipitation_probability: number[];
}

export interface WeatherData {
  hourly: WeatherHourly;
  daily: { sunrise: string[]; sunset: string[] };
  unavailable?: boolean;
}

export async function fetchWeather(lat: number, lon: number, date: string): Promise<WeatherData | null> {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      date,
    });
    const res = await fetch(`/api/weather?${params}`);
    if (!res.ok) return null;
    const data = (await res.json()) as WeatherData;
    // 예보 범위 밖 등 soft-empty 응답은 UI에서 숨김 (콘솔 502 대신 200)
    if (data.unavailable || !data.hourly?.cloudcover?.length) return null;
    return data;
  } catch {
    return null;
  }
}

/** 시각(HH:MM)에 가장 가까운 시간별 날씨 인덱스 반환 */
export function closestHourIndex(hourlyTimes: string[], targetTime: string): number {
  const [th, tm] = targetTime.split(':').map(Number);
  const targetMin = th * 60 + (tm ?? 0);
  let best = 0, bestDiff = Infinity;
  hourlyTimes.forEach((t, i) => {
    const dt = new Date(t);
    const diff = Math.abs(dt.getHours() * 60 + dt.getMinutes() - targetMin);
    if (diff < bestDiff) { bestDiff = diff; best = i; }
  });
  return best;
}
