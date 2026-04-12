/**
 * Open-Meteo 기상 데이터 프록시
 * 무료·CORS 문제 없음 · API 키 불필요
 */
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat  = searchParams.get('lat');
  const lon  = searchParams.get('lon');
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
  const params = new URLSearchParams({
    latitude: String(latN),
    longitude: String(lonN),
    hourly: 'cloudcover,shortwave_radiation,precipitation_probability',
    daily: 'sunrise,sunset',
    timezone: 'auto',
    start_date: date,
    end_date: date,
  });

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return NextResponse.json(
        { error: 'Open-Meteo 오류', status: res.status, detail: detail.slice(0, 500) },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
    });
  } catch (err) {
    return NextResponse.json(
      { error: '기상 데이터 요청 실패', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    );
  }
}
