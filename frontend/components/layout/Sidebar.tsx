'use client';

import { MapPin, Calendar, Ruler, Search, Loader2, Download, FileJson, FileText, Copy, Navigation, Layers } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { searchAddress, reverseGeocode, type GeocodeResult } from '@/lib/geocoding';
import { exportToCSV, exportToJSON, exportSummary, copyToClipboard } from '@/lib/export';
import Timeline from '@/components/Timeline';
import KakaoPayDonation from '@/components/KakaoPayDonation';
import BatchCalculator from '@/components/BatchCalculator';
import AdvancedOptions from '@/components/AdvancedOptions';
import PresetManager from '@/components/PresetManager';
import SeasonComparison from '@/components/SeasonComparison';
import { useI18n } from '@/lib/i18n-context';
import type { SolarCalculationResponse } from '@/lib/api';

interface SidebarProps {
  location: {lat: number; lon: number} | null;
  setLocation: (loc: {lat: number; lon: number} | null) => void;
  date: string;
  setDate: (date: string) => void;
  objectHeight: number;
  setObjectHeight: (height: number) => void;
  currentTime: string;
  setCurrentTime: (time: string) => void;
  solarData?: SolarCalculationResponse | null;
  timeline?: {
    currentTime: string;
    onTimeChange: (t: string) => void;
    isPlaying: boolean;
    onPlayPause: () => void;
    startTime?: string;
    endTime?: string;
  };
}

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
  timeline
}: SidebarProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState<'single' | 'batch' | 'season' | 'tools'>('single');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle preset loading
  const handleLoadPreset = (preset: { name: string; location: { lat: number; lon: number }; date: string; objectHeight: number }) => {
    setLocation(preset.location);
    setDate(preset.date);
    setObjectHeight(preset.objectHeight);
    setTab('single');
  };

  // 모바일 디바이스 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchAddress(searchQuery);
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelectResult = (result: GeocodeResult) => {
    setLocation({ lat: result.lat, lon: result.lon });
    setSearchQuery(result.display_name);
    setShowResults(false);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(t('errors.locationNotSupported'));
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // 좌표 유효성 검사
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          setIsGettingLocation(false);
          alert(t('errors.invalidLocation'));
          return;
        }
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          setIsGettingLocation(false);
          alert(t('errors.invalidLocationRange'));
          return;
        }
        setLocation({ lat: latitude, lon: longitude });
        setIsGettingLocation(false);
        // Reverse geocode to get address name
        reverseGeocode(latitude, longitude)
          .then((address) => {
            if (address) {
              setSearchQuery(address);
            }
          })
          .catch(() => {
            // 지오코딩 실패는 무시
          });
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = t('errors.locationFailed');
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = t('errors.locationDenied');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = t('errors.locationUnavailable');
            break;
          case error.TIMEOUT:
            errorMessage = t('errors.locationTimeout');
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <aside className="w-full md:w-64 bg-white dark:bg-gray-800 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-3 md:p-4 space-y-4">
        {/* 카카오페이 기부 링크 - 최상단 */}
        <div className="mb-2">
          <KakaoPayDonation
            isMobile={isMobile}
            className="flex flex-col items-center justify-center space-y-1 w-full px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg transition-colors shadow-sm cursor-pointer"
            variant="button"
          />
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            onClick={() => setTab('single')}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              tab === 'single'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('sidebar.tabs.single')}
          </button>
          <button
            onClick={() => setTab('batch')}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              tab === 'batch'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Layers className="w-3 h-3 inline mr-1" />
            {t('sidebar.tabs.batch')}
          </button>
          <button
            onClick={() => setTab('season')}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              tab === 'season'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('sidebar.tabs.season')}
          </button>
          <button
            onClick={() => setTab('tools')}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              tab === 'tools'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('sidebar.tabs.tools')}
          </button>
        </div>

        {/* Single Calculation Tab */}
        {tab === 'single' && (
          <>
        {/* Location Input */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            <MapPin className="w-4 h-4" />
            <span>{t('sidebar.location')}</span>
          </label>
          
          {/* Address Search */}
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                placeholder={t('sidebar.addressSearchPlaceholder')}
                className="w-full pl-9 pr-9 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              {isSearching && (
                <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-blue-500 animate-spin" />
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectResult(result)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                  >
                    <div className="text-gray-900 dark:text-white font-medium truncate">
                      {result.display_name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {result.lat.toFixed(4)}°N, {result.lon.toFixed(4)}°E
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Manual Coordinates */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder={t('sidebar.latitude')}
              value={location?.lat || ''}
              onChange={(e) => {
                const lat = parseFloat(e.target.value);
                if (!isNaN(lat) && location) {
                  setLocation({...location, lat});
                } else if (!isNaN(lat)) {
                  setLocation({lat, lon: 0});
                }
              }}
              step="0.0001"
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="number"
              placeholder={t('sidebar.longitude')}
              value={location?.lon || ''}
              onChange={(e) => {
                const lon = parseFloat(e.target.value);
                if (!isNaN(lon) && location) {
                  setLocation({...location, lon});
                } else if (!isNaN(lon)) {
                  setLocation({lat: 0, lon});
                }
              }}
              step="0.0001"
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Current Location Button */}
          <button
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            {isGettingLocation ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('sidebar.gettingLocation')}</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                <span>{t('sidebar.useCurrentLocation')}</span>
              </>
            )}
          </button>

          {/* Quick Locations */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setLocation({lat: 37.5665, lon: 126.9780})}
              className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              {t('sidebar.quickLocations.seoul')}
            </button>
            <button
              onClick={() => setLocation({lat: 35.1796, lon: 129.0756})}
              className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              {t('sidebar.quickLocations.busan')}
            </button>
            <button
              onClick={() => setLocation({lat: 33.4996, lon: 126.5312})}
              className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              {t('sidebar.quickLocations.jeju')}
            </button>
          </div>
        </div>

        {/* Date Input */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            <Calendar className="w-4 h-4" />
            <span>{t('sidebar.date')}</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          
          {/* Quick Dates */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1.5 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
            >
              {t('sidebar.quickDates.today')}
            </button>
            <button
              onClick={() => setDate('2025-06-21')}
              className="px-3 py-1.5 text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
            >
              {t('sidebar.quickDates.solstice')}
            </button>
            <button
              onClick={() => setDate('2025-12-21')}
              className="px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              {t('sidebar.quickDates.winter')}
            </button>
            <button
              onClick={() => setDate('2025-03-20')}
              className="px-3 py-1.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
            >
              {t('sidebar.quickDates.spring')}
            </button>
          </div>
        </div>

        {/* Timeline */}
        {timeline && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {t('sidebar.timeline')}
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <Timeline
                currentTime={timeline.currentTime}
                onTimeChange={timeline.onTimeChange}
                startTime={timeline.startTime || '05:00'}
                endTime={timeline.endTime || '20:00'}
                isPlaying={timeline.isPlaying}
                onPlayPause={timeline.onPlayPause}
                variant="sidebar"
              />
            </div>
          </div>
        )}

        {/* Object Height Input */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            <Ruler className="w-4 h-4" />
            <span>{t('sidebar.objectHeight')}</span>
          </label>
          
          {/* Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="100"
              value={objectHeight}
              onChange={(e) => setObjectHeight(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>1m</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">{objectHeight}m</span>
              <span>100m</span>
            </div>
          </div>

          {/* Manual Input */}
          <input
            type="number"
            value={objectHeight}
            onChange={(e) => setObjectHeight(parseFloat(e.target.value) || 1)}
            min="0.1"
            max="1000"
            step="0.1"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Time Input */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('sidebar.time')}
          </label>
          <input
            type="time"
            value={currentTime}
            onChange={(e) => setCurrentTime(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Current Status */}
        {location && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1.5">
              {t('sidebar.currentSettings')}
            </h3>
            <div className="space-y-1 text-xs text-blue-800 dark:text-blue-400">
              <p>📍 {t('sidebar.locationLabel')}: {location.lat.toFixed(4)}°N, {location.lon.toFixed(4)}°E</p>
              <p>📅 {t('sidebar.dateLabel')}: {date}</p>
              <p>🕐 {t('sidebar.timeLabel')}: {currentTime}</p>
              <p>📏 {t('sidebar.heightLabel')}: {objectHeight}m</p>
            </div>
          </div>
        )}

        {/* Export Section */}
        {solarData && (
          <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {t('sidebar.exportTitle')}
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => exportToCSV(solarData)}
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{t('sidebar.exportCSV')}</span>
              </button>
              
              <button
                onClick={() => exportToJSON(solarData)}
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                <FileJson className="w-4 h-4" />
                <span>{t('sidebar.exportJSON')}</span>
              </button>
              
              <button
                onClick={() => exportSummary(solarData)}
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>{t('sidebar.exportSummary')}</span>
              </button>
              
              <button
                onClick={async () => {
                  const success = await copyToClipboard(solarData);
                  if (success) {
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }
                }}
                className={`flex items-center justify-center space-x-2 px-3 py-2 text-white text-sm rounded-lg transition-colors ${
                  copySuccess 
                    ? 'bg-green-600' 
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                <Copy className="w-4 h-4" />
                <span>{copySuccess ? t('sidebar.exportCopied') : t('sidebar.exportCopy')}</span>
              </button>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {solarData.series.length}{t('sidebar.dataPoints')}
            </p>
          </div>
        )}
          </>
        )}

        {/* Batch Calculation Tab */}
        {tab === 'batch' && (
          <BatchCalculator />
        )}

        {/* Season Comparison Tab */}
        {tab === 'season' && (
          <SeasonComparison
            location={location}
            objectHeight={objectHeight}
          />
        )}

        {/* Tools Tab */}
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

        {/* 카카오페이 기부 링크 - 하단 */}
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
