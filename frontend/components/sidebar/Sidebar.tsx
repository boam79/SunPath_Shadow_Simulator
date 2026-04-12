'use client';

import { useState, useEffect } from 'react';
import KakaoPayDonation from '@/components/KakaoPayDonation';
import BatchCalculator from '@/components/BatchCalculator';
import AdvancedOptions from '@/components/AdvancedOptions';
import PresetManager from '@/components/PresetManager';
import SeasonComparison from '@/components/SeasonComparison';
import SidebarTabNav from './SidebarTabNav';
import SingleTabPanel from './SingleTabPanel';
import type { SidebarMainTab, SidebarProps } from './sidebar-types';

export default function Sidebar({
  location,
  setLocation,
  date,
  setDate,
  objectHeight,
  setObjectHeight,
  currentTime,
  setCurrentTime,
  solarData,
  timeline,
  compareEnabled = false,
  setCompareEnabled,
  compareHeight = 5,
  setCompareHeight,
  solarDataB = null,
}: SidebarProps) {
  const [tab, setTab] = useState<SidebarMainTab>('single');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLoadPreset = (preset: {
    name: string;
    location: { lat: number; lon: number };
    date: string;
    objectHeight: number;
  }) => {
    setLocation(preset.location);
    setDate(preset.date);
    setObjectHeight(preset.objectHeight);
    setTab('single');
  };

  return (
    <aside className="w-full overflow-y-auto border-b border-amber-100/90 bg-white/90 shadow-soft backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 md:w-72 md:border-b-0 md:border-r">
      <div className="space-y-4 p-3 md:p-4">
        <div className="mb-1">
          <KakaoPayDonation
            isMobile={isMobile}
            className="flex w-full cursor-pointer flex-col items-center justify-center space-y-1 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 px-4 py-2.5 text-sm font-bold text-stone-900 shadow-md transition hover:from-amber-500 hover:to-yellow-500"
            variant="button"
          />
        </div>

        <SidebarTabNav tab={tab} onTabChange={setTab} />

        {tab === 'single' && (
          <SingleTabPanel
            location={location}
            setLocation={setLocation}
            date={date}
            setDate={setDate}
            objectHeight={objectHeight}
            setObjectHeight={setObjectHeight}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            solarData={solarData}
            timeline={timeline}
            compareEnabled={compareEnabled}
            setCompareEnabled={setCompareEnabled}
            compareHeight={compareHeight}
            setCompareHeight={setCompareHeight}
            solarDataB={solarDataB}
          />
        )}

        {tab === 'batch' && <BatchCalculator />}

        {tab === 'season' && <SeasonComparison location={location} objectHeight={objectHeight} />}

        {tab === 'tools' && (
          <div className="space-y-4">
            <PresetManager
              currentLocation={location}
              currentDate={date}
              currentObjectHeight={objectHeight}
              onLoadPreset={handleLoadPreset}
            />
            <AdvancedOptions />
          </div>
        )}

        <div className="border-t border-amber-100/80 pt-4 dark:border-slate-700">
          <KakaoPayDonation
            isMobile={isMobile}
            className="flex w-full cursor-pointer flex-col items-center justify-center space-y-1 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 px-4 py-2.5 text-sm font-bold text-stone-900 shadow-md transition hover:from-amber-500 hover:to-yellow-500"
            variant="button"
          />
        </div>
      </div>
    </aside>
  );
}
