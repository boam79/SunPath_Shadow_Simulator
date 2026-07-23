import { NextRequest, NextResponse } from 'next/server';

/** Open-Meteo elevation proxy */
export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat');
  const lon = req.nextUrl.searchParams.get('lon');
  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat/lon required' }, { status: 400 });
  }
  try {
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) {
      return NextResponse.json({ elevation: 0 }, { status: 200 });
    }
    const data = (await res.json()) as { elevation?: number[] };
    const elevation = Array.isArray(data.elevation) ? data.elevation[0] : 0;
    return NextResponse.json({
      elevation: typeof elevation === 'number' && Number.isFinite(elevation) ? elevation : 0,
    });
  } catch {
    return NextResponse.json({ elevation: 0 }, { status: 200 });
  }
}
