import type { SolarCalculationResponse, SolarDataPoint } from '@/lib/api';
import type { WeatherData } from '@/lib/weather';
import { closestHourIndex } from '@/lib/weather';
import { wallClockHm } from '@/lib/time-wallclock';

export type SeriesWithWeather = SolarDataPoint & {
  weatherGhi?: number | null;
  cloudcover?: number | null;
};

/** Attach Open-Meteo shortwave to each series point (client-side fusion). */
export function mergeWeatherIntoSeries(
  solar: SolarCalculationResponse,
  weather: WeatherData | null
): SeriesWithWeather[] {
  if (!weather?.hourly?.time?.length) {
    return solar.series.map((p) => ({ ...p }));
  }
  const { time, shortwave_radiation, cloudcover } = weather.hourly;
  return solar.series.map((p) => {
    const hm = wallClockHm(p.timestamp);
    const idx = closestHourIndex(time, hm);
    return {
      ...p,
      weatherGhi:
        typeof shortwave_radiation?.[idx] === 'number' ? shortwave_radiation[idx] : null,
      cloudcover: typeof cloudcover?.[idx] === 'number' ? cloudcover[idx] : null,
    };
  });
}
