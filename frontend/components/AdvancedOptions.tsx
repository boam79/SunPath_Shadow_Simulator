'use client';

import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

interface AdvancedOptionsProps {
  skyModel?: 'isotropic' | 'perez' | 'klucher';
  interval?: number;
  onSkyModelChange?: (model: 'isotropic' | 'perez' | 'klucher') => void;
  onIntervalChange?: (interval: number) => void;
  onUnitsChange?: (units: 'metric' | 'imperial') => void;
}

export default function AdvancedOptions({
  skyModel: skyModelProp,
  interval: intervalProp,
  onSkyModelChange,
  onIntervalChange,
  onUnitsChange,
}: AdvancedOptionsProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [skyModel, setSkyModel] = useState<'isotropic' | 'perez' | 'klucher'>(
    skyModelProp ?? 'isotropic'
  );
  const [interval, setInterval] = useState(intervalProp ?? 60);
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');

  useEffect(() => {
    if (skyModelProp) setSkyModel(skyModelProp);
  }, [skyModelProp]);
  useEffect(() => {
    if (typeof intervalProp === 'number') setInterval(intervalProp);
  }, [intervalProp]);

  const handleSkyModelChange = (model: 'isotropic' | 'perez' | 'klucher') => {
    setSkyModel(model);
    onSkyModelChange?.(model);
  };

  const handleIntervalChange = (value: number) => {
    setInterval(value);
    onIntervalChange?.(value);
  };

  const handleUnitsChange = (value: 'metric' | 'imperial') => {
    setUnits(value);
    onUnitsChange?.(value);
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg bg-gray-100 px-3 py-2 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
      >
        <div className="flex items-center space-x-2">
          <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('advancedOptions.title')}
          </span>
        </div>
        <span className={`text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
              {t('advancedOptions.skyModelLabel')}
            </label>
            <select
              value={skyModel}
              onChange={(e) =>
                handleSkyModelChange(e.target.value as 'isotropic' | 'perez' | 'klucher')
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="isotropic">{t('advancedOptions.skyModels.isotropic')}</option>
              <option value="perez">{t('advancedOptions.skyModels.perez')}</option>
              <option value="klucher">{t('advancedOptions.skyModels.klucher')}</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('advancedOptions.skyModelDescription')}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
              {t('advancedOptions.intervalLabel')}: {interval}
              {t('advancedOptions.intervalMin')}
            </label>
            <input
              type="range"
              min="10"
              max="120"
              step="10"
              value={interval}
              onChange={(e) => handleIntervalChange(parseInt(e.target.value, 10))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600 dark:bg-gray-700"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{t('advancedOptions.intervalLabels.min')}</span>
              <span>{t('advancedOptions.intervalLabels.mid')}</span>
              <span>{t('advancedOptions.intervalLabels.max')}</span>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {t('advancedOptions.intervalDescription')}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
              {t('advancedOptions.unitsLabel')}
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleUnitsChange('metric')}
                className={`flex-1 rounded-lg px-3 py-2 text-xs transition-colors ${
                  units === 'metric'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('advancedOptions.unitsMetric')}
              </button>
              <button
                type="button"
                onClick={() => handleUnitsChange('imperial')}
                className={`flex-1 rounded-lg px-3 py-2 text-xs transition-colors ${
                  units === 'imperial'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('advancedOptions.unitsImperial')}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {t('advancedOptions.unitsDescription')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
