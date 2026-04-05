'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MainContent from '@/components/layout/MainContent';
import StructuredData from '@/components/StructuredData';
import KakaoPayDonation from '@/components/KakaoPayDonation';
import { useI18n } from '@/lib/i18n-context';
import { calculateSolar, type SolarCalculationResponse } from '@/lib/api';

const isDevelopment = process.env.NODE_ENV === 'development';
const devLog = (...args: unknown[]) => { if (isDevelopment) console.log(...args); };

// ─── sessionStorage 캐시 ───────────────────────────────────────────
const CACHE_PREFIX = 'sunpath_v1_';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30분

function cacheKey(lat: number, lon: number, date: string, height: number) {
  return `${CACHE_PREFIX}${lat.toFixed(4)}_${lon.toFixed(4)}_${date}_${height}`;
}
function readCache(key: string): SolarCalculationResponse | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) { sessionStorage.removeItem(key); return null; }
    return data as SolarCalculationResponse;
  } catch { return null; }
}
function writeCache(key: string, data: SolarCalculationResponse) {
  try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch { /* ignore quota */ }
}

// ─── 타임라인 범위 계산 (일출/일몰 기반) ────────────────────────────
function timelineRange(solarData: SolarCalculationResponse | null): { start: string; end: string } {
  if (!solarData) return { start: '05:00', end: '20:00' };
  try {
    const sr = new Date(solarData.summary.sunrise);
    const ss = new Date(solarData.summary.sunset);
    const pad = (n: number) => String(n).padStart(2, '0');
    const startH = Math.max(0, sr.getHours() - 1);
    const endH   = Math.min(23, ss.getHours() + 1);
    return { start: `${pad(startH)}:00`, end: `${pad(endH)}:00` };
  } catch { return { start: '05:00', end: '20:00' }; }
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeInner />
    </Suspense>
  );
}

function HomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ─── 상태 초기화 (URL 파라미터 우선) ──────────────────────────────
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMs, setLoadingMs] = useState(0);   // 콜드스타트 경과 시간
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { t } = useI18n();

  // 모바일 감지
  useEffect(() => {
    const check = () => setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ─── URL 동기화 ────────────────────────────────────────────────────
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

  // ─── 데이터 페치 (캐시 우선) ──────────────────────────────────────
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSolarData = useCallback(async () => {
    if (!location) return;

    // 캐시 확인
    const key = cacheKey(location.lat, location.lon, date, objectHeight);
    const cached = readCache(key);
    if (cached) {
      setSolarData(cached);
      devLog('✅ Cache hit');
      return;
    }

    setIsLoading(true);
    setLoadingMs(0);
    setError(null);

    // 경과 시간 타이머 (콜드스타트 안내용)
    const startAt = Date.now();
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
      setSolarData(response);
      writeCache(key, response);
      devLog('✅ Fetched', response.series.length, 'points');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
      setIsLoading(false);
    }
  }, [location, date, objectHeight]);

  // 초기 마운트: URL 파라미터 없으면 서울 기본값
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current && !location) {
      setLocation({ lat: 37.5665, lon: 126.9780 });
    }
    isInitialMount.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 파라미터 변경 시 자동 계산
  useEffect(() => {
    if (location && date) fetchSolarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, date, objectHeight]);

  const handlePlayPause = useCallback(() => setIsPlaying(p => !p), []);
  const handleTimeChange = useCallback((time: string) => setCurrentTime(time), []);

  const { start: tlStart, end: tlEnd } = timelineRange(solarData);

  // ─── URL 복사 공유 ────────────────────────────────────────────────
  const [copyToast, setCopyToast] = useState(false);
  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <StructuredData />
      <Header
        onReset={() => {
          setLocation({ lat: 37.5665, lon: 126.9780 });
          setDate(new Date().toISOString().split('T')[0]);
          setObjectHeight(10);
          setCurrentTime('12:00');
          setIsPlaying(false);
          setSolarData(null);
        }}
        onToggleSidebar={() => setSidebarOpen(v => !v)}
      />

      {/* 콜드 스타트 안내 배너 */}
      {isLoading && loadingMs > 5000 && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 px-4 py-2 text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <span className="animate-spin text-base">⏳</span>
          <span>
            서버가 깨어나는 중입니다… ({Math.round(loadingMs / 1000)}초 경과, 최대 50초 소요될 수 있습니다)
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Mobile Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-xl">
              <Sidebar
                location={location}
                setLocation={(v) => { setLocation(v); setSidebarOpen(false); }}
                date={date}
                setDate={setDate}
                objectHeight={objectHeight}
                setObjectHeight={setObjectHeight}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
                solarData={solarData}
                timeline={{ currentTime, onTimeChange: handleTimeChange, isPlaying, onPlayPause: handlePlayPause, startTime: tlStart, endTime: tlEnd }}
              />
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            location={location}
            setLocation={setLocation}
            date={date}
            setDate={setDate}
            objectHeight={objectHeight}
            setObjectHeight={setObjectHeight}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            solarData={solarData}
            timeline={{ currentTime, onTimeChange: handleTimeChange, isPlaying, onPlayPause: handlePlayPause, startTime: tlStart, endTime: tlEnd }}
          />
        </div>

        <MainContent
          location={location}
          date={date}
          objectHeight={objectHeight}
          currentTime={currentTime}
          onLocationChange={setLocation}
          solarData={solarData}
          isLoading={isLoading}
          error={error}
          onRetry={fetchSolarData}
        />
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400 gap-4">
          <div className="flex items-center space-x-4 mb-2 md:mb-0">
            <span>{t('footer.copyright')}</span>
            <span className="hidden md:inline">•</span>
            <span>{t('footer.createdBy')}: <strong className="text-gray-800 dark:text-gray-200">boam79</strong></span>
          </div>
          <div className="flex items-center space-x-4 flex-wrap justify-center">
            {/* URL 공유 버튼 */}
            <button
              onClick={handleShare}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs hover:bg-blue-100 transition-colors"
            >
              <span>🔗</span>
              <span>{copyToast ? '복사됨!' : '현재 위치 공유'}</span>
            </button>
            <KakaoPayDonation
              isMobile={isMobile}
              className="flex flex-col md:flex-row items-center justify-center space-y-0.5 md:space-y-0 md:space-x-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg transition-colors shadow-sm text-sm font-medium cursor-pointer"
              variant="link"
            />
            <span className="hidden md:inline">•</span>
            <span>{t('footer.contact')}:</span>
            <a href="mailto:ckadltmfxhrxhrxhr@gmail.com" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
              ckadltmfxhrxhrxhr@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
