'use client';

import { Download, FileJson, FileText, Copy, Printer } from 'lucide-react';
import { useState } from 'react';
import { exportToCSV, exportToJSON, exportSummary, copyToClipboard } from '@/lib/export';
import { openPrintableSolarReport } from '@/lib/printReport';
import WeatherStrip from '@/components/WeatherStrip';
import PresetManager from '@/components/PresetManager';
import AdvancedOptions from '@/components/AdvancedOptions';
import KakaoPayDonation from '@/components/KakaoPayDonation';
import { useI18n } from '@/lib/i18n-context';
import type { SolarCalculationResponse } from '@/lib/api';

interface ToolsPanelProps {
  location: { lat: number; lon: number } | null;
  date: string;
  objectHeight: number;
  currentTime: string;
  solarData?: SolarCalculationResponse | null;
  isMobile: boolean;
  onLoadPreset: (preset: {
    name: string;
    location: { lat: number; lon: number };
    date: string;
    objectHeight: number;
  }) => void;
}

export default function ToolsPanel({
  location,
  date,
  objectHeight,
  currentTime,
  solarData,
  isMobile,
  onLoadPreset,
}: ToolsPanelProps) {
  const { t } = useI18n();
  const [copySuccess, setCopySuccess] = useState(false);

  return (
    <div className="space-y-5">
      {location && (
        <WeatherStrip
          lat={location.lat}
          lon={location.lon}
          date={date}
          currentTime={currentTime}
          labels={{
            title: t('sidebar.weatherTitle'),
            avgCloud: t('sidebar.weatherAvgCloud'),
            atTime: t('sidebar.weatherAtTime'),
            precip: t('sidebar.weatherPrecip'),
          }}
        />
      )}

      {solarData && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-ink-muted">{t('sidebar.exportTitle')}</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => exportToCSV(solarData)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <Download className="h-3.5 w-3.5" />
              {t('sidebar.exportCSV')}
            </button>
            <button
              type="button"
              onClick={() => exportToJSON(solarData)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700"
            >
              <FileJson className="h-3.5 w-3.5" />
              {t('sidebar.exportJSON')}
            </button>
            <button
              type="button"
              onClick={() => exportSummary(solarData)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-stone-600 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-700"
            >
              <FileText className="h-3.5 w-3.5" />
              {t('sidebar.exportSummary')}
            </button>
            <button
              type="button"
              onClick={async () => {
                const success = await copyToClipboard(solarData);
                if (success) {
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }
              }}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white ${
                copySuccess ? 'bg-emerald-500' : 'bg-stone-500 hover:bg-stone-600'
              }`}
            >
              <Copy className="h-3.5 w-3.5" />
              {copySuccess ? t('sidebar.exportCopied') : t('sidebar.exportCopy')}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!location) return;
                openPrintableSolarReport(solarData, {
                  lat: location.lat,
                  lon: location.lon,
                  date,
                  objectHeightM: objectHeight,
                });
              }}
              className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden />
              {t('sidebar.printReport')}
            </button>
          </div>
          <p className="text-[11px] text-ink-muted">
            {solarData.series.length}
            {t('sidebar.dataPoints')}
          </p>
        </section>
      )}

      <PresetManager
        currentLocation={location}
        currentDate={date}
        currentObjectHeight={objectHeight}
        onLoadPreset={onLoadPreset}
      />
      <AdvancedOptions />

      <KakaoPayDonation
        isMobile={isMobile}
        className="flex w-full cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 px-4 py-2.5 text-sm font-bold text-stone-900 shadow-sm transition hover:from-amber-500 hover:to-yellow-500"
        variant="button"
      />
    </div>
  );
}
