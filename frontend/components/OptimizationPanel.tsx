'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, Sun, Moon, AlertTriangle } from 'lucide-react';
import { optimizePeriods, type SolarCalculationResponse, type OptimizationResult } from '@/lib/api';

interface OptimizationPanelProps {
  solarData: SolarCalculationResponse | null;
}

export default function OptimizationPanel({ solarData }: OptimizationPanelProps) {
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (solarData && solarData.series.length > 0) {
      setIsLoading(true);
      setError(null);
      
      optimizePeriods(solarData)
        .then((result) => {
          setOptimization(result);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : '최적화 분석 실패');
          setIsLoading(false);
        });
    } else {
      setOptimization(null);
    }
  }, [solarData]);

  if (!solarData) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-3">
          <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
          <span className="text-sm text-gray-700 dark:text-gray-300">최적화 분석 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
        </div>
      </div>
    );
  }

  if (!optimization) {
    return null;
  }

  const opt = optimization.optimization;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
      <div className="flex items-center space-x-2 mb-4">
        <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          최적 시간대 추천
        </h3>
      </div>

      <div className="space-y-3">
        {/* Max Irradiance */}
        {opt.max_irradiance_period && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                최대 일사량 시간
              </span>
            </div>
            <div className="text-lg font-bold text-orange-900 dark:text-orange-300">
              {opt.max_irradiance_period.time}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {Math.round(opt.max_irradiance_period.ghi)} W/m² · 고도 {opt.max_irradiance_period.altitude.toFixed(1)}°
            </div>
          </div>
        )}

        {/* Max Altitude */}
        {opt.max_altitude_period && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center space-x-2 mb-2">
              <Sun className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                최대 태양 고도
              </span>
            </div>
            <div className="text-lg font-bold text-yellow-900 dark:text-yellow-300">
              {opt.max_altitude_period.time}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {opt.max_altitude_period.altitude.toFixed(1)}° · {Math.round(opt.max_altitude_period.ghi)} W/m²
            </div>
          </div>
        )}

        {/* Min Shadow */}
        {opt.min_shadow_period && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2 mb-2">
              <Moon className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                최소 그림자 시간
              </span>
            </div>
            <div className="text-lg font-bold text-green-900 dark:text-green-300">
              {opt.min_shadow_period.time}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {opt.min_shadow_period.shadow_length.toFixed(2)} m · {Math.round(opt.min_shadow_period.ghi)} W/m²
            </div>
          </div>
        )}

        {/* Optimal Collection Periods */}
        {opt.optimal_solar_collection_periods.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              최적 태양광 수집 시간대
            </div>
            <div className="space-y-2">
              {opt.optimal_solar_collection_periods.map((period, idx) => (
                <div key={idx} className="text-xs">
                  <span className="font-medium text-blue-900 dark:text-blue-300">
                    {period.start} ~ {period.end}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    ({period.duration_hours.toFixed(1)}시간, 평균 {Math.round(period.average_ghi)} W/m²)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shadow Interference Periods */}
        {opt.shadow_interference_periods.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                그림자 간섭 시간대
              </span>
            </div>
            <div className="space-y-2">
              {opt.shadow_interference_periods.map((period, idx) => (
                <div key={idx} className="text-xs">
                  <span className="font-medium text-purple-900 dark:text-purple-300">
                    {period.start} ~ {period.end}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    ({period.duration_hours.toFixed(1)}시간)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

