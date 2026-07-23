'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { calculateSolar, type SolarCalculationResponse } from '@/lib/api';
import { cacheKey, readCache, writeCache, timelineRange } from '@/lib/solar-page-cache';
import { fetchWeather } from '@/lib/weather';
import { mergeWeatherIntoSeries, type SeriesWithWeather } from '@/lib/weather-merge';

const isDevelopment = process.env.NODE_ENV === 'development';
const devLog = (...args: unknown[]) => {
  if (isDevelopment) console.log(...args);
};

async function fetchSiteAltitude(lat: number, lon: number): Promise<number> {
  try {
    const res = await fetch(`/api/elevation?lat=${lat}&lon=${lon}`);
    if (!res.ok) return 0;
    const data = (await res.json()) as { elevation?: number };
    return typeof data.elevation === 'number' && Number.isFinite(data.elevation)
      ? data.elevation
      : 0;
  } catch {
    return 0;
  }
}

export function useSolarPageState() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(() => {
    const lat = parseFloat(searchParams.get('lat') ?? '');
    const lon = parseFloat(searchParams.get('lon') ?? '');
    if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
    return null;
  });
  const [date, setDate] = useState<string>(
    searchParams.get('date') ?? new Date().toISOString().split('T')[0]
  );
  const [objectHeight, setObjectHeight] = useState<number>(
    parseFloat(searchParams.get('height') ?? '10') || 10
  );
  const [siteAltitude, setSiteAltitude] = useState(0);
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const [skyModel, setSkyModel] = useState<'isotropic' | 'perez' | 'klucher'>('isotropic');
  const [panelTilt, setPanelTilt] = useState(0);
  const [panelAzimuth, setPanelAzimuth] = useState(180);

  const [currentTime, setCurrentTime] = useState<string>('12:00');
  const [isPlaying, setIsPlaying] = useState(false);

  const [solarData, setSolarData] = useState<SolarCalculationResponse | null>(null);
  const [seriesWithWeather, setSeriesWithWeather] = useState<SeriesWithWeather[] | null>(null);
  const [solarDataB, setSolarDataB] = useState<SolarCalculationResponse | null>(null);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareHeight, setCompareHeight] = useState(5);
  const [lastSavedHint, setLastSavedHint] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMs, setLoadingMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [copyToast, setCopyToast] = useState(false);

  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchGenRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const check = () =>
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!location) return;
    const params = new URLSearchParams({
      lat: location.lat.toFixed(6),
      lon: location.lon.toFixed(6),
      date,
      height: String(objectHeight),
    });
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [location, date, objectHeight, router]);

  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    fetchSiteAltitude(location.lat, location.lon).then((alt) => {
      if (!cancelled) setSiteAltitude(alt);
    });
    return () => {
      cancelled = true;
    };
  }, [location]);

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (savedHintTimerRef.current) clearTimeout(savedHintTimerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const buildRequest = useCallback(
    (height: number) => {
      if (!location) return null;
      const object: {
        height: number;
        tilt?: number;
        azimuth?: number;
      } = { height };
      if (panelTilt > 0) {
        object.tilt = panelTilt;
        object.azimuth = panelAzimuth;
      }
      return {
        location: {
          lat: location.lat,
          lon: location.lon,
          altitude: siteAltitude,
        },
        datetime: {
          date,
          start_time: '00:00',
          end_time: '23:59',
          interval: intervalMinutes,
        },
        object,
        options: {
          atmosphere: true,
          precision: 'high' as const,
          sky_model: skyModel,
        },
      };
    },
    [location, date, siteAltitude, intervalMinutes, panelTilt, panelAzimuth, skyModel]
  );

  const fetchSolarData = useCallback(async () => {
    if (!location) return;
    const req = buildRequest(objectHeight);
    if (!req) return;

    const extra = `${intervalMinutes}_${skyModel}_${panelTilt}_${panelAzimuth}_${siteAltitude.toFixed(0)}`;
    const key = cacheKey(location.lat, location.lon, date, objectHeight, extra);
    const cached = readCache(key);
    if (cached) {
      setSolarData(cached);
      setError(null);
      const weather = await fetchWeather(location.lat, location.lon, date);
      setSeriesWithWeather(mergeWeatherIntoSeries(cached, weather));
      devLog('✅ Cache hit');
      return;
    }

    const gen = ++fetchGenRef.current;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setIsLoading(true);
    setLoadingMs(0);
    setError(null);

    const startAt = Date.now();
    if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    loadingTimerRef.current = setInterval(() => {
      setLoadingMs(Date.now() - startAt);
    }, 500);

    try {
      const response = await calculateSolar(req);
      if (gen !== fetchGenRef.current || ac.signal.aborted) return;
      setSolarData(response);
      writeCache(key, response);
      const weather = await fetchWeather(location.lat, location.lon, date);
      if (gen !== fetchGenRef.current || ac.signal.aborted) return;
      setSeriesWithWeather(mergeWeatherIntoSeries(response, weather));
      try {
        localStorage.setItem(
          'sunpath_last_summary_v1',
          JSON.stringify({
            savedAt: Date.now(),
            lat: location.lat,
            lon: location.lon,
            date,
            height: objectHeight,
            sunrise: response.summary.sunrise,
            sunset: response.summary.sunset,
            dayLenHours: response.summary.day_length,
            totalIrradiance: response.summary.total_irradiance,
          })
        );
        setLastSavedHint(true);
        if (savedHintTimerRef.current) clearTimeout(savedHintTimerRef.current);
        savedHintTimerRef.current = setTimeout(() => setLastSavedHint(false), 6000);
      } catch {
        /* storage full */
      }
      devLog('✅ Fetched', response.series.length, 'points');
    } catch (err) {
      if (gen !== fetchGenRef.current || ac.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      if (gen === fetchGenRef.current) {
        if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
        setIsLoading(false);
      }
    }
  }, [location, date, objectHeight, buildRequest, intervalMinutes, skyModel, panelTilt, panelAzimuth, siteAltitude]);

  useEffect(() => {
    if (!compareEnabled || !location) {
      setSolarDataB(null);
      return;
    }
    let cancelled = false;
    const req = buildRequest(compareHeight);
    if (!req) return;
    (async () => {
      try {
        const r = await calculateSolar(req);
        if (!cancelled) setSolarDataB(r);
      } catch {
        if (!cancelled) setSolarDataB(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [compareEnabled, compareHeight, buildRequest, location]);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current && !location) {
      setLocation({ lat: 37.5665, lon: 126.978 });
    }
    isInitialMount.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (location && date) fetchSolarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, date, objectHeight, intervalMinutes, skyModel, panelTilt, panelAzimuth, siteAltitude]);

  const handlePlayPause = useCallback(() => setIsPlaying((p) => !p), []);
  const handleTimeChange = useCallback((time: string) => setCurrentTime(time), []);

  const { start: tlStart, end: tlEnd } = timelineRange(solarData);

  const handleShare = useCallback(() => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopyToast(true);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setCopyToast(false), 2000);
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  const handleHeaderReset = useCallback(() => {
    setLocation({ lat: 37.5665, lon: 126.978 });
    setDate(new Date().toISOString().split('T')[0]);
    setObjectHeight(10);
    setCurrentTime('12:00');
    setIsPlaying(false);
    setSolarData(null);
    setSeriesWithWeather(null);
    setSolarDataB(null);
    setCompareEnabled(false);
    setPanelTilt(0);
    setError(null);
  }, []);

  return {
    location,
    setLocation,
    date,
    setDate,
    objectHeight,
    setObjectHeight,
    siteAltitude,
    intervalMinutes,
    setIntervalMinutes,
    skyModel,
    setSkyModel,
    panelTilt,
    setPanelTilt,
    panelAzimuth,
    setPanelAzimuth,
    currentTime,
    setCurrentTime,
    isPlaying,
    solarData,
    seriesWithWeather,
    solarDataB,
    compareEnabled,
    setCompareEnabled,
    compareHeight,
    setCompareHeight,
    lastSavedHint,
    isLoading,
    loadingMs,
    error,
    isMobile,
    copyToast,
    fetchSolarData,
    handlePlayPause,
    handleTimeChange,
    tlStart,
    tlEnd,
    handleShare,
    handleHeaderReset,
  };
}
