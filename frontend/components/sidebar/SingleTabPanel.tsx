'use client';

import { MapPin, Calendar, Ruler, Search, Loader2, Download, FileJson, FileText, Copy, Navigation, Printer } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { searchAddress, reverseGeocode, type GeocodeResult } from '@/lib/geocoding';
import { exportToCSV, exportToJSON, exportSummary, copyToClipboard } from '@/lib/export';
import Timeline from '@/components/Timeline';
import { useI18n } from '@/lib/i18n-context';
import type { SolarCalculationResponse } from '@/lib/api';
import { openPrintableSolarReport } from '@/lib/printReport';
import WeatherStrip from '@/components/WeatherStrip';
import type { SidebarTimelineConfig } from './sidebar-types';
import { maxShadowLength } from './max-shadow';

export interface SingleTabPanelProps {
  location: { lat: number; lon: number } | null;
  setLocation: (loc: { lat: number; lon: number } | null) => void;
  date: string;
  setDate: (date: string) => void;
  objectHeight: number;
  setObjectHeight: (height: number) => void;
  currentTime: string;
  setCurrentTime: (time: string) => void;
  solarData?: SolarCalculationResponse | null;
  timeline?: SidebarTimelineConfig;
  compareEnabled?: boolean;
  setCompareEnabled?: (v: boolean) => void;
  compareHeight?: number;
  setCompareHeight?: (h: number) => void;
  solarDataB?: SolarCalculationResponse | null;
}

