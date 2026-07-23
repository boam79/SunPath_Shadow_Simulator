/**
 * Open-Meteo 기상 데이터 프록시
 * 무료·CORS 문제 없음 · API 키 불필요
 *
 * forecast 윈도우 밖 날짜:
 * - 과거 → archive API 폴백
 * - 먼 미래 → 200 + 빈 hourly (콘솔 502 방지, UI는 조용히 숨김)
 */
import { NextRequest, NextResponse } from 'next/server';

type HourlyBag = {
  time?: string[];
  cloudcover?: number[];
  cloud_cover?: number[];
  shortwave_radiation?: number[];
  precipitation_probability?: number[];
};

function emptyWeather(reason: string) {
  return {
    unavailable: true,
    reason,
    hourly: {
      time: [] as string[],
      cloudcover: [] as number[],
      shortwave_radiation: [] as number[],
      precipitation_probability: [] as number[],
    },
    daily: { sunrise: [] as string[], sunset: [] as string[] },
  };
}

/** Open-Meteo 필드명 차이를 프론트 계약(cloudcover)에 맞춤 */
function normalizeWeatherPayload(data: {
  hourly?: HourlyBag;
  daily?: { sunrise?: string[]; sunset?: string[] };
}) {
  const h = data.hourly ?? {};
  const time = Array.isArray(h.time) ? h.time : [];
  const cloudcover = Array.isArray(h.cloudcover)
    ? h.cloudcover
    : Array.isArray(h.cloud_cover)
      ? h.cloud_cover
      : [];
  const shortwave = Array.isArray(h.shortwave_radiation) ? h.shortwave_radiation : [];
  let precip = Array.isArray(h.precipitation_probability) ? h.precipitation_probability : [];
  if (precip.length === 0 && time.length > 0) {
    precip = time.map(() => 0);
  }
  return {
    ...data,
    hourly: {
      time,
      cloudcover,
      shortwave_radiation: shortwave,
      precipitation_probability: precip,
    },
    daily: {
      sunrise: data.daily?.sunrise ?? [],
      sunset: data.daily?.sunset ?? [],
    },
  };
}

function isPastDate(yyyyMmDd: string): boolean {
  const today = new Date();
  const y = today.getUTCFullYear();
  const m = String(today.getUTCMonth() + 1).padStart(2, '0');
  const d = String(today.getUTCDate()).padStart(2, '0');
  return yyyyMmDd < `${y}-${m}-${d}`;
}

async function fetchJson(url: string): Promise<{ ok: boolean; status: number; data: unknown; detail: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  const detail = res.ok ? '' : await res.text().catch(() => '');
  let data: unknown = null;
  if (res.ok) {
    data = await res.json();
  }
  return { ok: res.ok, status: res.status, data, detail };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const date = searchParams.get('date');

  if (!lat || !lon || !date) {
    return NextResponse.json({ error: 'lat, lon, date 파라미터 필요' }, { status: 400 });
  }

  const latN = Number(lat);
  const lonN = Number(lon);
  if (!Number.isFinite(latN) || latN < -90 || latN > 90 || !Number.isFinite(lonN) || lonN < -180 || lonN > 180) {
    return NextResponse.json({ error: 'lat/lon 범위가 올바르지 않습니다.' }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date는 YYYY-MM-DD 형식이어야 합니다.' }, { status: 400 });
  }

  // Open-Meteo: start_date/end_date 와 forecast_days 는 동시에 쓸 수 없음 (400)
  const forecastParams = new URLSearchParams({
    latitude: String(latN),
    longitude: String(lonN),
    hourly: 'cloudcover,shortwave_radiation,precipitation_probability',
    daily: 'sunrise,sunset',
    timezone: 'auto',
    start_date: date,
    end_date: date,
  });

  try {
    const forecast = await fetchJson(`https://api.open-meteo.com/v1/forecast?${forecastParams}`);
    if (forecast.ok) {
      return NextResponse.json(normalizeWeatherPayload(forecast.data as Parameters<typeof normalizeWeatherPayload>[0]), {
        headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
      });
    }

    // 예보 윈도우 밖: 과거는 archive, 미래/기타는 빈 응답(200) — 브라우저 콘솔 502 스팸 방지
    const outOfRange =
      forecast.status === 400 && /out of allowed range/i.test(forecast.detail);

    if (outOfRange && isPastDate(date)) {
      const archiveParams = new URLSearchParams({
        latitude: String(latN),
        longitude: String(lonN),
        hourly: 'cloudcover,shortwave_radiation',
        daily: 'sunrise,sunset',
        timezone: 'auto',
        start_date: date,
        end_date: date,
      });
      const archive = await fetchJson(`https://archive-api.open-meteo.com/v1/archive?${archiveParams}`);
      if (archive.ok) {
        return NextResponse.json(normalizeWeatherPayload(archive.data as Parameters<typeof normalizeWeatherPayload>[0]), {
          headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400' },
        });
      }
    }

    // Future / out-of-window / transient upstream errors → soft empty (never 502 spam)
    if (outOfRange || !isPastDate(date)) {
      return NextResponse.json(emptyWeather('date_out_of_forecast_range'), {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=3600' },
      });
    }

    return NextResponse.json(
      { error: 'Open-Meteo 오류', status: forecast.status, detail: forecast.detail.slice(0, 500) },
      { status: 502 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: '기상 데이터 요청 실패', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    );
  }
}
