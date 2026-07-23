'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import type { Map as MaplibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Sun, Box, Mountain } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';
import { reverseGeocode } from '@/lib/geocoding';
import type { SolarDataPoint } from '@/lib/api';
import {
  OPENFREEMAP_LIBERTY,
  TERRAIN_DEM,
  sunColumnFeature,
  sunPathColumnsFeatureCollection,
  sunRayLine,
  shadowSlabFeature,
  skyForTime,
  prefersReducedMotion,
} from '@/lib/map-3d-config';

interface MapComponentProps {
  location: { lat: number; lon: number } | null;
  onLocationChange: (lat: number, lon: number) => void;
  currentDataPoint?: SolarDataPoint | null;
  solarSeries?: SolarDataPoint[] | null;
  currentTime?: string;
  overlayMode?: 'default' | 'hud';
}

type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
};

function applyTerrainAndSky(
  map: MaplibreMap,
  enabled: boolean,
  exaggeration: number,
  hm: string | undefined,
  showBuildings: boolean
) {
  try {
    if (enabled) {
      if (!map.getSource(TERRAIN_DEM.id)) {
        map.addSource(TERRAIN_DEM.id, {
          type: 'raster-dem',
          tiles: TERRAIN_DEM.tiles,
          tileSize: TERRAIN_DEM.tileSize,
          maxzoom: TERRAIN_DEM.maxzoom,
          encoding: TERRAIN_DEM.encoding,
        });
      }
      map.setTerrain({ source: TERRAIN_DEM.id, exaggeration });
      try {
        map.setSky(skyForTime(hm));
      } catch {
        /* sky unsupported */
      }
    } else {
      map.setTerrain(null);
      try {
        if (typeof map.setSky === 'function') {
          map.setSky({
            'sky-color': '#cce0f0',
            'sky-horizon-blend': 0.5,
            'horizon-color': '#ffffff',
            'horizon-fog-blend': 0.5,
            'fog-color': '#ffffff',
            'fog-ground-blend': 0,
          });
        }
      } catch {
        /* ignore */
      }
    }
    if (map.getLayer('building-3d')) {
      map.setLayoutProperty('building-3d', 'visibility', showBuildings ? 'visible' : 'none');
    }
    if (map.getLayer('building')) {
      map.setPaintProperty('building', 'fill-opacity', showBuildings ? 1 : 0.15);
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Map3D] terrain/sky', err);
    }
  }
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

  const [isNarrow, setIsNarrow] = useState(false);
  const [view3d, setView3d] = useState(false);
  const [showTerrain, setShowTerrain] = useState(true);
  const [showBuildings, setShowBuildings] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  const [viewState, setViewState] = useState<ViewState>({
    longitude: location?.lon || 126.978,
    latitude: location?.lat || 37.5665,
    zoom: 14,
    pitch: 0,
    bearing: 0,
  });

  const [addressName, setAddressName] = useState<string | null>(null);
  const [geolocationSupported, setGeolocationSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setGeolocationSupported(true);
    }
    const check = () => setIsNarrow(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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

  const exaggeration = isNarrow ? 1.05 : 1.35;
  const terrainOn = view3d && showTerrain;

  const sync3d = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || !mapReady) return;
    applyTerrainAndSky(map, terrainOn, exaggeration, currentTime, showBuildings);
  }, [terrainOn, exaggeration, currentTime, showBuildings, mapReady]);

  useEffect(() => {
    sync3d();
  }, [sync3d]);

  useEffect(() => {
    setViewState((vs) => ({
      ...vs,
      pitch: view3d ? (isNarrow ? 45 : 58) : 0,
      bearing: view3d ? vs.bearing : 0,
      zoom: Math.max(vs.zoom, view3d ? 14 : vs.zoom),
    }));
  }, [view3d, isNarrow]);

  const getTimeBasedColor = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes < 360) return '#1e3a8a';
    if (totalMinutes < 720) {
      const ratio = (totalMinutes - 360) / 360;
      return interpolateColor('#3b82f6', '#fbbf24', ratio);
    }
    if (totalMinutes < 1080) {
      const ratio = (totalMinutes - 720) / 360;
      return interpolateColor('#fbbf24', '#f97316', ratio);
    }
    return '#1e3a8a';
  };

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

  const getCurrentShadowColor = (): string => {
    if (!currentTime) return '#4c1d95';
    return getTimeBasedColor(currentTime);
  };

  const getSunPosition = () => {
    if (!location || !currentDataPoint) return null;
    const sunAzimuth = currentDataPoint.sun.azimuth;
    const sunAltitude = currentDataPoint.sun.altitude;
    const distance = ((90 - sunAltitude) / 90) * 0.01;
    const azimuthRad = (sunAzimuth * Math.PI) / 180;
    const latOffset = distance * Math.cos(azimuthRad);
    const lonOffset =
      (distance * Math.sin(azimuthRad)) / Math.cos((location.lat * Math.PI) / 180);
    return { lat: location.lat + latOffset, lon: location.lon + lonOffset };
  };

  const sunPos = getSunPosition();

  const sunColumn = useMemo(() => {
    if (!location || !currentDataPoint || currentDataPoint.sun.altitude <= 0) return null;
    return sunColumnFeature(location, currentDataPoint.sun.altitude, currentDataPoint.sun.azimuth);
  }, [location, currentDataPoint]);

  const sunRay = useMemo(() => {
    if (!location || !currentDataPoint || currentDataPoint.sun.altitude <= 0) return null;
    return sunRayLine(location, currentDataPoint.sun.altitude, currentDataPoint.sun.azimuth);
  }, [location, currentDataPoint]);

  const sunPath3d = useMemo(() => {
    if (!location || !solarSeries || solarSeries.length < 2) return null;
    return sunPathColumnsFeatureCollection(location, solarSeries);
  }, [location, solarSeries]);

  const shadowSlab = useMemo(() => {
    const poly = currentDataPoint?.shadow?.polygon;
    if (!poly || poly.length < 3) return null;
    return shadowSlabFeature(poly, view3d ? 3.5 : 0.5);
  }, [currentDataPoint, view3d]);

  useEffect(() => {
    if (location) {
      setViewState((vs) => ({
        ...vs,
        longitude: location.lon,
        latitude: location.lat,
        zoom: Math.max(vs.zoom, 14),
      }));
      let cancelled = false;
      reverseGeocode(location.lat, location.lon).then((address) => {
        if (!cancelled && address) setAddressName(address);
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

  const ctrlPos = overlayMode === 'hud' ? 'top-left' : 'top-right';

  return (
    <div ref={containerRef} className="absolute inset-0 h-full min-h-[240px] w-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState as ViewState)}
        onClick={handleMapClick}
        mapStyle={OPENFREEMAP_LIBERTY}
        style={{ width: '100%', height: '100%' }}
        maxPitch={85}
        dragRotate={view3d}
        pitchWithRotate={view3d}
        touchPitch={view3d}
        onLoad={(e) => {
          try {
            e.target.resize();
            setMapReady(true);
            applyTerrainAndSky(
              e.target,
              terrainOn,
              exaggeration,
              currentTime,
              showBuildings
            );
          } catch {
            setMapReady(true);
          }
        }}
      >
        <NavigationControl position={ctrlPos as 'top-right'} visualizePitch={view3d} />

        {geolocationSupported && (
          <GeolocateControl
            position={ctrlPos as 'top-right'}
            trackUserLocation={false}
            onGeolocate={(e) => {
              try {
                const { latitude, longitude } = e.coords;
                if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
                if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return;
                onLocationChange(latitude, longitude);
              } catch {
                /* ignore */
              }
            }}
            onError={() => {
              /* ignore */
            }}
          />
        )}

        {/* 2D sun path (ground projection) */}
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
                properties: {},
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

        {/* 3D sun path columns (altitude → height) */}
        {view3d && sunPath3d && sunPath3d.features.length > 0 && (
          <Source id="sun-path-3d" type="geojson" data={sunPath3d}>
            <Layer
              id="sun-path-3d-ex"
              type="fill-extrusion"
              paint={{
                'fill-extrusion-color': '#fbbf24',
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.35,
              }}
            />
          </Source>
        )}

        {sunRay && (
          <Source id="sun-ray" type="geojson" data={sunRay}>
            <Layer
              id="sun-ray-line"
              type="line"
              paint={{
                'line-color': '#fde68a',
                'line-width': view3d ? 3 : 2,
                'line-opacity': 0.75,
                'line-dasharray': [1, 1.2],
              }}
            />
          </Source>
        )}

        {view3d && sunColumn && (
          <Source id="sun-column" type="geojson" data={sunColumn}>
            <Layer
              id="sun-column-ex"
              type="fill-extrusion"
              paint={{
                'fill-extrusion-color': '#f59e0b',
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.85,
              }}
            />
          </Source>
        )}

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
                properties: {},
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
                  'fill-opacity': 0.28,
                }}
              />
              <Layer
                id="shadow-poly-outline"
                type="line"
                paint={{
                  'line-color': getCurrentShadowColor(),
                  'line-width': 1.5,
                  'line-opacity': 0.75,
                }}
              />
            </Source>
          )}

        {view3d && shadowSlab && (
          <Source id="shadow-slab" type="geojson" data={shadowSlab}>
            <Layer
              id="shadow-slab-ex"
              type="fill-extrusion"
              paint={{
                'fill-extrusion-color': getCurrentShadowColor(),
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.45,
              }}
            />
          </Source>
        )}

        {location && currentDataPoint?.shadow?.coordinates && (
          <Source
            id="shadow-line"
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: currentDataPoint.shadow.coordinates,
              },
            }}
          >
            <Layer
              id="shadow-line-l"
              type="line"
              paint={{
                'line-color': getCurrentShadowColor(),
                'line-width': 4,
                'line-opacity': 0.75,
              }}
            />
          </Source>
        )}

        {location &&
          currentDataPoint?.shadow?.coordinates &&
          currentDataPoint.shadow.coordinates.length > 1 && (
            <Marker
              longitude={currentDataPoint.shadow.coordinates[1][0]}
              latitude={currentDataPoint.shadow.coordinates[1][1]}
              anchor="center"
            >
              <div className="h-3 w-3 rounded-full border-2 border-white bg-violet-700 shadow-lg" />
            </Marker>
          )}

        {location && (
          <Marker longitude={location.lon} latitude={location.lat} anchor="bottom">
            <div className="relative">
              <MapPin className="h-8 w-8 text-red-500 drop-shadow-lg" fill="red" />
            </div>
          </Marker>
        )}

        {sunPos && currentDataPoint && currentDataPoint.sun.altitude > 0 && (
          <Marker longitude={sunPos.lon} latitude={sunPos.lat} anchor="center">
            <div className="relative">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-yellow-500 px-2 py-1 text-xs font-semibold text-white shadow-lg">
                {currentDataPoint.sun.altitude.toFixed(1)}°
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full border-4 border-yellow-300 bg-yellow-400 shadow-2xl ${
                  prefersReducedMotion() ? '' : 'animate-pulse'
                }`}
              >
                <Sun className="h-6 w-6 text-yellow-900" />
              </div>
            </div>
          </Marker>
        )}
      </Map>

      {/* 3D controls */}
      <div
        className={`absolute z-20 flex flex-col gap-1.5 ${
          overlayMode === 'hud' ? 'right-3 top-3' : 'left-3 top-3'
        }`}
        role="group"
        aria-label={t('map3d.controlsAria')}
      >
        <div className="flex overflow-hidden rounded-xl bg-white/95 shadow-lg ring-1 ring-black/5 dark:bg-slate-900/95">
          <button
            type="button"
            onClick={() => setView3d(false)}
            className={`px-3 py-1.5 text-[11px] font-bold ${
              !view3d ? 'bg-sky-600 text-white' : 'text-ink-muted hover:bg-sky/40'
            }`}
            aria-pressed={!view3d}
          >
            2D
          </button>
          <button
            type="button"
            onClick={() => setView3d(true)}
            className={`px-3 py-1.5 text-[11px] font-bold ${
              view3d ? 'bg-amber-500 text-white' : 'text-ink-muted hover:bg-sky/40'
            }`}
            aria-pressed={view3d}
          >
            3D
          </button>
        </div>
        {view3d && (
          <div className="flex flex-col gap-1 rounded-xl bg-white/95 p-1.5 shadow-lg ring-1 ring-black/5 dark:bg-slate-900/95">
            <button
              type="button"
              onClick={() => setShowTerrain((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-semibold ${
                showTerrain ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100' : 'text-ink-muted'
              }`}
              aria-pressed={showTerrain}
            >
              <Mountain className="h-3.5 w-3.5" aria-hidden />
              {t('map3d.terrain')}
            </button>
            <button
              type="button"
              onClick={() => setShowBuildings((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-semibold ${
                showBuildings ? 'bg-stone-200 text-stone-900 dark:bg-slate-700 dark:text-stone-100' : 'text-ink-muted'
              }`}
              aria-pressed={showBuildings}
            >
              <Box className="h-3.5 w-3.5" aria-hidden />
              {t('map3d.buildings')}
            </button>
          </div>
        )}
      </div>

      <div
        className={`absolute z-10 rounded-lg bg-white/90 px-3 py-2 text-xs shadow-lg backdrop-blur-sm dark:bg-gray-800/90 ${
          overlayMode === 'hud' ? 'bottom-3 left-3' : 'bottom-4 right-4'
        }`}
      >
        <div className="mb-2 text-center font-semibold text-gray-900 dark:text-white">
          {t('map.legend')}
        </div>
        <div className="space-y-1.5 text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-red-500" fill="red" />
            <span>{t('map.referencePoint')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-yellow-500" />
            <span>{t('map.sunPosition')}</span>
          </div>
          {view3d && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-2 rounded-sm bg-amber-500" />
              <span>{t('map3d.sunColumn')}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 bg-amber-500" />
            <span>{t('mapLegend.sunPath')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 border-t-2 border-dashed border-slate-500" />
            <span>{t('mapLegend.shadowTip')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 bg-violet-700" />
            <span>{t('map.currentShadow')}</span>
          </div>
        </div>
      </div>

      {overlayMode !== 'hud' && (
        <div className="absolute bottom-4 left-4 z-10 max-w-sm rounded-lg bg-white/90 px-4 py-3 text-xs shadow-lg backdrop-blur-sm dark:bg-gray-800/90">
          <div className="space-y-1 text-gray-700 dark:text-gray-300">
            {location ? (
              <>
                <div>
                  <span className="font-semibold">{t('map.coordinates')}:</span>{' '}
                  {Math.abs(location.lat).toFixed(6)}°{location.lat >= 0 ? 'N' : 'S'},{' '}
                  {Math.abs(location.lon).toFixed(6)}°{location.lon >= 0 ? 'E' : 'W'}
                </div>
                {addressName && (
                  <div className="truncate text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">{t('map.address')}:</span> {addressName}
                  </div>
                )}
                {currentDataPoint && (
                  <div className="my-2 border-t border-gray-300 pt-2 dark:border-gray-600">
                    <div className="text-yellow-700 dark:text-yellow-400">
                      <span className="font-semibold">{t('map.sun')}:</span>{' '}
                      {t('map.altitude')} {currentDataPoint.sun.altitude.toFixed(1)}° /{' '}
                      {t('map.direction')} {currentDataPoint.sun.azimuth.toFixed(1)}°
                    </div>
                    {currentDataPoint.shadow && (
                      <div className="mt-1 text-purple-700 dark:text-purple-400">
                        <span className="font-semibold">{t('map.shadow')}:</span>{' '}
                        {typeof currentDataPoint.shadow.length === 'number'
                          ? currentDataPoint.shadow.length === Infinity
                            ? t('map.infinite')
                            : `${currentDataPoint.shadow.length.toFixed(2)}m`
                          : 'N/A'}
                        {typeof currentDataPoint.shadow.direction === 'number' &&
                          ` / ${currentDataPoint.shadow.direction.toFixed(0)}°`}
                      </div>
                    )}
                  </div>
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
