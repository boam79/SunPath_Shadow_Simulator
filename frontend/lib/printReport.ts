import type { SolarCalculationResponse } from '@/lib/api';
import { wallClockHm } from '@/lib/time-wallclock';

function fmtLocal(iso: string): string {
  if (!iso || iso === 'N/A') return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return wallClockHm(iso) || iso;
  return d.toLocaleString('ko-KR');
}

/** 브라우저 인쇄 대화상자로 요약 리포트 (PDF로 저장 가능) */
export function openPrintableSolarReport(
  solarData: SolarCalculationResponse,
  opts: { lat: number; lon: number; date: string; objectHeightM: number; title?: string }
): void {
  const { lat, lon, date, objectHeightM, title = 'SunPath 분석 리포트' } = opts;
  const s = solarData.summary;
  const w = window.open('', '_blank', 'noopener,noreferrer');
  if (!w) return;

  let maxGhi = -1;
  let maxGhiTime = '—';
  let minShadow = Infinity;
  let minShadowTime = '—';
  for (const p of solarData.series) {
    const hm = wallClockHm(p.timestamp);
    if (p.irradiance && p.irradiance.ghi > maxGhi) {
      maxGhi = p.irradiance.ghi;
      maxGhiTime = hm;
    }
    if (
      typeof p.shadow?.length === 'number' &&
      Number.isFinite(p.shadow.length) &&
      p.shadow.length > 0 &&
      p.shadow.length < minShadow
    ) {
      minShadow = p.shadow.length;
      minShadowTime = hm;
    }
  }

  const rows = solarData.series
    .filter((_, i) => i % Math.max(1, Math.floor(solarData.series.length / 24)) === 0)
    .slice(0, 24)
    .map((p) => {
      const ghi = p.irradiance?.ghi != null ? Math.round(p.irradiance.ghi) : '—';
      const poa = p.irradiance?.poa != null ? Math.round(p.irradiance.poa) : '—';
      const sh =
        p.shadow?.length != null && Number.isFinite(p.shadow.length)
          ? p.shadow.length.toFixed(2)
          : '—';
      return `<tr><td>${wallClockHm(p.timestamp)}</td><td>${p.sun.altitude.toFixed(2)}</td><td>${ghi}</td><td>${poa}</td><td>${sh}</td></tr>`;
    })
    .join('');

  w.document.write(`<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"/><title>${title}</title>
<style>
body{font-family:system-ui,sans-serif;padding:24px;color:#111;}
h1{font-size:1.25rem;} h2{font-size:1rem;margin-top:1.25rem;}
table{border-collapse:collapse;width:100%;margin-top:12px;font-size:12px;}
th,td{border:1px solid #ccc;padding:6px;text-align:left;}
th{background:#f3f4f6;}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;}
@media print{body{padding:0;}button{display:none}}
</style></head><body>
<h1>${title}</h1>
<p>위치: ${lat.toFixed(4)}, ${lon.toFixed(4)} · 날짜: ${date} · 물체 높이: ${objectHeightM} m</p>
<h2>하루 요약</h2>
<div class="grid">
<div>일출: ${fmtLocal(s.sunrise)}</div>
<div>남중: ${fmtLocal(s.solar_noon)}</div>
<div>일몰: ${fmtLocal(s.sunset)}</div>
<div>일장: ${s.day_length.toFixed(1)} 시간</div>
<div>최대 고도: ${s.max_altitude.toFixed(2)}°</div>
<div>총 일사: ${s.total_irradiance != null ? s.total_irradiance.toFixed(2) : '—'} kWh/m²</div>
<div>최대 GHI: ${maxGhi >= 0 ? `${Math.round(maxGhi)} W/m² @ ${maxGhiTime}` : '—'}</div>
<div>최소 그림자: ${Number.isFinite(minShadow) ? `${minShadow.toFixed(2)} m @ ${minShadowTime}` : '—'}</div>
</div>
<h2>시계열 (샘플)</h2>
<table><thead><tr><th>시각</th><th>고도(°)</th><th>GHI</th><th>POA</th><th>그림자(m)</th></tr></thead><tbody>${rows}</tbody></table>
<p style="margin-top:16px;font-size:11px;color:#666;">SunPath & Shadow Simulator — 브라우저 인쇄 또는 PDF 저장</p>
</body></html>`);
  w.document.close();
  w.focus();
  w.print();
}
