'use client';

import {
  MapPin,
  Calendar,
  Ruler,
  Search,
  Loader2,
  Navigation,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { searchAddress, reverseGeocode, type GeocodeResult } from '@/lib/geocoding';
import Timeline from '@/components/Timeline';
import { useI18n } from '@/lib/i18n-context';
import type { SidebarTimelineConfig } from './sidebar-types';

interface SimulatePanelProps {
  location: { lat: number; lon: number } | null;
  setLocation: (loc: { lat: number; lon: number } | null) => void;
  date: string;
  setDate: (date: string) => void;
  objectHeight: number;
  setObjectHeight: (height: number) => void;
  timeline?: SidebarTimelineConfig;
}

/** D1 simulate: 위치 → 날짜 → 타임라인 → 높이만. 위경도/고급은 접기. */
export default function SimulatePanel({
  location,
  setLocation,
  date,
  setDate,
  objectHeight,
  setObjectHeight,
  timeline,
}: SimulatePanelProps) {
  const { t } = useI18n();
  const isDevelopment = process.env.NODE_ENV === 'development';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [coordsOpen, setCoordsOpen] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchGenRef = useRef(0);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const gen = ++searchGenRef.current;
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchAddress(searchQuery);
        if (gen !== searchGenRef.current) return;
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        if (gen !== searchGenRef.current) return;
        if (isDevelopment) console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        if (gen === searchGenRef.current) setIsSearching(false);
      }
    }, 500);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
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
            if (address) setSearchQuery(address);
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {t('sidebar.location')}
        </label>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              placeholder={t('sidebar.addressSearchPlaceholder')}
              className="friendly-input w-full py-2 pl-9 pr-9 text-sm"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-sky-500" />
            )}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-[color:var(--glass-border)] bg-white/98 shadow-lg dark:bg-slate-800">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectResult(result)}
                    className="w-full border-b border-[color:var(--glass-border)] px-3 py-2 text-left text-sm last:border-b-0 hover:bg-sky/40"
                  >
                    <div className="truncate font-medium text-ink">{result.display_name}</div>
                    <div className="mt-0.5 text-[11px] text-ink-muted">
                      {result.lat.toFixed(4)}°N, {result.lon.toFixed(4)}°E
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
            title={t('sidebar.useCurrentLocation')}
            aria-label={t('sidebar.useCurrentLocation')}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm transition hover:bg-emerald-600 disabled:bg-stone-300"
          >
            {isGettingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['seoul', 37.5665, 126.978],
              ['busan', 35.1796, 129.0756],
              ['jeju', 33.4996, 126.5312],
            ] as const
          ).map(([key, lat, lon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setLocation({ lat, lon })}
              className="rounded-full bg-sky/70 px-2.5 py-1 text-[11px] font-semibold text-sky-900 transition hover:bg-sky dark:bg-sky-900/40 dark:text-sky-100"
            >
              {t(`sidebar.quickLocations.${key}`)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setCoordsOpen((v) => !v)}
          className="flex w-full items-center gap-1 text-[11px] font-medium text-ink-muted hover:text-ink"
          aria-expanded={coordsOpen}
        >
          {coordsOpen ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          {t('sidebar.coordsToggle')}
        </button>
        {coordsOpen && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder={t('sidebar.latitude')}
              value={location?.lat ?? ''}
              onChange={(e) => {
                const lat = parseFloat(e.target.value);
                if (!isNaN(lat) && location) setLocation({ ...location, lat });
                else if (!isNaN(lat)) setLocation({ lat, lon: 0 });
              }}
              step="0.0001"
              className="friendly-input px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder={t('sidebar.longitude')}
              value={location?.lon ?? ''}
              onChange={(e) => {
                const lon = parseFloat(e.target.value);
                if (!isNaN(lon) && location) setLocation({ ...location, lon });
                else if (!isNaN(lon)) setLocation({ lat: 0, lon });
              }}
              step="0.0001"
              className="friendly-input px-3 py-2 text-sm"
            />
          </div>
        )}
      </section>

      <section className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
          <Calendar className="h-3.5 w-3.5" aria-hidden />
          {t('sidebar.date')}
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="friendly-input w-full px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setDate(new Date().toISOString().split('T')[0])}
            className="rounded-xl bg-emerald-100/90 px-2 py-1.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
          >
            {t('sidebar.quickDates.today')}
          </button>
          <button
            type="button"
            onClick={() => setDate(`${new Date().getFullYear()}-06-21`)}
            className="rounded-xl bg-amber-100/90 px-2 py-1.5 text-[11px] font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
          >
            {t('sidebar.quickDates.solstice')}
          </button>
          <button
            type="button"
            onClick={() => setDate(`${new Date().getFullYear()}-12-21`)}
            className="rounded-xl bg-sky-100/90 px-2 py-1.5 text-[11px] font-semibold text-sky-900 dark:bg-sky-900/40 dark:text-sky-100"
          >
            {t('sidebar.quickDates.winter')}
          </button>
          <button
            type="button"
            onClick={() => setDate(`${new Date().getFullYear()}-03-20`)}
            className="rounded-xl bg-stone-100 px-2 py-1.5 text-[11px] font-semibold text-stone-700 dark:bg-slate-700 dark:text-stone-200"
          >
            {t('sidebar.quickDates.spring')}
          </button>
        </div>
      </section>

      {timeline && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-ink-muted">{t('sidebar.timeline')}</h3>
          <div className="d1-glass rounded-2xl p-2.5">
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
        </section>
      )}

      <section className="space-y-2">
        <label className="flex items-center justify-between text-xs font-semibold text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <Ruler className="h-3.5 w-3.5" aria-hidden />
            {t('sidebar.objectHeight')}
          </span>
          <span className="font-display text-sm font-semibold text-ink">{objectHeight}m</span>
        </label>
        <input
          type="range"
          min={1}
          max={100}
          value={objectHeight}
          onChange={(e) => setObjectHeight(parseFloat(e.target.value))}
          className="w-full accent-[color:var(--sun)]"
        />
        <div className="flex justify-between text-[10px] text-ink-muted">
          <span>1m</span>
          <span>100m</span>
        </div>
      </section>
    </div>
  );
}
