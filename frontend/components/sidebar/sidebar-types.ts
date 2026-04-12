import type { SolarCalculationResponse } from '@/lib/api';

export type SidebarMainTab = 'single' | 'batch' | 'season' | 'tools';

export interface SidebarTimelineConfig {
  currentTime: string;
  onTimeChange: (t: string) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  startTime?: string;
  endTime?: string;
}

export interface SidebarProps {
  location: { lat: number; lon: number } | null;
  setLocation: (loc: { lat: number; lon: number } | null) => void;
  date: string;
  setDate: (date: string) => void;
  objectHeight: number;
  setObjectHeight: (height: number) => void;
  currentTime: string;
  setCurrentTime: (time: string) => void;
  solarData?: SolarCalculationResponse | null;
  timeline?: SidebarTimelineConfig;
  compareEnabled?: boolean;
  setCompareEnabled?: (v: boolean) => void;
  compareHeight?: number;
  setCompareHeight?: (h: number) => void;
  solarDataB?: SolarCalculationResponse | null;
}
