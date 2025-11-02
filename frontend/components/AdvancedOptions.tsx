'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

interface AdvancedOptionsProps {
  onSkyModelChange?: (model: 'isotropic' | 'perez' | 'klucher') => void;
  onIntervalChange?: (interval: number) => void;
  onUnitsChange?: (units: 'metric' | 'imperial') => void;
}

export default function AdvancedOptions({
  onSkyModelChange,
  onIntervalChange,
  onUnitsChange
}: AdvancedOptionsProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [skyModel, setSkyModel] = useState<'isotropic' | 'perez' | 'klucher'>('isotropic');
  const [interval, setInterval] = useState(60);
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');

  const handleSkyModelChange = (model: 'isotropic' | 'perez' | 'klucher') => {
    setSkyModel(model);
    if (onSkyModelChange) onSkyModelChange(model);
  };

  const handleIntervalChange = (value: number) => {
    setInterval(value);
    if (onIntervalChange) onIntervalChange(value);
  };

  const handleUnitsChange = (value: 'metric' | 'imperial') => {
    setUnits(value);
    if (onUnitsChange) onUnitsChange(value);
  };

  return (
    <div className="space-y-3">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('advancedOptions.title')}
          </span>
        </div>
        <span className={`text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {/* Options Panel */}
      {isOpen && (
        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
          {/* Sky Model */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('advancedOptions.skyModelLabel')}
            </label>
            <select
              value={skyModel}
              onChange={(e) => handleSkyModelChange(e.target.value as 'isotropic' | 'perez' | 'klucher')}
              className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="isotropic">{t('advancedOptions.skyModels.isotropic')}</option>
              <option value="perez">{t('advancedOptions.skyModels.perez')}</option>
              <option value="klucher">{t('advancedOptions.skyModels.klucher')}</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('advancedOptions.skyModelDescription')}
            </p>
          </div>

          {/* Time Interval */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('advancedOptions.intervalLabel')}: {interval}{t('advancedOptions.intervalMin')}
            </label>
            <input
              type="range"
              min="10"
              max="120"
              step="10"
              value={interval}
              onChange={(e) => handleIntervalChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>{t('advancedOptions.intervalLabels.min')}</span>
              <span>{t('advancedOptions.intervalLabels.mid')}</span>
              <span>{t('advancedOptions.intervalLabels.max')}</span>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {t('advancedOptions.intervalDescription')}
            </p>
          </div>

          {/* Units */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('advancedOptions.unitsLabel')}
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => handleUnitsChange('metric')}
                className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                  units === 'metric'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('advancedOptions.unitsMetric')}
              </button>
              <button
                onClick={() => handleUnitsChange('imperial')}
                className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                  units === 'imperial'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('advancedOptions.unitsImperial')}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {t('advancedOptions.unitsDescription')}
            </p>
          </div>

          {/* Info */}
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-400">
              {t('advancedOptions.tips.title')}
            </p>
            <ul className="mt-1 space-y-0.5 text-xs text-blue-700 dark:text-blue-400 ml-4">
              <li>• {t('advancedOptions.tips.precision')}</li>
              <li>• {t('advancedOptions.tips.standard')}</li>
              <li>• {t('advancedOptions.tips.quick')}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
