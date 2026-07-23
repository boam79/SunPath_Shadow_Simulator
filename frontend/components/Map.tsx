'use client';

import { useEffect, useState, useRef } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Sun } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';
import { reverseGeocode } from '@/lib/geocoding';
import type { SolarDataPoint } from '@/lib/api';

interface MapComponentProps {
  location: {lat: number; lon: number} | null;
  onLocationChange: (lat: number, lon: number) => void;
  currentDataPoint?: SolarDataPoint | null;
  solarSeries?: SolarDataPoint[] | null;
  currentTime?: string;
  /** `hud`: 데스크톱 MainContent HUD와 겹치지 않게 하단 정보 카드 숨김 */
  overlayMode?: 'default' | 'hud';
}

export default function MapComponent({
  location,
  onLocationChange,
  currentDataPoint,
  solarSeries,
  currentTime,
  overlayMode = 'default',
}: MapComponentProps) {
  const { t } = useI18n();
  const mapRef = useRef<MapRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewState, setViewState] = useState({
    longitude: location?.lon || 126.9780,
    latitude: location?.lat || 37.5665,
    zoom: 12
  });

  const [addressName, setAddressName] = useState<string | null>(null);
  const [geolocationSupported, setGeolocationSupported] = useState(false);
  
  // 브라우저가 geolocation을 지원하는지 확인
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setGeolocationSupported(true);
    }
  }, []);

  // Container size changes (mobile flex/absolute) → force MapLibre resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      try {
        mapRef.current?.getMap()?.resize();
      } catch {
        /* ignore */
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  
  // Prefer Carto basemap (stable CDN) over OSM direct tiles
  const [mapStyle] = useState({
    version: 8 as const,
    sources: {
      'basemap': {
        type: 'raster' as const,
        tiles: [
          'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap © CARTO'
      }
    },
    layers: [
      {
        id: 'basemap',
        type: 'raster' as const,
        source: 'basemap'
      }
    ]
  });

  // Calculate color based on time of day (matches timeline gradient)
  const getTimeBasedColor = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    
    // Color mapping based on timeline gradient
    // 새벽 (0-6시): #1e3a8a (진한 파랑)
    // 아침 (6-12시): #3b82f6 → #fbbf24 (파랑 → 노랑)
    // 정오 (12시): #fbbf24 (노랑)
    // 오후 (12-18시): #f97316 (주황)
    // 저녁 (18시 이후): #1e3a8a (진한 파랑)
    
    if (totalMinutes < 360) { // 0-6시: 새벽
      return '#1e3a8a';
    } else if (totalMinutes < 720) { // 6-12시: 아침 (파랑 → 노랑)
      const ratio = (totalMinutes - 360) / 360; // 0 to 1
      return interpolateColor('#3b82f6', '#fbbf24', ratio);
    } else if (totalMinutes < 1080) { // 12-18시: 오후 (노랑 → 주황)
      const ratio = (totalMinutes - 720) / 360; // 0 to 1
      return interpolateColor('#fbbf24', '#f97316', ratio);
    } else { // 18시 이후: 저녁
      return '#1e3a8a';
    }
  };

  // Interpolate between two hex colors
  const interpolateColor = (color1: string, color2: string, ratio: number): string => {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);
    
    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);
    
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Get current shadow color based on current time
  const getCurrentShadowColor = (): string => {
    if (!currentTime) return '#6b21a8';
    return getTimeBasedColor(currentTime);
  };

  // Calculate sun position on map (visual representation)
  const getSunPosition = () => {
    if (!location || !currentDataPoint) return null;

    const sunAzimuth = currentDataPoint.sun.azimuth;
    const sunAltitude = currentDataPoint.sun.altitude;

    // Distance from center based on altitude (higher = closer to center)
    const distance = (90 - sunAltitude) / 90 * 0.01; // ~1.11km max (0.01°)

    // Convert azimuth to radians (0° = North, clockwise)
    const azimuthRad = (sunAzimuth * Math.PI) / 180;

    // Calculate offset (simplified flat projection)
    const latOffset = distance * Math.cos(azimuthRad);
    const lonOffset = distance * Math.sin(azimuthRad) / Math.cos(location.lat * Math.PI / 180);

    return {
      lat: location.lat + latOffset,
      lon: location.lon + lonOffset
    };
  };

  const sunPos = getSunPosition();

  useEffect(() => {
    if (location) {
      setViewState({
        longitude: location.lon,
        latitude: location.lat,
        zoom: 14
      });

      let cancelled = false;
      reverseGeocode(location.lat, location.lon).then((address) => {
        if (!cancelled && address) {
          setAddressName(address);
        }
      });
      return () => {
        cancelled = true;
      };
    }
  }, [location]);

  const handleMapClick = (event: { lngLat: { lng: number; lat: number } }) => {
    const { lng, lat } = event.lngLat;
    onLocationChange(lat, lng);
  };

  return (
    <div ref={containerRef} className="absolute inset-0 h-full min-h-[240px] w-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%' }}
        onLoad={(e) => {
          try {
            e.target.resize();
          } catch {
            /* ignore */
          }
        }}
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" />
        
        {/* Geolocate Control - geolocation이 지원되는 경우에만 표시 */}
        {geolocationSupported && (
          <GeolocateControl
            position="top-right"
            trackUserLocation={false}
            onGeolocate={(e) => {
              try {
                const { latitude, longitude } = e.coords;
                if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                  return;
                }
                if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                  return;
                }
                onLocationChange(latitude, longitude);
              } catch {
                // 에러를 조용히 무시 (사이드바의 현재 위치 버튼 사용)
              }
            }}
            onError={() => {
              // CoreLocation 에러를 조용히 무시
              // 브라우저 콘솔에 에러가 표시될 수 있지만, 애플리케이션 동작에는 영향 없음
              // 사이드바의 "현재 위치 사용" 버튼을 사용하면 됨
            }}
          />
        )}

        {/* True sun path (azimuth projection) */}
        {location && solarSeries && solarSeries.length > 1 && (() => {
          const sunCoords = solarSeries
            .filter((p) => p.sun.altitude > 0)
            .map((p) => {
              const distance = ((90 - p.sun.altitude) / 90) * 0.012;
              const azimuthRad = (p.sun.azimuth * Math.PI) / 180;
              const latOffset = distance * Math.cos(azimuthRad);
              const lonOffset =
                (distance * Math.sin(azimuthRad)) /
                Math.cos((location.lat * Math.PI) / 180);
              return [location.lon + lonOffset, location.lat + latOffset];
            });
          if (sunCoords.length < 2) return null;
          return (
            <Source
              id="sun-path"
              type="geojson"
              data={{
                type: 'Feature',
                properties: { kind: 'sun-path' },
                geometry: { type: 'LineString', coordinates: sunCoords },
              }}
            >
              <Layer
                id="sun-path-line"
                type="line"
                paint={{
                  'line-color': '#f59e0b',
                  'line-width': 3,
                  'line-opacity': 0.85,
                }}
              />
            </Source>
          );
        })()}

        {/* Shadow tip trail (distinct from sun path) */}
        {location && solarSeries && solarSeries.length > 1 && (() => {
          const tipCoords = solarSeries
            .filter((p) => p.shadow?.coordinates && p.shadow.coordinates.length > 1)
            .map((p) => p.shadow!.coordinates![1]);
          if (tipCoords.length < 2) return null;
          return (
            <Source
              id="shadow-tip"
              type="geojson"
              data={{
                type: 'Feature',
                properties: { kind: 'shadow-tip' },
                geometry: { type: 'LineString', coordinates: tipCoords },
              }}
            >
              <Layer
                id="shadow-tip-line"
                type="line"
                paint={{
                  'line-color': '#64748b',
                  'line-width': 2,
                  'line-opacity': 0.55,
                  'line-dasharray': [2, 2],
                }}
              />
            </Source>
          );
        })()}

        {/* Shadow footprint polygon */}
        {location &&
          currentDataPoint?.shadow?.polygon &&
          currentDataPoint.shadow.polygon.length >= 3 && (
            <Source
              id="shadow-poly"
              type="geojson"
              data={{
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Polygon',
                  coordinates: [
                    [
                      ...currentDataPoint.shadow.polygon,
                      currentDataPoint.shadow.polygon[0],
                    ],
                  ],
                },
              }}
            >
              <Layer
                id="shadow-poly-fill"
                type="fill"
                paint={{
                  'fill-color': getCurrentShadowColor(),
                  'fill-opacity': 0.22,
                }}
              />
              <Layer
                id="shadow-poly-outline"
                type="line"
                paint={{
                  'line-color': getCurrentShadowColor(),
                  'line-width': 1.5,
                  'line-opacity': 0.7,
                }}
              />
            </Source>
          )}

        {/* Shadow Line (if available) */}
        {location && currentDataPoint?.shadow && currentDataPoint.shadow.coordinates && (
          <Source
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: currentDataPoint.shadow.coordinates
              }
            }}
          >
            <Layer
              type="line"
              paint={{
                'line-color': getCurrentShadowColor(),
                'line-width': 4,
                'line-opacity': 0.7
              }}
            />
          </Source>
        )}

        {/* Shadow Endpoint Marker */}
        {location && currentDataPoint?.shadow && currentDataPoint.shadow.coordinates && currentDataPoint.shadow.coordinates.length > 1 && (
          <Marker
            longitude={currentDataPoint.shadow.coordinates[1][0]}
            latitude={currentDataPoint.shadow.coordinates[1][1]}
            anchor="center"
          >
            <div className="w-3 h-3 bg-purple-600 rounded-full border-2 border-white shadow-lg" />
          </Marker>
        )}

        {/* Location Marker */}
        {location && (
          <Marker
            longitude={location.lon}
            latitude={location.lat}
            anchor="bottom"
          >
            <div className="relative">
              <MapPin className="w-8 h-8 text-red-500 drop-shadow-lg" fill="red" />
            </div>
          </Marker>
        )}

        {/* Sun Position Marker */}
        {sunPos && currentDataPoint && currentDataPoint.sun.altitude > 0 && (
          <Marker
            longitude={sunPos.lon}
            latitude={sunPos.lat}
            anchor="center"
          >
            <div className="relative">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold shadow-lg whitespace-nowrap">
                ☀️ {currentDataPoint.sun.altitude.toFixed(1)}°
              </div>
              <div className="w-12 h-12 bg-yellow-400 rounded-full border-4 border-yellow-300 shadow-2xl flex items-center justify-center animate-pulse">
                <Sun className="w-6 h-6 text-yellow-900" />
              </div>
            </div>
          </Marker>
        )}
      </Map>

      {/* Map Legend — hud 모드에서는 하단 HUD와 겹치지 않게 좌상단 */}
      <div
        className={`absolute z-10 rounded-lg bg-white/90 px-3 py-2 text-xs shadow-lg backdrop-blur-sm dark:bg-gray-800/90 ${
          overlayMode === 'hud' ? 'left-3 top-3' : 'bottom-4 right-4'
        }`}
      >
        <div className="mb-2 text-center font-semibold text-gray-900 dark:text-white">{t('map.legend')}</div>
        <div className="space-y-1.5 text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-red-500" fill="red" />
            <span>{t('map.referencePoint')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-yellow-500" />
            <span>{t('map.sunPosition')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 bg-amber-500" />
            <span>{t('mapLegend.sunPath')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 border-t-2 border-dashed border-slate-500" />
            <span>{t('mapLegend.shadowTip')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 bg-purple-600" />
            <span>{t('map.currentShadow')}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-1 w-4" viewBox="0 0 16 2" preserveAspectRatio="none">
              <line x1="0" y1="1" x2="16" y2="1" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" strokeOpacity="0.7" />
            </svg>
            <span>{t('map.shadowTrajectory')}</span>
          </div>
        </div>
      </div>

      {/* Map Info Overlay — 데스크톱 HUD가 수치를 담당할 때는 숨김 */}
      {overlayMode !== 'hud' && (
      <div className="absolute bottom-4 left-4 z-10 max-w-sm rounded-lg bg-white/90 px-4 py-3 text-xs shadow-lg backdrop-blur-sm dark:bg-gray-800/90">
        <div className="space-y-1 text-gray-700 dark:text-gray-300">
          {location ? (
            <>
              <div>
                <span className="font-semibold">📍 {t('map.coordinates')}:</span>{' '}
                {Math.abs(location.lat).toFixed(6)}°{location.lat >= 0 ? 'N' : 'S'},{' '}
                {Math.abs(location.lon).toFixed(6)}°{location.lon >= 0 ? 'E' : 'W'}
              </div>
              {addressName && (
                <div className="truncate text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">🏠 {t('map.address')}:</span>{' '}
                  {addressName}
                </div>
              )}
              {currentDataPoint && (
                <>
                  <div className="my-2 border-t border-gray-300 pt-2 dark:border-gray-600">
                    <div className="text-yellow-700 dark:text-yellow-400">
                      <span className="font-semibold">☀️ {t('map.sun')}:</span>{' '}
                      {t('map.altitude')} {currentDataPoint.sun.altitude.toFixed(1)}° / 
                      {t('map.direction')} {currentDataPoint.sun.azimuth.toFixed(1)}°
                    </div>
                    {currentDataPoint.shadow && (
                      <div className="mt-1 text-purple-700 dark:text-purple-400">
                        <span className="font-semibold">🌒 {t('map.shadow')}:</span>{' '}
                        {typeof currentDataPoint.shadow.length === 'number' 
                        ? (currentDataPoint.shadow.length === Infinity 
                            ? t('map.infinite')
                            : `${currentDataPoint.shadow.length.toFixed(2)}m`)
                        : 'N/A'}
                    {typeof currentDataPoint.shadow.direction === 'number' && 
                      ` / ${currentDataPoint.shadow.direction.toFixed(0)}°`}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <span className="text-gray-500">{t('map.clickToSelect')}</span>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
