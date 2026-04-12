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
    <aside className="w-full md:w-64 bg-white dark:bg-gray-800 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-3 md:p-4 space-y-4">
        <div className="mb-2">
          <KakaoPayDonation
            isMobile={isMobile}
            className="flex flex-col items-center justify-center space-y-1 w-full px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg transition-colors shadow-sm cursor-pointer"
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

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <KakaoPayDonation
            isMobile={isMobile}
            className="flex flex-col items-center justify-center space-y-1 w-full px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg transition-colors shadow-sm text-sm font-medium cursor-pointer"
            variant="button"
          />
        </div>
      </div>
    </aside>
  );
}
