'use client';

import { Sun, Moon, Globe } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { locales, localeNames } from '@/lib/i18n';

interface HeaderProps { onReset?: () => void; onToggleSidebar?: () => void }

type ApiStatus = 'checking' | 'ok' | 'slow' | 'error';

export default function Header({ onReset, onToggleSidebar }: HeaderProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');
  const { locale, setLocale, t } = useI18n();

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const checkHealth = useCallback(async () => {
    setApiStatus('checking');
    const start = Date.now();
    try {
      const res = await fetch('/api/backend/health', { method: 'GET', signal: AbortSignal.timeout(65000) });
      const elapsed = Date.now() - start;
      if (res.ok) {
        setApiStatus(elapsed > 8000 ? 'slow' : 'ok');
      } else {
        setApiStatus('error');
      }
    } catch {
      setApiStatus('error');
    }
  }, []);

  // 최초 로드 + 5분마다 헬스체크
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const statusDot: Record<ApiStatus, { color: string; label: string }> = {
    checking: { color: 'bg-yellow-400 animate-pulse', label: t('header.apiChecking') },
    ok:       { color: 'bg-green-500 animate-pulse', label: t('header.apiConnected') },
    slow:     { color: 'bg-yellow-500 animate-pulse', label: t('header.apiSlow') },
    error:    { color: 'bg-red-500', label: t('header.apiError') },
  };

  const toggleDarkMode = () => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.remove('dark');
    } else {
      html.classList.add('dark');
    }
    setDarkMode(!darkMode);
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={onReset}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onReset?.(); } }}
            role="button"
            tabIndex={0}
            aria-label={t('header.title')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Sun className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('header.title')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('header.subtitle')}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Mobile: Sidebar Toggle */}
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors md:hidden"
              aria-label={t('header.openSidebar')}
            >
              <span className="block w-5 h-0.5 bg-gray-700 dark:bg-gray-300 mb-1"></span>
              <span className="block w-5 h-0.5 bg-gray-700 dark:bg-gray-300 mb-1"></span>
              <span className="block w-5 h-0.5 bg-gray-700 dark:bg-gray-300"></span>
            </button>

            {/* Language Selector */}
            <div className="relative z-50">
              <button
                type="button"
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                aria-label={t('header.selectLanguage')}
              >
                <Globe className="w-4 h-4" />
                <span className="hidden md:inline">{localeNames[locale]}</span>
              </button>
              
              {showLangMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                  <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
                    {locales.map((loc) => (
                      <button
                        type="button"
                        key={loc}
                        onClick={() => { setLocale(loc); setShowLangMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                          locale === loc
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                      >
                        {localeNames[loc]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={t('header.toggleDark')}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>

            {/* API Status — 실제 헬스체크 결과 반영 */}
            <button
              type="button"
              onClick={checkHealth}
              title={t('header.apiRecheck')}
              aria-label={t('header.apiRecheck')}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <div className={`w-2 h-2 rounded-full ${statusDot[apiStatus].color}`} />
              <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:inline">
                {statusDot[apiStatus].label}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
