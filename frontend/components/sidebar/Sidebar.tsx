'use client';

import { useState, useEffect } from 'react';
import SidebarTabNav from './SidebarTabNav';
import SimulatePanel from './SimulatePanel';
import ComparePanel from './ComparePanel';
import ToolsPanel from './ToolsPanel';
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
  const [tab, setTab] = useState<SidebarMainTab>('simulate');
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
    setTab('simulate');
  };

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-white/90 backdrop-blur-sm dark:bg-slate-900/90">
      <div className="shrink-0 space-y-3 border-b border-[color:var(--glass-border)] px-3 pb-3 pt-3 md:px-4">
        <SidebarTabNav tab={tab} onTabChange={setTab} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 md:px-4">
        {tab === 'simulate' && (
          <SimulatePanel
            location={location}
            setLocation={setLocation}
            date={date}
            setDate={setDate}
            objectHeight={objectHeight}
            setObjectHeight={setObjectHeight}
            timeline={timeline}
          />
        )}
        {tab === 'compare' && (
          <ComparePanel
            location={location}
            objectHeight={objectHeight}
            compareEnabled={compareEnabled}
            setCompareEnabled={setCompareEnabled}
            compareHeight={compareHeight}
            setCompareHeight={setCompareHeight}
            solarData={solarData}
            solarDataB={solarDataB}
          />
        )}
        {tab === 'tools' && (
          <ToolsPanel
            location={location}
            date={date}
            objectHeight={objectHeight}
            currentTime={currentTime}
            solarData={solarData}
            isMobile={isMobile}
            onLoadPreset={handleLoadPreset}
          />
        )}
      </div>
    </aside>
  );
}
