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
}

export default function MapComponent({ location, onLocationChange, currentDataPoint, solarSeries }: MapComponentProps) {
  const [viewState, setViewState] = useState({
    longitude: location?.lon || 126.9780,
    latitude: location?.lat || 37.5665,
    zoom: 12
  });

  const [addressName, setAddressName] = useState<string | null>(null);

  // Calculate sun position on map (visual representation)
  const getSunPosition = () => {
    if (!location || !currentDataPoint) return null;

    const sunAzimuth = currentDataPoint.sun.azimuth;
    const sunAltitude = currentDataPoint.sun.altitude;

    // Distance from center based on altitude (higher = closer to center)
    const distance = (90 - sunAltitude) / 90 * 0.01; // ~1km max

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
                'line-color': '#6b21a8',
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
