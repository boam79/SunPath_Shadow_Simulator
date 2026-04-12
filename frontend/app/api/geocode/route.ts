/**
 * 지오코딩 서버사이드 프록시
 * - 브라우저 IP 대신 Vercel 서버 IP로 Nominatim 호출 → 차단 위험 감소
 * - 한국 한정(countrycodes) 제거 → 전 세계 주소 검색 지원
 */
import { NextRequest, NextResponse } from 'next/server';

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const UA = 'SunPath-Shadow-Simulator/0.1.18 (https://sunpathshadowsimulator.vercel.app)';

const MAX_Q = 200;

function parseCoord(v: string | null, min: number, max: number): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q     = searchParams.get('q');
  const lat   = searchParams.get('lat');
  const lon   = searchParams.get('lon');
  const type  = searchParams.get('type') ?? 'search'; // 'search' | 'reverse'

  if (type === 'search' && q && q.length > MAX_Q) {
    return NextResponse.json({ error: `검색어는 ${MAX_Q}자 이하로 입력해 주세요.` }, { status: 400 });
  }

  try {
    let url: string;

    if (type === 'reverse' && lat && lon) {
      const latN = parseCoord(lat, -90, 90);
      const lonN = parseCoord(lon, -180, 180);
      if (latN == null || lonN == null) {
        return NextResponse.json({ error: '유효한 lat/lon 범위가 아닙니다.' }, { status: 400 });
      }
      const params = new URLSearchParams({
        lat: String(latN),
        lon: String(lonN),
        format: 'jsonv2',
        addressdetails: '1',
        namedetails: '1',
        zoom: '18',
        'accept-language': 'ko,en',
      });
      url = `${NOMINATIM}/reverse?${params}`;
    } else if (q) {
      const params = new URLSearchParams({
        q,
        format: 'jsonv2',
        addressdetails: '1',
        namedetails: '1',
        'accept-language': 'ko,en',
        limit: '7',
      });
      url = `${NOMINATIM}/search?${params}`;
    } else {
      return NextResponse.json({ error: 'q 또는 lat/lon 파라미터 필요' }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Nominatim 오류', status: res.status }, { status: 502 });
    }

    const data = await res.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: '지오코딩 요청 실패', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    );
  }
}
