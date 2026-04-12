/** API 요청/응답 타입 (백엔드 스키마와 정렬) */

export interface SolarCalculationRequest {
  location: {
    lat: number;
    lon: number;
    altitude?: number;
    timezone?: string;
  };
  datetime: {
    date: string;
    start_time?: string;
    end_time?: string;
    interval?: number;
  };
  object?: {
    height: number;
    tilt?: number;
    azimuth?: number;
  };
  options?: {
    atmosphere?: boolean;
    precision?: 'low' | 'medium' | 'high';
    include_weather?: boolean;
  };
}

export interface BatchCalculationRequest {
  requests: SolarCalculationRequest[];
  parallel?: boolean;
}

export interface BatchCalculationResponseItem {
  index: number;
  success: boolean;
  result?: SolarCalculationResponse;
  error?: string;
}

export interface BatchCalculationResponse {
  total_requests: number;
  successful: number;
  failed: number;
  processing_time_ms: number;
  results: BatchCalculationResponseItem[];
}

export interface SunPosition {
  altitude: number;
  azimuth: number;
  zenith: number;
  hour_angle: number;
}

export interface Irradiance {
  ghi: number;
  dni: number;
  dhi: number;
  par?: number;
}

export interface Shadow {
  length?: number | null;
  direction?: number | null;
  coordinates?: number[][] | null;
}

export interface SolarDataPoint {
  timestamp: string;
  sun: SunPosition;
  irradiance: Irradiance | null;
  shadow: Shadow | null;
}

export interface SolarSummary {
  sunrise: string;
  sunset: string;
  solar_noon: string;
  day_length: number;
  max_altitude: number;
  total_irradiance: number | null;
}

export interface SolarCalculationResponse {
  metadata: {
    request_id: string;
    timestamp: string;
    version: string;
    accuracy: {
      position: number;
      irradiance: number;
    };
  };
  summary: SolarSummary;
  series: SolarDataPoint[];
}

export interface OptimizationResult {
  status: string;
  optimization: {
    max_irradiance_period: {
      time: string;
      ghi: number;
      altitude: number;
    } | null;
    max_altitude_period: {
      time: string;
      altitude: number;
      ghi: number;
    } | null;
    min_shadow_period: {
      time: string;
      shadow_length: number;
      ghi: number;
    } | null;
    optimal_solar_collection_periods: Array<{
      start: string;
      end: string;
      average_ghi: number;
      duration_hours: number;
    }>;
    shadow_interference_periods: Array<{
      start: string;
      end: string;
      average_ghi: number;
      duration_hours: number;
    }>;
  };
}
