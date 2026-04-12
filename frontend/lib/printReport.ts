import type { SolarCalculationResponse } from '@/lib/api';

/** 브라우저 인쇄 대화상자로 요약 리포트 (PDF로 저장 가능) */
export function openPrintableSolarReport(
  solarData: SolarCalculationResponse,
  opts: { lat: number; lon: number; date: string; objectHeightM: number; title?: string }
): void {
  const { lat, lon, date, objectHeightM, title = 'SunPath 요약 리포트' } = opts;
  const s = solarData.summary;
  const w = window.open('', '_blank', 'noopener,noreferrer');
  if (!w) return;

  const rows = solarData.series
    .slice(0, 24)
    .map(
      (p) =>
        `<tr><td>${new Date(p.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</td><td>${p.sun.altitude.toFixed(2)}</td><td>${p.shadow?.length != null ? p.shadow.length.toFixed(2) : '—'}</td></tr>`
    )
    .join('');

  w.document.write(`<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"/><title>${title}</title>
<style>
body{font-family:system-ui,sans-serif;padding:24px;color:#111;}
h1{font-size:1.25rem;}
table{border-collapse:collapse;width:100%;margin-top:16px;font-size:12px;}
th,td{border:1px solid #ccc;padding:6px;text-align:left;}
th{background:#f3f4f6;}
@media print{body{padding:0;}button{display:none}}
</style></head><body>
<h1>${title}</h1>
<p>위치: ${lat.toFixed(4)}, ${lon.toFixed(4)} · 날짜: ${date} · 물체 높이: ${objectHeightM} m</p>
<p>일출: ${new Date(s.sunrise).toLocaleString('ko-KR')} · 일몰: ${new Date(s.sunset).toLocaleString('ko-KR')}</p>
<p>일조 시간: ${(s.day_length / 60).toFixed(1)} 시간 · 최대 태양 고도: ${s.max_altitude.toFixed(2)}°</p>
<table><thead><tr><th>시각</th><th>태양 고도(°)</th><th>그림자(m)</th></tr></thead><tbody>${rows}</tbody></table>
<p style="margin-top:16px;font-size:11px;color:#666;">SunPath & Shadow Simulator — 브라우저 인쇄 또는 PDF 저장을 사용하세요.</p>
</body></html>`);
  w.document.close();
  w.focus();
  w.print();
}
