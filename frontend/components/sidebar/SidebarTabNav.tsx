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
      className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
        tab === id
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="grid grid-cols-2 gap-2 mb-2">
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
