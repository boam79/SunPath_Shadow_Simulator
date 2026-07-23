'use client';

import { Suspense, useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MainContent from '@/components/layout/MainContent';
import MobileBottomNav, { type MobileNavId } from '@/components/layout/MobileBottomNav';
import StructuredData from '@/components/StructuredData';
import KakaoPayDonation from '@/components/KakaoPayDonation';
import OnboardingModal from '@/components/OnboardingModal';
import Timeline from '@/components/Timeline';
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

  const onMobile = isMobile === true;
  const onDesktop = isMobile === false;

  const mainLayout = onMobile ? (mobilePanel === 'map' ? 'mapOnly' : 'dataOnly') : 'full';

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
    <div className="app-page-bg flex h-dvh max-h-dvh flex-col overflow-hidden">
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
          className="flex items-center gap-3 border-b border-[color:var(--glass-border)] bg-sky/60 px-4 py-3 text-sm font-medium text-ink dark:bg-slate-900/80 dark:text-amber-100"
          role="status"
        >
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-sun" aria-hidden />
          <span>{coldStartText}</span>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        {/* PC only — 모바일에서 CSS hidden으로 남겨두면 Timeline이 이중 마운트되어 재생이 2배로 튐 */}
        {onDesktop && (
          <div className="flex min-h-0 w-80 shrink-0 flex-col overflow-hidden border-r border-[color:var(--glass-border)] bg-[color:var(--glass)] backdrop-blur-md lg:w-[22rem]">
            <Sidebar {...sidebarProps} />
          </div>
        )}

        <div
          className={`relative flex min-h-0 flex-1 flex-col overflow-hidden ${
            onMobile ? 'pb-[calc(4.25rem+env(safe-area-inset-bottom))]' : 'pb-0'
          }`}
        >
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

          {/* D1: mobile map timeline dock — play without opening settings */}
          {onMobile && mobilePanel === 'map' && !moreSheetOpen && (
            <div className="pointer-events-none absolute inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 px-3">
              <div className="pointer-events-auto d1-timeline-dock mb-2 shadow-soft">
                <Timeline
                  currentTime={currentTime}
                  onTimeChange={handleTimeChange}
                  isPlaying={isPlaying}
                  onPlayPause={handlePlayPause}
                  startTime={tlStart}
                  endTime={tlEnd}
                  variant="sidebar"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {onMobile && <MobileBottomNav active={navActive} onSelect={handleMobileNav} />}

      {onMobile && moreSheetOpen && (
        <div className="fixed inset-0 z-50">
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

      {/* Desktop: thin chrome bar — map keeps the stage, footer no longer fights for height */}
      <footer className="mt-auto hidden shrink-0 border-t border-[color:var(--glass-border)] bg-[color:var(--glass)]/95 px-4 py-1.5 backdrop-blur-md md:block md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-[11px] text-ink-muted md:text-xs">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1 rounded-full bg-sky-100/90 px-2.5 py-1 text-[11px] font-semibold text-sky-900 transition hover:bg-sky-200 dark:bg-sky-900/40 dark:text-sky-100"
            >
              <span aria-hidden>🔗</span>
              <span>{copyToast ? t('footer.shareCopied') : t('footer.shareLink')}</span>
            </button>
            <span className="truncate font-medium">{t('footer.copyright')}</span>
            {lastSavedHint && (
              <span
                className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                role="status"
              >
                {t('sidebar.lastSavedHint')}
              </span>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <KakaoPayDonation
              isMobile={onMobile}
              className="inline-flex cursor-pointer items-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 px-2.5 py-1 text-[11px] font-bold text-stone-900 shadow-sm transition hover:from-amber-500 hover:to-yellow-500"
              variant="link"
            />
            <a
              href="mailto:ckadltmfxhrxhrxhr@gmail.com"
              className="font-semibold text-sky-700 underline-offset-2 transition hover:underline dark:text-sky-400"
            >
              {t('footer.contact')}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
