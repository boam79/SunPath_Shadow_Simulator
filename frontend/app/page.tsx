'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MainContent from '@/components/layout/MainContent';
import Timeline from '@/components/Timeline';
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

  // Auto-calculate when parameters change
  useEffect(() => {
    if (location && date) {
      fetchSolarData();
    }
  }, [location, date, objectHeight]);

  const fetchSolarData = async () => {
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
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
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
            <div className="absolute left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-xl">
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
          timeline={{
            currentTime,
            onTimeChange: setCurrentTime,
            isPlaying,
            onPlayPause: () => setIsPlaying(!isPlaying),
            startTime: '05:00',
            endTime: '20:00'
          }}
        />
      </div>


    </div>
  );
}
