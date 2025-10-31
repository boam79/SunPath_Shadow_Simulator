/**
 * Data export utilities (CSV, JSON)
 */

import type { SolarCalculationResponse } from './api';

/**
 * Convert solar data to CSV format
 */
export function exportToCSV(data: SolarCalculationResponse, filename?: string): void {
  // CSV Header
  const headers = [
    'Timestamp',
    'Date',
    'Time',
    'Sun Altitude (°)',
    'Sun Azimuth (°)',
    'Sun Zenith (°)',
    'GHI (W/m²)',
    'DNI (W/m²)',
    'DHI (W/m²)',
    'PAR (W/m²)',
    'Shadow Length (m)',
    'Shadow Direction (°)'
  ];

  // Helper function for safe number formatting
  const safeToFixed = (value: number | null | undefined, digits: number): string => {
    if (typeof value !== 'number') return '';
    if (!isFinite(value)) return 'Infinite';
    return value.toFixed(digits);
  };

  // CSV Rows
  const rows = data.series.map(point => {
    const timestamp = new Date(point.timestamp);
    const dateStr = timestamp.toLocaleDateString('ko-KR');
    const timeStr = timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    return [
      point.timestamp,
      dateStr,
      timeStr,
      safeToFixed(point.sun.altitude, 4),
      safeToFixed(point.sun.azimuth, 4),
      safeToFixed(point.sun.zenith, 4),
      safeToFixed(point.irradiance?.ghi, 2),
      safeToFixed(point.irradiance?.dni, 2),
      safeToFixed(point.irradiance?.dhi, 2),
      safeToFixed(point.irradiance?.par, 2),
      safeToFixed(point.shadow?.length, 2),
      safeToFixed(point.shadow?.direction, 2)
    ];
  });

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Add BOM for Excel UTF-8 support
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csvContent;

  // Generate filename with safe date extraction
  const date = data.series && data.series.length > 0 && data.series[0]?.timestamp
    ? new Date(data.series[0].timestamp).toISOString().split('T')[0]
    : 'data';
  const defaultFilename = `sunpath_${date}.csv`;

  // Download
  downloadFile(csvWithBOM, filename || defaultFilename, 'text/csv;charset=utf-8;');
}

/**
 * Export data as JSON
 */
export function exportToJSON(data: SolarCalculationResponse, filename?: string): void {
  const jsonContent = JSON.stringify(data, null, 2);

  const date = data.series && data.series.length > 0 && data.series[0]?.timestamp
    ? new Date(data.series[0].timestamp).toISOString().split('T')[0]
    : 'data';
  const defaultFilename = `sunpath_${date}.json`;

  downloadFile(jsonContent, filename || defaultFilename, 'application/json');
}

/**
 * Helper to safely format date/time strings
 */
function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr === 'N/A') return 'N/A';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('ko-KR');
  } catch {
    return 'N/A';
  }
}

/**
 * Export summary as text
 */
export function exportSummary(data: SolarCalculationResponse, filename?: string): void {
  // Derive key metrics from actual series
  const series = data.series || [];
  const byValid = series.filter(p => typeof p.sun?.altitude === 'number');
  const fmtTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }); } catch { return 'N/A'; }
  };
  const maxAltitude = byValid.reduce<{v:number; t:string} | null>((acc, p) => {
    const v = p.sun.altitude;
    if (!isFinite(v)) return acc;
    if (!acc || v > acc.v) return { v, t: p.timestamp };
    return acc;
  }, null);
  const maxGHI = series.reduce<{v:number; t:string} | null>((acc, p) => {
    const v = p.irradiance?.ghi ?? -Infinity;
    if (!isFinite(v)) return acc;
    if (!acc || v > acc.v) return { v, t: p.timestamp };
    return acc;
  }, null);
  const minShadow = series.reduce<{v:number; t:string} | null>((acc, p) => {
    const v = p.shadow?.length ?? Infinity;
    if (!isFinite(v as number)) return acc;
    if (!acc || (v as number) < acc.v) return { v: v as number, t: p.timestamp };
    return acc;
  }, null);

  const summary = `
SunPath & Shadow Simulator - 계산 결과
=======================================

일출: ${formatDateTime(data.summary.sunrise)}
일몰: ${formatDateTime(data.summary.sunset)}
정오: ${formatDateTime(data.summary.solar_noon)}

일조 시간: ${data.summary.day_length.toFixed(2)}시간
최대 태양 고도: ${data.summary.max_altitude.toFixed(2)}°
총 일사량: ${data.summary.total_irradiance?.toFixed(2) || 'N/A'} kWh/m²

[실데이터 기반 요약]
- 최댓 고도 시각: ${maxAltitude ? fmtTime(maxAltitude.t) : 'N/A'} (고도 ${maxAltitude ? maxAltitude.v.toFixed(2) : 'N/A'}°)
- 최댓 GHI 시각: ${maxGHI ? fmtTime(maxGHI.t) : 'N/A'} (GHI ${maxGHI ? maxGHI.v.toFixed(0) : 'N/A'} W/m²)
- 최소 그림자 길이 시각: ${minShadow ? fmtTime(minShadow.t) : 'N/A'} (길이 ${minShadow ? (minShadow.v === Infinity ? '무한대' : (minShadow.v.toFixed(2) + ' m')) : 'N/A'})

데이터 포인트: ${data.series.length}개
계산 시각: ${data.metadata.timestamp}
정확도: ±${data.metadata.accuracy.position}° (위치), ±${data.metadata.accuracy.irradiance}% (일사량)

===================================
Generated by SunPath & Shadow Simulator v${data.metadata.version}
  `.trim();

  const date = data.series && data.series.length > 0 && data.series[0]?.timestamp
    ? new Date(data.series[0].timestamp).toISOString().split('T')[0]
    : 'data';
  const defaultFilename = `sunpath_summary_${date}.txt`;

  downloadFile(summary, filename || defaultFilename, 'text/plain');
}

/**
 * Download file helper
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Delay URL revocation to ensure download completes
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Copy data to clipboard as JSON
 */
export async function copyToClipboard(data: SolarCalculationResponse): Promise<boolean> {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    await navigator.clipboard.writeText(jsonString);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
