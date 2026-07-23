'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { calculateSolar, type SolarCalculationResponse } from '@/lib/api';
import { cacheKey, readCache, writeCache, timelineRange } from '@/lib/solar-page-cache';

const isDevelopment = process.env.NODE_ENV === 'development';
const devLog = (...args: unknown[]) => {
  if (isDevelopment) console.log(...args);
};

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
  const [currentTime, setCurrentTime] = useState<string>('12:00');
  const [isPlaying, setIsPlaying] = useState(false);

  const [solarData, setSolarData] = useState<SolarCalculationResponse | null>(null);
  const [solarDataB, setSolarDataB] = useState<SolarCalculationResponse | null>(null);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareHeight, setCompareHeight] = useState(5);
  const [lastSavedHint, setLastSavedHint] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMs, setLoadingMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  /** null = 아직 미측정(SSR/첫 페인트). false로 시작하면 모바일에서 PC Sidebar가 잠깐 마운트됨 */
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
    return () => {
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (savedHintTimerRef.current) clearTimeout(savedHintTimerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const fetchSolarData = useCallback(async () => {
    if (!location) return;

    const key = cacheKey(location.lat, location.lon, date, objectHeight);
    const cached = readCache(key);
    if (cached) {
      setSolarData(cached);
      setError(null);
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
      const response = await calculateSolar({
        location: { lat: location.lat, lon: location.lon, altitude: 0 },
        datetime: { date, start_time: '00:00', end_time: '23:59', interval: 60 },
        object: { height: objectHeight },
        options: { atmosphere: true, precision: 'high' },
      });
      if (gen !== fetchGenRef.current || ac.signal.aborted) return;
      setSolarData(response);
      writeCache(key, response);
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
  }, [location, date, objectHeight]);

  useEffect(() => {
    if (!compareEnabled || !location) {
      setSolarDataB(null);
      return;
    }
    let cancelled = false;
    const ac = new AbortController();
    (async () => {
      try {
        const r = await calculateSolar({
          location: { lat: location.lat, lon: location.lon, altitude: 0 },
          datetime: { date, start_time: '00:00', end_time: '23:59', interval: 60 },
          object: { height: compareHeight },
          options: { atmosphere: true, precision: 'high' },
        });
        if (!cancelled && !ac.signal.aborted) setSolarDataB(r);
      } catch {
        if (!cancelled) setSolarDataB(null);
      }
    })();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [compareEnabled, compareHeight, location, date]);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current && !location) {
      setLocation({ lat: 37.5665, lon: 126.9780 });
    }
    isInitialMount.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (location && date) fetchSolarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, date, objectHeight]);

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
        /* insecure context / permission */
      });
  }, []);

  const handleHeaderReset = useCallback(() => {
    setLocation({ lat: 37.5665, lon: 126.9780 });
    setDate(new Date().toISOString().split('T')[0]);
    setObjectHeight(10);
    setCurrentTime('12:00');
    setIsPlaying(false);
    setSolarData(null);
    setSolarDataB(null);
    setCompareEnabled(false);
    setError(null);
  }, []);

  return {
    location,
    setLocation,
    date,
    setDate,
    objectHeight,
    setObjectHeight,
    currentTime,
    setCurrentTime,
    isPlaying,
    solarData,
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
