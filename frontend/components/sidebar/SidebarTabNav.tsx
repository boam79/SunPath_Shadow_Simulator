'use client';

import { useI18n } from '@/lib/i18n-context';
import type { SidebarMainTab } from './sidebar-types';

interface SidebarTabNavProps {
  tab: SidebarMainTab;
  onTabChange: (tab: SidebarMainTab) => void;
}

const TABS: SidebarMainTab[] = ['simulate', 'compare', 'tools'];

export default function SidebarTabNav({ tab, onTabChange }: SidebarTabNavProps) {
  const { t } = useI18n();

  return (
    <div
      className="grid grid-cols-3 gap-1 rounded-2xl bg-sky/40 p-1 ring-1 ring-[color:var(--glass-border)] dark:bg-slate-800/60"
      role="tablist"
      aria-label={t('sidebar.tabsAria')}
    >
      {TABS.map((id) => {
        const active = tab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onTabChange(id)}
            className={`rounded-xl px-2 py-2 text-[11px] font-semibold transition-all md:text-xs ${
              active
                ? 'bg-white text-ink shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-ink-muted hover:text-ink dark:text-stone-400 dark:hover:text-stone-100'
            }`}
          >
            {t(`sidebar.tabs.${id}`)}
          </button>
        );
      })}
    </div>
  );
}
