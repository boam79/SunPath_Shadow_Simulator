'use client';

import { useState, useEffect, useMemo } from 'react';
import { Lightbulb, TrendingUp, Sun, Moon, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';
import { optimizePeriods, type SolarCalculationResponse, type OptimizationResult } from '@/lib/api';

interface OptimizationPanelProps {
  solarData: SolarCalculationResponse | null;
}

export default function OptimizationPanel({ solarData }: OptimizationPanelProps) {
  const { t } = useI18n();
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [useBackend, setUseBackend] = useState(true);

  // Fallback: Calculate optimization locally if API fails
  const localOptimization = useMemo(() => {
    if (!solarData || solarData.series.length === 0) return null;

    const series = solarData.series;
    let maxGhi = -1;
    let maxGhiTime = null;
    let maxAltitude = -1;
    let maxAltitudeTime = null;
    let minShadow = Infinity;
    let minShadowTime = null;
    const optimalPeriods: Array<{ time: string; ghi: number; altitude: number; dni: number }> = [];
    const shadowPeriods: Array<{ time: string; shadow_length: number; ghi: number }> = [];

    series.forEach((point) => {
      const time = new Date(point.timestamp);
      const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      // Max irradiance
      if (point.irradiance?.ghi && point.irradiance.ghi > maxGhi) {
        maxGhi = point.irradiance.ghi;
        maxGhiTime = {
          time: timeStr,
          ghi: maxGhi,
          altitude: point.sun.altitude
        };
      }

      // Max altitude
      if (point.sun.altitude > maxAltitude) {
        maxAltitude = point.sun.altitude;
        maxAltitudeTime = {
          time: timeStr,
          altitude: maxAltitude,
          ghi: point.irradiance?.ghi || 0
        };
      }

      // Min shadow
      if (point.shadow?.length && typeof point.shadow.length === 'number' && point.shadow.length > 0 && point.shadow.length < minShadow) {
        minShadow = point.shadow.length;
        minShadowTime = {
          time: timeStr,
          shadow_length: minShadow,
          ghi: point.irradiance?.ghi || 0
        };
      }

      // Optimal periods (GHI > 600)
      if (point.irradiance?.ghi && point.irradiance.ghi > 600) {
        optimalPeriods.push({
          time: timeStr,
          ghi: point.irradiance.ghi,
          altitude: point.sun.altitude,
          dni: point.irradiance.dni || 0
        });
      }

      // Shadow interference (shadow > 10m)
      if (point.shadow?.length && typeof point.shadow.length === 'number' && point.shadow.length > 10 && point.shadow.length !== Infinity) {
        shadowPeriods.push({
          time: timeStr,
          shadow_length: point.shadow.length,
          ghi: point.irradiance?.ghi || 0
        });
      }
    });

    // Find continuous periods
    const findContinuous = (periods: Array<{ time: string; ghi: number }>) => {
      if (periods.length === 0) return [];
      const sorted = [...periods].sort((a, b) => {
        const [h1, m1] = a.time.split(':').map(Number);
        const [h2, m2] = b.time.split(':').map(Number);
        return (h1 * 60 + m1) - (h2 * 60 + m2);
      });

      const continuous: Array<{ start: string; end: string; average_ghi: number; duration_hours: number }> = [];
      let start = sorted[0].time;
      let end = sorted[0].time;
      let sumGhi = sorted[0].ghi;
      let count = 1;

      for (let i = 1; i < sorted.length; i++) {
        const [h1, m1] = sorted[i - 1].time.split(':').map(Number);
        const [h2, m2] = sorted[i].time.split(':').map(Number);
        const diff = (h2 * 60 + m2) - (h1 * 60 + m1);

        if (diff <= 120) {
          end = sorted[i].time;
          sumGhi += sorted[i].ghi;
          count++;
        } else {
          if (count > 0) {
            const [sh, sm] = start.split(':').map(Number);
            const [eh, em] = end.split(':').map(Number);
            const duration = ((eh * 60 + em) - (sh * 60 + sm)) / 60;
            continuous.push({
              start,
              end,
              average_ghi: sumGhi / count,
              duration_hours: duration
            });
          }
          start = sorted[i].time;
          end = sorted[i].time;
          sumGhi = sorted[i].ghi;
          count = 1;
        }
      }

      if (count > 0) {
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const duration = ((eh * 60 + em) - (sh * 60 + sm)) / 60;
        continuous.push({
          start,
          end,
          average_ghi: sumGhi / count,
          duration_hours: duration
        });
      }

      return continuous;
    };

    return {
      status: 'success',
      optimization: {
        max_irradiance_period: maxGhiTime,
        max_altitude_period: maxAltitudeTime,
        min_shadow_period: minShadow !== Infinity ? minShadowTime : null,
        optimal_solar_collection_periods: findContinuous(optimalPeriods),
        shadow_interference_periods: findContinuous(shadowPeriods)
      }
    } as OptimizationResult;
  }, [solarData]);

  useEffect(() => {
    if (solarData && solarData.series.length > 0) {
      // Try backend first, fallback to local calculation
      if (useBackend) {
        setIsLoading(true);
        
        optimizePeriods(solarData)
          .then((result) => {
            setOptimization(result);
            setIsLoading(false);
          })
          .catch((err) => {
            // Silently fallback to local calculation
            // 개발 모드에서만 경고 출력
            if (process.env.NODE_ENV === 'development') {
              console.warn('최적화 API 실패, 로컬 계산으로 전환:', err);
            }
            setUseBackend(false);
            setIsLoading(false);
            // Use local calculation immediately
            if (localOptimization) {
              setOptimization(localOptimization);
            }
          });
      } else {
        // Use local calculation
        if (localOptimization) {
          setOptimization(localOptimization);
        }
      }
    } else {
      setOptimization(null);
    }
  }, [solarData, useBackend, localOptimization]);

  if (!solarData) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-3">
          <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
          <span className="text-sm text-gray-700 dark:text-gray-300">{t('optimization.analysis')}</span>
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
          {t('optimization.recommendations')}
        </h3>
      </div>

      <div className="space-y-3">
        {/* Max Irradiance */}
        {opt.max_irradiance_period && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {t('optimization.maxIrradiance')}
              </span>
            </div>
            <div className="text-lg font-bold text-orange-900 dark:text-orange-300">
              {opt.max_irradiance_period.time}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {Math.round(opt.max_irradiance_period.ghi)} W/m² {t('optimization.at')} {t('optimization.altitudeUnit')} {opt.max_irradiance_period.altitude.toFixed(1)}°
            </div>
          </div>
        )}

        {/* Max Altitude */}
        {opt.max_altitude_period && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center space-x-2 mb-2">
              <Sun className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {t('optimization.maxSolarAltitude')}
              </span>
            </div>
            <div className="text-lg font-bold text-yellow-900 dark:text-yellow-300">
              {opt.max_altitude_period.time}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {opt.max_altitude_period.altitude.toFixed(1)}° {t('optimization.at')} {Math.round(opt.max_altitude_period.ghi)} W/m²
            </div>
          </div>
        )}

        {/* Min Shadow */}
        {opt.min_shadow_period && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2 mb-2">
              <Moon className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {t('optimization.minShadow')}
              </span>
            </div>
            <div className="text-lg font-bold text-green-900 dark:text-green-300">
              {opt.min_shadow_period.time}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {opt.min_shadow_period.shadow_length.toFixed(2)} m {t('optimization.at')} {Math.round(opt.min_shadow_period.ghi)} W/m²
            </div>
          </div>
        )}

        {/* Optimal Collection Periods */}
        {opt.optimal_solar_collection_periods.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('optimization.optimalCollection')}
            </div>
            <div className="space-y-2">
              {opt.optimal_solar_collection_periods.map((period, idx) => (
                <div key={idx} className="text-xs">
                  <span className="font-medium text-blue-900 dark:text-blue-300">
                    {period.start} ~ {period.end}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    ({period.duration_hours.toFixed(1)}{t('optimization.hours')}, {t('optimization.average')} {Math.round(period.average_ghi)} W/m²)
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
                {t('optimization.shadowInterference')}
              </span>
            </div>
            <div className="space-y-2">
              {opt.shadow_interference_periods.map((period, idx) => (
                <div key={idx} className="text-xs">
                  <span className="font-medium text-purple-900 dark:text-purple-300">
                    {period.start} ~ {period.end}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    ({period.duration_hours.toFixed(1)}{t('optimization.hours')})
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

