'use client';

import { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, Star, StarOff } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

interface Preset {
  id: string;
  name: string;
  location: { lat: number; lon: number };
  date: string;
  objectHeight: number;
  createdAt: string;
  isFavorite?: boolean;
}

interface PresetManagerProps {
  currentLocation?: { lat: number; lon: number } | null;
  currentDate: string;
  currentObjectHeight: number;
  onLoadPreset?: (preset: Omit<Preset, 'id' | 'createdAt'>) => void;
  onSavePreset?: () => void;
}

export default function PresetManager({
  currentLocation,
  currentDate,
  currentObjectHeight,
  onLoadPreset,
  onSavePreset
}: PresetManagerProps) {
  const { t } = useI18n();
  const isDevelopment = process.env.NODE_ENV === 'development';
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Load presets from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('solar_presets');
      if (stored) {
        setPresets(JSON.parse(stored));
      }
    } catch (error) {
      if (isDevelopment) {
        console.error('Failed to load presets:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save presets to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('solar_presets', JSON.stringify(presets));
    } catch (error) {
      if (isDevelopment) {
        console.error('Failed to save presets:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presets]);

  const handleSavePreset = () => {
    if (!currentLocation || !saveName.trim()) return;

    const newPreset: Preset = {
      id: Date.now().toString(),
      name: saveName.trim(),
      location: currentLocation,
      date: currentDate,
      objectHeight: currentObjectHeight,
      createdAt: new Date().toISOString()
    };

    setPresets([...presets, newPreset]);
    setSaveName('');
    setShowSaveDialog(false);
    if (onSavePreset) onSavePreset();
  };

  const handleLoadPreset = (preset: Preset) => {
    if (onLoadPreset) {
      onLoadPreset({
        name: preset.name,
        location: preset.location,
        date: preset.date,
        objectHeight: preset.objectHeight
      });
    }
    setIsOpen(false);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('presetManager.deleteConfirm'))) {
      setPresets(presets.filter(p => p.id !== id));
    }
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPresets(presets.map(p => 
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    ));
  };

  const favoritePresets = presets.filter(p => p.isFavorite);
  const regularPresets = presets.filter(p => !p.isFavorite);

  return (
    <div className="space-y-3">
      {/* Header Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
        >
          <FolderOpen className="w-4 h-4" />
          <span>{t('presetManager.open')} ({presets.length})</span>
        </button>
        <button
          onClick={() => setShowSaveDialog(true)}
          disabled={!currentLocation}
          className="flex items-center justify-center px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
        </button>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('presetManager.nameLabel')}
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder={t('presetManager.namePlaceholder')}
              className="flex-1 px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSavePreset();
                if (e.key === 'Escape') setShowSaveDialog(false);
              }}
            />
            <button
              onClick={handleSavePreset}
              disabled={!saveName.trim()}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-xs rounded-lg transition-colors"
            >
              {t('presetManager.saveButton')}
            </button>
            <button
              onClick={() => setShowSaveDialog(false)}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors"
            >
              {t('presetManager.cancelButton')}
            </button>
          </div>
        </div>
      )}

      {/* Presets List */}
      {isOpen && (
        <div className="max-h-96 overflow-y-auto space-y-2">
          {presets.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400">
              {t('presetManager.noPresets')}
              <br />
              {t('presetManager.save')} {t('presetManager.saveButton')}로 현재 설정을 저장하세요.
            </div>
          ) : (
            <>
              {/* Favorite Presets */}
              {favoritePresets.length > 0 && (
                <>
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-2">
                    {t('presetManager.favoritePresets')} ⭐
                  </div>
                  {favoritePresets.map(preset => (
                    <div
                      key={preset.id}
                      onClick={() => handleLoadPreset(preset)}
                      className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Star className="w-3 h-3 text-yellow-600" />
                            <div className="font-medium text-xs text-gray-900 dark:text-white truncate">
                              {preset.name}
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                            <div>{preset.location.lat.toFixed(4)}°N, {preset.location.lon.toFixed(4)}°E</div>
                            <div>{preset.date} · {preset.objectHeight}m</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={(e) => handleToggleFavorite(preset.id, e)}
                            className="p-1 text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 rounded"
                          >
                            <StarOff className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeletePreset(preset.id, e)}
                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Regular Presets */}
              {regularPresets.length > 0 && (
                <>
                  {favoritePresets.length > 0 && (
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-2 pt-2">
                      {t('presetManager.regularPresets')}
                    </div>
                  )}
                  {regularPresets.map(preset => (
                    <div
                      key={preset.id}
                      onClick={() => handleLoadPreset(preset)}
                      className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs text-gray-900 dark:text-white truncate mb-1">
                            {preset.name}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                            <div>{preset.location.lat.toFixed(4)}°N, {preset.location.lon.toFixed(4)}°E</div>
                            <div>{preset.date} · {preset.objectHeight}m</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={(e) => handleToggleFavorite(preset.id, e)}
                            className="p-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                          >
                            <Star className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeletePreset(preset.id, e)}
                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
