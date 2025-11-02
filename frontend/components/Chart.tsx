'use client';

import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { SolarCalculationResponse } from '@/lib/api';
import { useMemo } from 'react';
import { useI18n } from '@/lib/i18n-context';

interface SolarChartProps {
  solarData: SolarCalculationResponse | null;
  currentTime: string;
}

export default function SolarChart({ solarData, currentTime }: SolarChartProps) {
  const { t, locale } = useI18n();
  
  // Transform data for charts
  const chartData = useMemo(() => {
    if (!solarData) return [];

    return solarData.series.map(point => {
      const time = new Date(point.timestamp);
      const timeStr = time.toLocaleTimeString(locale === 'ko' ? 'ko-KR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
      
      return {
        time: timeStr,
        timestamp: time.getTime(),
        altitude: point.sun?.altitude || 0,
        azimuth: point.sun?.azimuth || 0,
        ghi: point.irradiance?.ghi || 0,
        dni: point.irradiance?.dni || 0,
        dhi: point.irradiance?.dhi || 0,
        shadowLength: typeof point.shadow?.length === 'number' && isFinite(point.shadow.length) 
          ? point.shadow.length 
          : null
      };
    });
  }, [solarData, locale]);

  // Find current time index for reference line
  const currentTimeIndex = useMemo(() => {
    if (!solarData || !currentTime) return -1;
    
    try {
      // Parse current time more reliably
      const [hours, minutes] = currentTime.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return -1;
      
      // Find the closest data point
      let closestIndex = -1;
      let minDiff = Infinity;
      
      chartData.forEach((d, index) => {
        const [dHours, dMinutes] = d.time.split(':').map(Number);
        if (!isNaN(dHours) && !isNaN(dMinutes)) {
          const diff = Math.abs((hours * 60 + minutes) - (dHours * 60 + dMinutes));
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = index;
          }
        }
      });
      
      // Only return valid index if within reasonable range (5 minutes)
      return minDiff <= 5 ? closestIndex : -1;
    } catch {
      return -1;
    }
  }, [chartData, currentTime, solarData]);

  if (!solarData || chartData.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Sun Altitude & Azimuth Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {t('chart.altitudeAzimuth')}
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="time" 
              stroke="#6b7280"
              fontSize={12}
              interval="preserveStartEnd"
            />
            <YAxis 
              yAxisId="left"
              label={{ value: `${t('chart.altitude')} (°)`, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
              stroke="#f59e0b"
              fontSize={12}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              label={{ value: `${t('chart.azimuth')} (°)`, angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
              stroke="#3b82f6"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: '1px solid #e5e7eb',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="altitude" 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={false}
              name={t('chart.altitude')}
              isAnimationActive={false}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="azimuth" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={false}
              name={t('chart.azimuth')}
              isAnimationActive={false}
            />
            {currentTimeIndex >= 0 && currentTimeIndex < chartData.length && (
              <ReferenceLine 
                x={chartData[currentTimeIndex]?.time} 
                stroke="#ef4444" 
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{ value: t('chart.current'), position: 'top', fill: '#ef4444' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Irradiance Area Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {t('chart.ghiArea')}
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="ghiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="dniGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ea580c" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ea580c" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="dhiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fb923c" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#fb923c" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="time" 
              stroke="#6b7280"
              fontSize={12}
              interval="preserveStartEnd"
            />
            <YAxis 
              label={{ value: t('chart.irradiance'), angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
              stroke="#f97316"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: '1px solid #e5e7eb',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="ghi" 
              stroke="#f97316" 
              strokeWidth={2}
              fill="url(#ghiGradient)"
              name={t('chart.ghi')}
              isAnimationActive={false}
            />
            <Area 
              type="monotone" 
              dataKey="dni" 
              stroke="#ea580c" 
              strokeWidth={2}
              fill="url(#dniGradient)"
              name={t('chart.dni')}
              isAnimationActive={false}
            />
            <Area 
              type="monotone" 
              dataKey="dhi" 
              stroke="#fb923c" 
              strokeWidth={2}
              fill="url(#dhiGradient)"
              name={t('chart.dhi')}
              isAnimationActive={false}
            />
            {currentTimeIndex >= 0 && currentTimeIndex < chartData.length && (
              <ReferenceLine 
                x={chartData[currentTimeIndex]?.time} 
                stroke="#ef4444" 
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{ value: t('chart.current'), position: 'top', fill: '#ef4444' }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Shadow Length Bar Chart */}
      {chartData.some(d => d.shadowLength !== null) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            {t('chart.shadowVariation')}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData.filter(d => d.shadowLength !== null)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="time" 
                stroke="#6b7280"
                fontSize={12}
                interval="preserveStartEnd"
              />
              <YAxis 
                label={{ value: `${t('chart.length')} (m)`, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                stroke="#6b21a8"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
                formatter={(value: number) => `${value.toFixed(2)} m`}
              />
              <Bar 
                dataKey="shadowLength" 
                fill="#6b21a8" 
                name={t('chart.shadowLength').replace(' (m)', '')}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
              {currentTimeIndex >= 0 && currentTimeIndex < chartData.length && (
                <ReferenceLine 
                  x={chartData[currentTimeIndex]?.time} 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  label={{ value: t('chart.current'), position: 'top', fill: '#ef4444' }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

