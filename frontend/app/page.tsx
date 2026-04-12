'use client';

import { Suspense } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MainContent from '@/components/layout/MainContent';
import StructuredData from '@/components/StructuredData';
import KakaoPayDonation from '@/components/KakaoPayDonation';
import { useI18n } from '@/lib/i18n-context';
import { useSolarPageState } from '@/lib/hooks/useSolarPageState';

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeInner />
    </Suspense>
  );
}

function HomeInner() {
  const { t } = useI18n();
  const {
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
    sidebarOpen,
    setSidebarOpen,
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
  } = useSolarPageState();

  const timelineProps = {
    currentTime,
    onTimeChange: handleTimeChange,
    isPlaying,
    onPlayPause: handlePlayPause,
    startTime: tlStart,
    endTime: tlEnd,
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <StructuredData />
      <Header
        onReset={handleHeaderReset}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      {isLoading && loadingMs > 5000 && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 px-4 py-2 text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <span className="animate-spin text-base">⏳</span>
          <span>
            서버가 깨어나는 중입니다… ({Math.round(loadingMs / 1000)}초 경과, 최대 50초 소요될 수 있습니다)
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-xl">
              <Sidebar
                location={location}
                setLocation={(v) => {
                  setLocation(v);
                  setSidebarOpen(false);
                }}
                date={date}
                setDate={setDate}
                objectHeight={objectHeight}
                setObjectHeight={setObjectHeight}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
                solarData={solarData}
                timeline={timelineProps}
                compareEnabled={compareEnabled}
                setCompareEnabled={setCompareEnabled}
                compareHeight={compareHeight}
                setCompareHeight={setCompareHeight}
                solarDataB={solarDataB}
              />
            </div>
          </div>
        )}

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
            timeline={timelineProps}
            compareEnabled={compareEnabled}
            setCompareEnabled={setCompareEnabled}
            compareHeight={compareHeight}
            setCompareHeight={setCompareHeight}
            solarDataB={solarDataB}
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

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400 gap-4">
          <div className="flex items-center space-x-4 mb-2 md:mb-0">
            <span>{t('footer.copyright')}</span>
            {lastSavedHint && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400" role="status">
                {t('sidebar.lastSavedHint')}
              </span>
            )}
            <span className="hidden md:inline">•</span>
            <span>
              {t('footer.createdBy')}: <strong className="text-gray-800 dark:text-gray-200">boam79</strong>
            </span>
          </div>
          <div className="flex items-center space-x-4 flex-wrap justify-center">
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
            <a
              href="mailto:ckadltmfxhrxhrxhr@gmail.com"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              ckadltmfxhrxhrxhr@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
