'use client';

import { useEffect, useState } from 'react';
import { Cloud, Droplets } from 'lucide-react';
import { fetchWeather, closestHourIndex, type WeatherData } from '@/lib/weather';

interface WeatherStripProps {
  lat: number;
  lon: number;
  date: string;
  currentTime: string;
  labels: { title: string; avgCloud: string; atTime: string; precip: string };
}

export default function WeatherStrip({ lat, lon, date, currentTime, labels }: WeatherStripProps) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr(false);
      const w = await fetchWeather(lat, lon, date);
      if (!cancelled) {
        if (w) setData(w);
        else setErr(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lat, lon, date]);

  if (err || !data?.hourly?.cloudcover?.length) {
    return null;
  }

  const idx = closestHourIndex(data.hourly.time, currentTime);
  const cc = data.hourly.cloudcover[idx] ?? 0;
  const pr = data.hourly.precipitation_probability[idx] ?? 0;
  const avgCloud =
    data.hourly.cloudcover.reduce((a, b) => a + b, 0) / data.hourly.cloudcover.length;

  return (
    <div
      className="rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 px-3 py-2 text-xs text-sky-900 dark:text-sky-100"
      role="region"
      aria-label={labels.title}
    >
      <div className="font-semibold mb-1 flex items-center gap-1">
        <Cloud className="w-3.5 h-3.5" aria-hidden />
        {labels.title}
      </div>
      <div className="flex flex-wrap gap-3 text-sky-800 dark:text-sky-200">
        <span>
          {labels.avgCloud}: {avgCloud.toFixed(0)}%
        </span>
        <span>
          {labels.atTime}: {cc.toFixed(0)}%
        </span>
        <span className="inline-flex items-center gap-0.5">
          <Droplets className="w-3.5 h-3.5" aria-hidden />
          {labels.precip}: {pr}%
        </span>
      </div>
    </div>
  );
}
