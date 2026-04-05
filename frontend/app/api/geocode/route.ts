/**
 * 지오코딩 서버사이드 프록시
 * - 브라우저 IP 대신 Vercel 서버 IP로 Nominatim 호출 → 차단 위험 감소
 * - 한국 한정(countrycodes) 제거 → 전 세계 주소 검색 지원
 */
import { NextRequest, NextResponse } from 'next/server';

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const UA = 'SunPath-Shadow-Simulator/0.1.14 (https://sunpathshadowsimulator.vercel.app)';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q     = searchParams.get('q');
  const lat   = searchParams.get('lat');
  const lon   = searchParams.get('lon');
  const type  = searchParams.get('type') ?? 'search'; // 'search' | 'reverse'

  try {
    let url: string;

    if (type === 'reverse' && lat && lon) {
      const params = new URLSearchParams({
        lat, lon,
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
