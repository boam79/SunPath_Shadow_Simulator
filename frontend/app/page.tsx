'use client';

import { Suspense, useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MainContent from '@/components/layout/MainContent';
import MobileBottomNav, { type MobileNavId } from '@/components/layout/MobileBottomNav';
import StructuredData from '@/components/StructuredData';
import KakaoPayDonation from '@/components/KakaoPayDonation';
import OnboardingModal from '@/components/OnboardingModal';
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
  const [mobilePanel, setMobilePanel] = useState<'map' | 'data'>('map');
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

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

  const coldStartText = t('loading.coldStart').replace(
    '{{seconds}}',
    String(Math.round(loadingMs / 1000))
  );

  const mainLayout = isMobile ? (mobilePanel === 'map' ? 'mapOnly' : 'dataOnly') : 'full';

  const navActive: MobileNavId = moreSheetOpen ? 'more' : mobilePanel === 'data' ? 'data' : 'map';

  const sidebarProps = {
    location,
    setLocation,
    date,
    setDate,
    objectHeight,
    setObjectHeight,
    currentTime,
    setCurrentTime,
    solarData,
    timeline: timelineProps,
    compareEnabled,
    setCompareEnabled,
    compareHeight,
    setCompareHeight,
    solarDataB,
  };

  const handleMobileNav = (id: MobileNavId) => {
    if (id === 'more') {
      setMoreSheetOpen(true);
      return;
    }
    setMoreSheetOpen(false);
    if (id === 'map' || id === 'data') setMobilePanel(id);
  };

  return (
    <div className="app-page-bg flex min-h-screen flex-col">
      <StructuredData />
      <OnboardingModal />
      <Header
        onReset={() => {
          handleHeaderReset();
          setMoreSheetOpen(false);
          setMobilePanel('map');
        }}
        onToggleSidebar={() => setMoreSheetOpen(true)}
      />

      {isLoading && loadingMs > 5000 && (
        <div
          className="flex items-center gap-3 border-b border-amber-200/90 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-800/50 dark:from-amber-950/50 dark:to-orange-950/40 dark:text-amber-100"
          role="status"
        >
          <span className="text-lg" aria-hidden>
            ☀️
          </span>
          <span>{coldStartText}</span>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col md:flex-row md:overflow-hidden">
        <div className="hidden min-h-0 shrink-0 md:block md:w-72 md:overflow-y-auto">
          <Sidebar {...sidebarProps} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col pb-20 md:min-h-0 md:pb-0">
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
            layout={mainLayout}
          />
        </div>
      </div>

      <MobileBottomNav active={navActive} onSelect={handleMobileNav} />

      {moreSheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-stone-900/45 backdrop-blur-sm"
            aria-label={t('nav.closeSheet')}
            onClick={() => setMoreSheetOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 flex max-h-[min(88dvh,640px)] flex-col overflow-hidden rounded-t-3xl border border-amber-100/90 bg-cream-50/98 shadow-2xl dark:border-slate-600 dark:bg-slate-900/98">
            <div className="flex shrink-0 items-center justify-between border-b border-amber-100/80 px-4 py-3 dark:border-slate-700">
              <span className="text-base font-bold text-stone-800 dark:text-white">{t('nav.more')}</span>
              <button
                type="button"
                onClick={() => setMoreSheetOpen(false)}
                className="rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-900 dark:bg-sky-900/50 dark:text-sky-100"
              >
                {t('nav.closeSheet')}
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-0 pb-6 pt-1">
              <Sidebar
                {...sidebarProps}
                setLocation={(loc) => {
                  setLocation(loc);
                }}
              />
            </div>
          </div>
        </div>
      )}

      <footer className="mt-auto border-t border-amber-100/90 bg-white/80 px-3 py-3 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/80 md:px-8 md:py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 pb-[max(4.5rem,env(safe-area-inset-bottom))] text-xs text-stone-600 dark:text-stone-300 md:flex-row md:justify-between md:gap-4 md:pb-0 md:text-sm">
          <div className="flex flex-col items-center gap-2 md:mb-0 md:flex-row md:flex-wrap md:items-center md:gap-x-3">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-4 py-2 text-xs font-semibold text-sky-900 shadow-sm transition hover:bg-sky-200 dark:bg-sky-900/40 dark:text-sky-100 md:text-xs"
            >
              <span aria-hidden>🔗</span>
              <span>{copyToast ? t('footer.shareCopied') : t('footer.shareLink')}</span>
            </button>
            <span className="font-medium md:inline">{t('footer.copyright')}</span>
            {lastSavedHint && (
              <span
                className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 md:text-xs"
                role="status"
              >
                {t('sidebar.lastSavedHint')}
              </span>
            )}
            <span className="hidden text-stone-300 dark:text-stone-600 md:inline">·</span>
            <span className="hidden md:inline">
              {t('footer.createdBy')}: <strong className="text-stone-800 dark:text-white">boam79</strong>
            </span>
          </div>
          <div className="hidden flex-wrap items-center justify-center gap-3 md:flex">
            <KakaoPayDonation
              isMobile={isMobile}
              className="flex cursor-pointer flex-col items-center justify-center space-y-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 px-4 py-2 text-sm font-bold text-stone-900 shadow-md transition hover:from-amber-500 hover:to-yellow-500 md:flex-row md:space-y-0 md:space-x-2"
              variant="link"
            />
            <span className="text-stone-300 dark:text-stone-600">·</span>
            <span className="font-medium">{t('footer.contact')}:</span>
            <a
              href="mailto:ckadltmfxhrxhrxhr@gmail.com"
              className="font-semibold text-sky-700 underline-offset-2 transition hover:text-sky-900 hover:underline dark:text-sky-400 dark:hover:text-sky-200"
            >
              ckadltmfxhrxhrxhr@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
