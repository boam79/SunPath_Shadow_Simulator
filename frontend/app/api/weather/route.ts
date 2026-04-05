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

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: 'cloudcover,shortwave_radiation,precipitation_probability',
    daily: 'sunrise,sunset',
    timezone: 'auto',
    start_date: date,
    end_date: date,
    forecast_days: '1',
  });

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Open-Meteo 오류' }, { status: 502 });
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
