'use client';

import { useState } from 'react';
import { Loader2, BarChart3, Calendar } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';
import { calculateBatch, type SolarCalculationRequest, type SolarSummary } from '@/lib/api';

interface SeasonComparisonProps {
  location?: { lat: number; lon: number } | null;
  objectHeight: number;
}

export default function SeasonComparison({
  location,
  objectHeight
}: SeasonComparisonProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<Array<{season: {name: string; date: string; emoji: string}; summary: SolarSummary; maxAltitude: number; dayLength: string}>>([]);
  const [error, setError] = useState<string | null>(null);

  const seasons = [
    { name: '봄', date: '2025-03-20', emoji: '🌸' },
    { name: '여름', date: '2025-06-21', emoji: '☀️' },
    { name: '가을', date: '2025-09-23', emoji: '🍂' },
    { name: '겨울', date: '2025-12-21', emoji: '❄️' }
  ];

  const handleCompare = async () => {
    if (!location) return;

    setIsCalculating(true);
    setError(null);
    setResults([]);

    try {
      const requests: SolarCalculationRequest[] = seasons.map(season => ({
        location: {
          lat: location.lat,
          lon: location.lon,
          altitude: 0
        },
        datetime: {
          date: season.date,
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
      }));

      const response = await calculateBatch(requests, true);
      
      const seasonResults = response.results
        .filter(item => item.success && item.result)
        .map((item, index) => ({
          season: seasons[index],
          summary: item.result!.summary,
          maxAltitude: Math.max(...item.result!.series.map(s => s.sun.altitude)),
          dayLength: item.result!.summary.day_length
        }));

      setResults(seasonResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : '계절 비교 실패');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <BarChart3 className="w-4 h-4 text-blue-600" />
        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          계절별 비교
        </h3>
      </div>

      {/* Info */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-400">
          🌍 춘분, 하지, 추분, 동지의 일조량을 한 번에 비교합니다.
        </p>
      </div>

      {/* Calculate Button */}
      <button
        onClick={handleCompare}
        disabled={isCalculating || !location}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
      >
        {isCalculating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>계산 중... (4개 계절)</span>
          </>
        ) : (
          <>
            <Calendar className="w-4 h-4" />
            <span>계절 비교 시작</span>
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-xs text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            비교 결과
          </div>
          
          {/* Max Altitude Comparison */}
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              최대 태양 고도
            </div>
            <div className="space-y-2">
              {results.map((item, idx) => {
                const maxAltitude = Math.max(...results.map(r => r.maxAltitude));
                const percentage = (item.maxAltitude / maxAltitude) * 100;
                
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 dark:text-gray-300">
                        {item.season.emoji} {item.season.name}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {item.maxAltitude.toFixed(1)}°
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day Length Comparison */}
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              일조 시간
            </div>
            <div className="space-y-2">
              {results.map((item, idx) => {
                const hours = item.dayLength.match(/(\d+):/)?.[1] || '0';
                const minutes = item.dayLength.match(/:(\d+)/)?.[1] || '0';
                const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
                const maxMinutes = Math.max(...results.map(r => {
                  const h = r.dayLength.match(/(\d+):/)?.[1] || '0';
                  const m = r.dayLength.match(/:(\d+)/)?.[1] || '0';
                  return parseInt(h) * 60 + parseInt(m);
                }));
                const percentage = (totalMinutes / maxMinutes) * 100;
                
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 dark:text-gray-300">
                        {item.season.emoji} {item.season.name}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {item.dayLength}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-600 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

