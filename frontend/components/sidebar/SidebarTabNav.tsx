'use client';

import type { ReactNode } from 'react';
import { Layers } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';
import type { SidebarMainTab } from './sidebar-types';

interface SidebarTabNavProps {
  tab: SidebarMainTab;
  onTabChange: (tab: SidebarMainTab) => void;
}

export default function SidebarTabNav({ tab, onTabChange }: SidebarTabNavProps) {
  const { t } = useI18n();

  const btn = (id: SidebarMainTab, label: string, icon?: ReactNode) => (
    <button
      type="button"
      onClick={() => onTabChange(id)}
      className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
        tab === id
          ? 'bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-md shadow-sky-500/25'
          : 'bg-white/90 text-stone-600 shadow-sm ring-1 ring-amber-100/80 hover:bg-amber-50/90 dark:bg-slate-800/90 dark:text-stone-200 dark:ring-slate-600 dark:hover:bg-slate-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="mb-2 grid grid-cols-2 gap-2">
      {btn('single', t('sidebar.tabs.single'))}
      {btn(
        'batch',
        t('sidebar.tabs.batch'),
        <Layers className="w-3 h-3 inline mr-1" />
      )}
      {btn('season', t('sidebar.tabs.season'))}
      {btn('tools', t('sidebar.tabs.tools'))}
    </div>
  );
}
