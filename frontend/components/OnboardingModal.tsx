'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n-context';

const STORAGE_KEY = 'sunpath_onboarding_v3';

export default function OnboardingModal() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-stone-900/45 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="w-full max-w-md rounded-[1.75rem] border border-amber-100/90 bg-white p-6 shadow-2xl dark:border-slate-600 dark:bg-slate-800 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
          {t('onboarding.kicker')}
        </p>
        <h2 id="onboarding-title" className="mt-1 text-xl font-bold tracking-tight text-stone-800 dark:text-white">
          {t('onboarding.title')}
        </h2>
        <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
          <li>{t('onboarding.step1')}</li>
          <li>{t('onboarding.step2')}</li>
          <li>{t('onboarding.step3')}</li>
        </ol>
        <button
          type="button"
          onClick={dismiss}
          className="mt-8 w-full rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 py-3.5 text-base font-bold text-white shadow-md transition hover:from-sky-600 hover:to-cyan-600"
        >
          {t('onboarding.cta')}
        </button>
      </div>
    </div>
  );
}
