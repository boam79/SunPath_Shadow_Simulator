'use client';

import { Sun, Moon, Globe, Sparkles } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useI18n } from '@/lib/i18n-context';
import { locales, localeNames } from '@/lib/i18n';

interface HeaderProps {
  onReset?: () => void;
  onToggleSidebar?: () => void;
}

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

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const statusDot: Record<ApiStatus, { color: string; label: string }> = {
    checking: { color: 'bg-amber-400 animate-pulse', label: t('header.apiChecking') },
    ok: { color: 'bg-emerald-400 shadow-sm shadow-emerald-400/50', label: t('header.apiConnected') },
    slow: { color: 'bg-amber-500 animate-pulse', label: t('header.apiSlow') },
    error: { color: 'bg-rose-500', label: t('header.apiError') },
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
    <header className="sticky top-0 z-50 border-b border-amber-100/90 bg-white/75 shadow-soft backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/75">
      <div className="container mx-auto max-w-7xl px-4 py-3 md:py-4">
        <div className="flex items-center justify-between gap-3">
          <div
            className="flex min-w-0 cursor-pointer select-none items-center gap-3 rounded-2xl p-1 transition-colors hover:bg-amber-50/80 dark:hover:bg-slate-800/60"
            onClick={onReset}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onReset?.();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={t('header.title')}
          >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 shadow-md ring-2 ring-white/60 dark:ring-amber-200/20">
              <Sun className="h-6 w-6 text-white drop-shadow-sm" />
              <Sparkles className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 text-amber-100" aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-stone-800 dark:text-white md:text-xl">
                {t('header.title')}
              </h1>
              <p className="truncate text-xs font-medium text-sky-700/90 dark:text-sky-200/90 md:text-sm">
                {t('header.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="rounded-full p-2.5 text-stone-600 transition-colors hover:bg-amber-100/90 hover:text-stone-800 dark:text-stone-300 dark:hover:bg-slate-800 dark:hover:text-white md:hidden"
              aria-label={t('header.openSidebar')}
            >
              <span className="mb-1 block h-0.5 w-5 rounded-full bg-current" />
              <span className="mb-1 block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
            </button>

            <div className="relative z-50">
              <button
                type="button"
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-sky-100/80 hover:text-sky-900 dark:text-stone-200 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label={t('header.selectLanguage')}
              >
                <Globe className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span className="hidden md:inline">{localeNames[locale]}</span>
              </button>

              {showLangMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-36 overflow-hidden rounded-2xl border border-amber-100/90 bg-white/95 py-1 shadow-card backdrop-blur-sm dark:border-slate-600 dark:bg-slate-800/95">
                    {locales.map((loc) => (
                      <button
                        type="button"
                        key={loc}
                        onClick={() => {
                          setLocale(loc);
                          setShowLangMenu(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                          locale === loc
                            ? 'bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100'
                            : 'text-stone-700 hover:bg-amber-50 dark:text-stone-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {localeNames[loc]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={toggleDarkMode}
              className="rounded-full p-2.5 text-stone-600 transition-colors hover:bg-violet-100/80 hover:text-violet-800 dark:text-stone-200 dark:hover:bg-slate-800 dark:hover:text-amber-300"
              aria-label={t('header.toggleDark')}
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-violet-500" />
              )}
            </button>

            <button
              type="button"
              onClick={checkHealth}
              title={t('header.apiRecheck')}
              aria-label={t('header.apiRecheck')}
              className="hidden cursor-pointer items-center gap-2 rounded-full border border-amber-100/80 bg-cream-50/90 px-3 py-1.5 sm:flex dark:border-slate-600 dark:bg-slate-800/80"
            >
              <div className={`h-2 w-2 shrink-0 rounded-full ${statusDot[apiStatus].color}`} />
              <span className="max-w-[10rem] truncate text-xs font-medium text-stone-600 dark:text-stone-300">
                {statusDot[apiStatus].label}
              </span>
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 sm:hidden">
          <div className={`h-2 w-2 shrink-0 rounded-full ${statusDot[apiStatus].color}`} />
          <span className="text-xs font-medium text-stone-600 dark:text-stone-300">{statusDot[apiStatus].label}</span>
        </div>
      </div>
    </header>
  );
}
