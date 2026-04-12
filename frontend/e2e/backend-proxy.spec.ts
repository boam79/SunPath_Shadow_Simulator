import { test, expect } from '@playwright/test';

test.describe('Backend rewrite proxy', () => {
  test('health via /api/backend', async ({ request }) => {
    const res = await request.get('/api/backend/health');
    expect(res.ok(), await res.text()).toBeTruthy();
    const j = await res.json();
    expect(j.status).toBe('healthy');
  });

  test('integrated calculate via /api/backend (v1)', async ({ request }) => {
    const res = await request.post('/api/backend/api/v1/integrated/calculate', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        location: { lat: 37.5665, lon: 126.978, altitude: 0 },
        datetime: { date: '2026-04-12', start_time: '12:00', end_time: '12:00', interval: 60 },
        object: { height: 10 },
        options: { atmosphere: true, precision: 'high' },
      },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    const j = await res.json();
    expect(j.series?.length).toBeGreaterThan(0);
  });
});
