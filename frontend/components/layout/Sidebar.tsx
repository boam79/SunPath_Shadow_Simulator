'use client';

import { MapPin, Calendar, Ruler, Search, Loader2, Download, FileJson, FileText, Copy, Navigation } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { searchAddress, reverseGeocode, type GeocodeResult } from '@/lib/geocoding';
import { exportToCSV, exportToJSON, exportSummary, copyToClipboard } from '@/lib/export';
import Timeline from '@/components/Timeline';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      alert('이 브라우저는 위치 정보를 지원하지 않습니다.');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lon: longitude });
        setIsGettingLocation(false);
        // Reverse geocode to get address name
        reverseGeocode(latitude, longitude).then((address) => {
          if (address) {
            setSearchQuery(address);
          }
        }).catch(() => {
          // Ignore geocoding errors
        });
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = '위치를 가져올 수 없습니다.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다.';
            break;
          case error.TIMEOUT:
            errorMessage = '위치 요청 시간이 초과되었습니다.';
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
        {/* Location Input */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            <MapPin className="w-4 h-4" />
            <span>위치</span>
          </label>
          
          {/* Address Search */}
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                placeholder="주소 검색 (예: 서울특별시 중구)"
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
              placeholder="위도 (Latitude)"
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
              placeholder="경도 (Longitude)"
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
                <span>위치 가져오는 중...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                <span>현재 위치 사용</span>
              </>
            )}
          </button>

          {/* Quick Locations */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setLocation({lat: 37.5665, lon: 126.9780})}
              className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              서울
            </button>
            <button
              onClick={() => setLocation({lat: 35.1796, lon: 129.0756})}
              className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              부산
            </button>
            <button
              onClick={() => setLocation({lat: 33.4996, lon: 126.5312})}
              className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              제주
            </button>
          </div>
        </div>

        {/* Date Input */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            <Calendar className="w-4 h-4" />
            <span>날짜</span>
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
              오늘
            </button>
            <button
              onClick={() => setDate('2025-06-21')}
              className="px-3 py-1.5 text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
            >
              하지 (6/21)
            </button>
            <button
              onClick={() => setDate('2025-12-21')}
              className="px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              동지 (12/21)
            </button>
            <button
              onClick={() => setDate('2025-03-20')}
              className="px-3 py-1.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
            >
              춘분 (3/20)
            </button>
          </div>
        </div>

        {/* Object Height Input */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            <Ruler className="w-4 h-4" />
            <span>물체 높이</span>
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
            시각
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
              현재 설정
            </h3>
            <div className="space-y-1 text-xs text-blue-800 dark:text-blue-400">
              <p>📍 위치: {location.lat.toFixed(4)}°N, {location.lon.toFixed(4)}°E</p>
              <p>📅 날짜: {date}</p>
              <p>🕐 시각: {currentTime}</p>
              <p>📏 높이: {objectHeight}m</p>
            </div>
          </div>
        )}

        {/* Export Section */}
        {solarData && (
          <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              데이터 내보내기
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => exportToCSV(solarData)}
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>
              
              <button
                onClick={() => exportToJSON(solarData)}
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                <FileJson className="w-4 h-4" />
                <span>JSON</span>
              </button>
              
              <button
                onClick={() => exportSummary(solarData)}
                className="flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>요약</span>
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
                <span>{copySuccess ? '복사됨!' : '복사'}</span>
              </button>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {solarData.series.length}개 데이터 포인트
            </p>
          </div>
        )}

        {/* Timeline */}
        {timeline && (
          <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              타임라인
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <Timeline
                currentTime={timeline.currentTime}
                onTimeChange={timeline.onTimeChange}
                startTime={timeline.startTime || '05:00'}
                endTime={timeline.endTime || '20:00'}
                isPlaying={timeline.isPlaying}
                onPlayPause={timeline.onPlayPause}
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
