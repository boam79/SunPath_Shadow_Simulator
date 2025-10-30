'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MainContent from '@/components/layout/MainContent';
import StructuredData from '@/components/StructuredData';
import { calculateSolar, type SolarCalculationResponse } from '@/lib/api';

export default function Home() {
  const [location, setLocation] = useState<{lat: number; lon: number} | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [objectHeight, setObjectHeight] = useState<number>(10);
  const [currentTime, setCurrentTime] = useState<string>('12:00');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [solarData, setSolarData] = useState<SolarCalculationResponse | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSolarData = useCallback(async () => {
    if (!location) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await calculateSolar({
        location: {
          lat: location.lat,
          lon: location.lon,
          altitude: 0
        },
        datetime: {
          date: date,
          start_time: '00:00',
          end_time: '23:59',
          interval: 60
        },
        object: {
          height: objectHeight
        },
        options: {
          atmosphere: true,
          precision: 'high'
        }
      });

      setSolarData(response);
      console.log('✅ Solar data fetched:', response.series.length, 'data points');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('❌ Error fetching solar data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [location, date, objectHeight]);

  // Auto-calculate when parameters change
  useEffect(() => {
    if (location && date) {
      fetchSolarData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, date, objectHeight]);

  // Memoize play/pause handler to prevent unnecessary re-renders
  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => {
      const next = !prev;
      try { console.log(`[Timeline] onPlayPause clicked -> ${next ? 'PLAY' : 'PAUSE'}`); } catch {}
      return next;
    });
  }, []);

  // Memoize time change handler to prevent unnecessary re-renders
  const handleTimeChange = useCallback((time: string) => {
    console.log('[Timeline] handleTimeChange called with:', time);
    setCurrentTime(time);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <StructuredData />
      {/* Header */}
      <Header onReset={() => {
        setLocation(null);
        setDate(new Date().toISOString().split('T')[0]);
        setObjectHeight(10);
        setCurrentTime('12:00');
        setIsPlaying(false);
        setSolarData(null);
      }} onToggleSidebar={() => setSidebarOpen(v => !v)} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar - Controls */}
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
          />
        </div>
        
        {/* Main - Map & Visualization */}
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
          timeline={{
            currentTime,
            onTimeChange: handleTimeChange,
            isPlaying,
            onPlayPause: handlePlayPause,
            startTime: '05:00',
            endTime: '20:00'
          }}
        />
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-4 mb-2 md:mb-0">
            <span>© 2025 SunPath & Shadow Simulator</span>
            <span className="hidden md:inline">•</span>
            <span>제작자: <strong className="text-gray-800 dark:text-gray-200">boam79</strong></span>
          </div>
          <div className="flex items-center space-x-4">
            <span>문의사항:</span>
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
