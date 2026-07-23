'use client';

import { Map as MapIcon, LineChart, SlidersHorizontal } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

export type MobileNavId = 'map' | 'data' | 'more';

interface MobileBottomNavProps {
  active: MobileNavId;
  onSelect: (tab: MobileNavId) => void;
}

export default function MobileBottomNav({ active, onSelect }: MobileBottomNavProps) {
  const { t } = useI18n();

  const Item = ({
    id,
    icon: Icon,
    label,
  }: {
    id: MobileNavId;
    icon: typeof MapIcon;
    label: string;
  }) => {
    const on = active === id;
    return (
      <button
        type="button"
        onClick={() => onSelect(id)}
          className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-2 transition ${
          on
            ? 'text-sun-deep dark:text-sun'
            : 'text-ink-muted hover:text-ink dark:text-stone-400 dark:hover:text-stone-200'
        }`}
        aria-current={on ? 'page' : undefined}
      >
        <Icon className={`h-6 w-6 shrink-0 transition-transform ${on ? 'scale-110' : ''}`} strokeWidth={on ? 2.5 : 2} />
        <span className="truncate px-1 text-[11px] font-bold">{label}</span>
      </button>
    );
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[color:var(--glass-border)] bg-[color:var(--glass)] pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-soft backdrop-blur-lg md:hidden"
      aria-label={t('nav.aria')}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1">
        <Item id="map" icon={MapIcon} label={t('nav.map')} />
        <Item id="data" icon={LineChart} label={t('nav.data')} />
        <Item id="more" icon={SlidersHorizontal} label={t('nav.more')} />
      </div>
    </nav>
  );
}