export default function SingleTabPanel({
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
}: SingleTabPanelProps) {
  const { t } = useI18n();
  const isDevelopment = process.env.NODE_ENV === 'development';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        if (isDevelopment) {
          console.error('Search error:', error);
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        reverseGeocode(latitude, longitude)
          .then((address) => {
            if (address) {
              setSearchQuery(address);
            }
          })
          .catch(() => {});
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
        maximumAge: 0,
      }
    );
  };

  return (
    <>
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-xs font-medium text-stone-700 dark:text-stone-200">
          <MapPin className="w-4 h-4" />
          <span>{t('sidebar.location')}</span>
        </label>

        <div className="relative">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              placeholder={t('sidebar.addressSearchPlaceholder')}
              className="w-full pl-9 pr-9 py-1.5 text-sm border border-amber-100/90 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-transparent bg-white/95 dark:bg-slate-800 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 dark:placeholder:text-stone-500"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            {isSearching && (
              <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-sky-500" />
            )}
          </div>

          {showResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white/95 dark:bg-slate-800 border border-amber-100/80 dark:border-stone-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectResult(result)}
                  className="w-full px-4 py-2 text-left hover:bg-amber-50/90 dark:hover:bg-slate-600 transition-colors text-sm border-b border-amber-50/90 last:border-b-0 dark:border-stone-600"
                >
                  <div className="text-stone-900 dark:text-stone-50 font-medium truncate">
                    {result.display_name}
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    {result.lat.toFixed(4)}°N, {result.lon.toFixed(4)}°E
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder={t('sidebar.latitude')}
            value={location?.lat ?? ''}
            onChange={(e) => {
              const lat = parseFloat(e.target.value);
              if (!isNaN(lat) && location) {
                setLocation({ ...location, lat });
              } else if (!isNaN(lat)) {
                setLocation({ lat, lon: 0 });
              }
            }}
            step="0.0001"
            className="px-3 py-2 text-sm border border-amber-100/90 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-sky-400 bg-white/95 dark:bg-slate-800 text-stone-900 dark:text-stone-50"
          />
          <input
            type="number"
            placeholder={t('sidebar.longitude')}
            value={location?.lon ?? ''}
            onChange={(e) => {
              const lon = parseFloat(e.target.value);
              if (!isNaN(lon) && location) {
                setLocation({ ...location, lon });
              } else if (!isNaN(lon)) {
                setLocation({ lat: 0, lon });
              }
            }}
            step="0.0001"
            className="px-3 py-2 text-sm border border-amber-100/90 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-sky-400 bg-white/95 dark:bg-slate-800 text-stone-900 dark:text-stone-50"
          />
        </div>

        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isGettingLocation}
          className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-emerald-600 hover:to-teal-600 disabled:cursor-not-allowed disabled:from-stone-300 disabled:to-stone-400"
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

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLocation({ lat: 37.5665, lon: 126.978 })}
            className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800 transition hover:bg-sky-200 dark:bg-sky-900/50 dark:text-sky-200 dark:hover:bg-sky-800/60"
          >
            {t('sidebar.quickLocations.seoul')}
          </button>
          <button
            type="button"
            onClick={() => setLocation({ lat: 35.1796, lon: 129.0756 })}
            className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800 transition hover:bg-sky-200 dark:bg-sky-900/50 dark:text-sky-200 dark:hover:bg-sky-800/60"
          >
            {t('sidebar.quickLocations.busan')}
          </button>
          <button
            type="button"
            onClick={() => setLocation({ lat: 33.4996, lon: 126.5312 })}
            className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800 transition hover:bg-sky-200 dark:bg-sky-900/50 dark:text-sky-200 dark:hover:bg-sky-800/60"
          >
            {t('sidebar.quickLocations.jeju')}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-xs font-medium text-stone-700 dark:text-stone-200">
          <Calendar className="w-4 h-4" />
          <span>{t('sidebar.date')}</span>
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-2 border border-amber-100/90 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-transparent bg-white/95 dark:bg-slate-800 text-stone-900 dark:text-stone-50"
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-1.5 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-xl hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
          >
            {t('sidebar.quickDates.today')}
          </button>
          <button
            type="button"
            onClick={() => setDate('2025-06-21')}
            className="px-3 py-1.5 text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-xl hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
          >
            {t('sidebar.quickDates.solstice')}
          </button>
          <button
            type="button"
            onClick={() => setDate('2025-12-21')}
            className="px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            {t('sidebar.quickDates.winter')}
          </button>
          <button
            type="button"
            onClick={() => setDate('2025-03-20')}
            className="px-3 py-1.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
          >
            {t('sidebar.quickDates.spring')}
          </button>
        </div>
      </div>

      {timeline && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-stone-700 dark:text-stone-200">{t('sidebar.timeline')}</h3>
          <div className="bg-white/95 dark:bg-slate-900 rounded-xl border border-amber-100/90 dark:border-slate-700 p-3">
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

      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-xs font-medium text-stone-700 dark:text-stone-200">
          <Ruler className="w-4 h-4" />
          <span>{t('sidebar.objectHeight')}</span>
        </label>

        <div className="space-y-2">
          <input
            type="range"
            min={1}
            max={100}
            value={objectHeight}
            onChange={(e) => setObjectHeight(parseFloat(e.target.value))}
            className="w-full h-2 bg-amber-100/80 dark:bg-slate-700 rounded-xl appearance-none cursor-pointer accent-sky-500"
          />
          <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>1m</span>
            <span className="font-bold text-sky-600 dark:text-sky-300">{objectHeight}m</span>
            <span>100m</span>
          </div>
        </div>

        <input
          type="number"
          value={objectHeight}
          onChange={(e) => setObjectHeight(parseFloat(e.target.value) || 1)}
          min={0.1}
          max={1000}
          step={0.1}
          className="w-full px-4 py-2 border border-amber-100/90 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-sky-400 bg-white/95 dark:bg-slate-800 text-stone-900 dark:text-stone-50"
        />
      </div>

      {setCompareEnabled && setCompareHeight && (
        <div className="space-y-2 rounded-xl border border-dashed border-amber-100/90 dark:border-stone-600 p-2">
          <label className="flex items-center gap-2 text-xs font-medium text-stone-700 dark:text-stone-200 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-amber-200 dark:border-stone-500"
              checked={compareEnabled}
              onChange={(e) => setCompareEnabled(e.target.checked)}
            />
            <span>{t('sidebar.compareToggle')}</span>
          </label>
          {compareEnabled && (
            <div className="space-y-1">
              <label className="text-xs text-stone-600 dark:text-stone-400">{t('sidebar.compareHeight')}</label>
              <input
                type="range"
                min={1}
                max={100}
                value={compareHeight}
                onChange={(e) => setCompareHeight(parseFloat(e.target.value))}
                className="w-full h-2 bg-amber-100/80 dark:bg-slate-700 rounded-xl accent-amber-600"
              />
              <div className="text-xs text-center text-amber-700 dark:text-amber-300">{compareHeight}m</div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-medium text-stone-700 dark:text-stone-200">{t('sidebar.time')}</label>
        <input
          type="time"
          value={currentTime}
          onChange={(e) => setCurrentTime(e.target.value)}
          className="w-full px-4 py-2 border border-amber-100/90 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-sky-400 bg-white/95 dark:bg-slate-800 text-stone-900 dark:text-stone-50"
        />
      </div>

      {location && (
        <div className="rounded-2xl border border-sky-200/90 bg-gradient-to-br from-sky-50 to-cyan-50 p-3 dark:border-sky-800/50 dark:from-sky-950/40 dark:to-cyan-950/30">
          <h3 className="mb-1.5 text-xs font-bold text-sky-900 dark:text-sky-200">
            {t('sidebar.currentSettings')}
          </h3>
          <div className="space-y-1 text-xs font-medium text-sky-900/90 dark:text-sky-100/90">
            <p>
              📍 {t('sidebar.locationLabel')}: {location.lat.toFixed(4)}°N, {location.lon.toFixed(4)}°E
            </p>
            <p>
              📅 {t('sidebar.dateLabel')}: {date}
            </p>
            <p>
              🕐 {t('sidebar.timeLabel')}: {currentTime}
            </p>
            <p>
              📏 {t('sidebar.heightLabel')}: {objectHeight}m
            </p>
          </div>
        </div>
      )}

      {location && (
        <WeatherStrip
          lat={location.lat}
          lon={location.lon}
          date={date}
          currentTime={currentTime}
          labels={{
            title: t('sidebar.weatherTitle'),
            avgCloud: t('sidebar.weatherAvgCloud'),
            atTime: t('sidebar.weatherAtTime'),
            precip: t('sidebar.weatherPrecip'),
          }}
        />
      )}

      {compareEnabled && solarData && solarDataB && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 p-2 text-xs">
          <div className="font-semibold text-amber-900 dark:text-amber-200 mb-1">{t('sidebar.compareTableTitle')}</div>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="pr-2" />
                <th className="text-amber-800 dark:text-amber-300">{t('sidebar.compareColA')}</th>
                <th className="text-amber-800 dark:text-amber-300">{t('sidebar.compareColB')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pr-2 font-medium">max</td>
                <td>{maxShadowLength(solarData).toFixed(2)}</td>
                <td>{maxShadowLength(solarDataB).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {solarData && (
        <div className="space-y-2 pt-4 border-t border-amber-100/90 dark:border-slate-700">
          <h3 className="text-xs font-semibold text-stone-700 dark:text-stone-200">{t('sidebar.exportTitle')}</h3>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => exportToCSV(solarData)}
              className="flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:from-emerald-600 hover:to-teal-600"
            >
              <Download className="w-4 h-4" />
              <span>{t('sidebar.exportCSV')}</span>
            </button>

            <button
              type="button"
              onClick={() => exportToJSON(solarData)}
              className="flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:from-sky-600 hover:to-cyan-600"
            >
              <FileJson className="w-4 h-4" />
              <span>{t('sidebar.exportJSON')}</span>
            </button>

            <button
              type="button"
              onClick={() => exportSummary(solarData)}
              className="flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:from-violet-600 hover:to-purple-600"
            >
              <FileText className="w-4 h-4" />
              <span>{t('sidebar.exportSummary')}</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                const success = await copyToClipboard(solarData);
                if (success) {
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }
              }}
              className={`flex items-center justify-center space-x-2 px-3 py-2 text-white text-sm rounded-xl transition-colors ${
                copySuccess ? 'bg-emerald-500' : 'bg-stone-500 hover:bg-stone-600'
              }`}
            >
              <Copy className="w-4 h-4" />
              <span>{copySuccess ? t('sidebar.exportCopied') : t('sidebar.exportCopy')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!location) return;
                openPrintableSolarReport(solarData, {
                  lat: location.lat,
                  lon: location.lon,
                  date,
                  objectHeightM: objectHeight,
                });
              }}
              className="col-span-2 flex items-center justify-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm rounded-xl transition-colors"
            >
              <Printer className="w-4 h-4" aria-hidden />
              <span>{t('sidebar.printReport')}</span>
            </button>
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400">
            {solarData.series.length}
            {t('sidebar.dataPoints')}
          </p>
        </div>
      )}
    </>
  );
}
