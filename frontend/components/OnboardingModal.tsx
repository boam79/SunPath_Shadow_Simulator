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
      <div className="w-full max-w-md rounded-[1.75rem] border border-[color:var(--glass-border)] bg-[color:var(--glass)] p-6 shadow-soft backdrop-blur-md sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-sun-deep">
          {t('onboarding.kicker')}
        </p>
        <h2 id="onboarding-title" className="font-display mt-1 text-xl font-semibold tracking-tight text-ink dark:text-white">
          {t('onboarding.title')}
        </h2>
        <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ink-muted">
          <li>{t('onboarding.step1')}</li>
          <li>{t('onboarding.step2')}</li>
          <li>{t('onboarding.step3')}</li>
        </ol>
        <button
          type="button"
          onClick={dismiss}
          className="d1-sun-cta mt-8 w-full rounded-2xl py-3.5 text-base shadow-sun"
        >
          {t('onboarding.cta')}
        </button>
      </div>
    </div>
  );
}
