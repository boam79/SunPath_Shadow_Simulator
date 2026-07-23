import type { SolarCalculationResponse } from '@/lib/api';

/** D1: 시뮬레이트 | 비교 | 도구 */
export type SidebarMainTab = 'simulate' | 'compare' | 'tools';

export interface SidebarTimelineConfig {
  currentTime: string;
  onTimeChange: (t: string) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  startTime?: string;
  endTime?: string;
  metrics?: {
    altitude?: number | null;
    ghi?: number | null;
    shadowLength?: number | null;
  } | null;
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
  siteAltitude?: number;
  intervalMinutes?: number;
  setIntervalMinutes?: (n: number) => void;
  skyModel?: 'isotropic' | 'perez' | 'klucher';
  setSkyModel?: (m: 'isotropic' | 'perez' | 'klucher') => void;
  panelTilt?: number;
  setPanelTilt?: (n: number) => void;
  panelAzimuth?: number;
  setPanelAzimuth?: (n: number) => void;
}
