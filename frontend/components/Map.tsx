'use client';

import { useEffect, useState } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Sun } from 'lucide-react';
import { reverseGeocode } from '@/lib/geocoding';
import type { SolarDataPoint } from '@/lib/api';

interface MapComponentProps {
  location: {lat: number; lon: number} | null;
  onLocationChange: (lat: number, lon: number) => void;
  currentDataPoint?: SolarDataPoint | null;
  solarSeries?: SolarDataPoint[] | null;
  currentTime?: string;
}

export default function MapComponent({ location, onLocationChange, currentDataPoint, solarSeries, currentTime }: MapComponentProps) {
  const [viewState, setViewState] = useState({
    longitude: location?.lon || 126.9780,
    latitude: location?.lat || 37.5665,
    zoom: 12
  });

  const [addressName, setAddressName] = useState<string | null>(null);

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

      // Reverse geocode to get address
      reverseGeocode(location.lat, location.lon).then((address) => {
        if (address) {
          setAddressName(address);
        }
      });
    }
  }, [location]);

  const handleMapClick = (event: { lngLat: { lng: number; lat: number } }) => {
    const { lng, lat } = event.lngLat;
    onLocationChange(lat, lng);
  };

  return (
    <div className="w-full h-full relative">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle={{
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [
            {
              id: 'osm',
              type: 'raster',
              source: 'osm'
            }
          ]
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" />
        
        {/* Geolocate Control */}
        <GeolocateControl
          position="top-right"
          trackUserLocation
          onGeolocate={(e) => {
            onLocationChange(e.coords.latitude, e.coords.longitude);
          }}
        />

        {/* Sun Path Polyline (if series available) */}
        {location && solarSeries && solarSeries.length > 1 && (
          <Source
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: solarSeries
                  .filter(p => p.shadow && p.shadow.coordinates && p.shadow.coordinates.length > 1)
                  .map(p => p.shadow!.coordinates![1])
              }
            }}
          >
            <Layer
              type="line"
              paint={{
                'line-color': '#f59e0b',
                'line-width': 2,
                'line-opacity': 0.6,
                'line-dasharray': [2, 2]
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

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg text-xs z-10">
        <div className="font-semibold text-gray-900 dark:text-white mb-2 text-center">범례</div>
        <div className="space-y-1.5 text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-500" fill="red" />
            <span>기준점 (위치)</span>
          </div>
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-yellow-500" />
            <span>태양 위치</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-purple-600" />
            <span>현재 그림자</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-orange-500 border-dashed border-t border-orange-500" />
            <span>하루 그림자 궤적</span>
          </div>
        </div>
      </div>

      {/* Map Info Overlay */}
      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg text-xs max-w-sm">
        <div className="text-gray-700 dark:text-gray-300 space-y-1">
          {location ? (
            <>
              <div>
                <span className="font-semibold">📍 좌표:</span>{' '}
                {location.lat.toFixed(6)}°N, {location.lon.toFixed(6)}°E
              </div>
              {addressName && (
                <div className="text-gray-600 dark:text-gray-400 truncate">
                  <span className="font-semibold">🏠 주소:</span>{' '}
                  {addressName}
                </div>
              )}
              {currentDataPoint && (
                <>
                  <div className="border-t border-gray-300 dark:border-gray-600 my-2 pt-2">
                    <div className="text-yellow-700 dark:text-yellow-400">
                      <span className="font-semibold">☀️ 태양:</span>{' '}
                      고도 {currentDataPoint.sun.altitude.toFixed(1)}° / 
                      방위 {currentDataPoint.sun.azimuth.toFixed(1)}°
                    </div>
                    {currentDataPoint.shadow && (
                      <div className="text-purple-700 dark:text-purple-400 mt-1">
                        <span className="font-semibold">🌒 그림자:</span>{' '}
                        {typeof currentDataPoint.shadow.length === 'number' 
                        ? (currentDataPoint.shadow.length === Infinity 
                            ? '무한대' 
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
            <span className="text-gray-500">지도를 클릭하여 위치를 선택하세요</span>
          )}
        </div>
      </div>
    </div>
  );
}
