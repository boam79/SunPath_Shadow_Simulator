import { test, expect } from '@playwright/test';

test.describe('API routes', () => {
  test('weather proxy returns JSON with hourly', async ({ request }) => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await request.get(`/api/weather?lat=37.5665&lon=126.9780&date=${today}`);
    expect(res.ok(), await res.text()).toBeTruthy();
    const data = await res.json();
    expect(data.hourly).toBeDefined();
    expect(Array.isArray(data.hourly.time)).toBeTruthy();
    expect(Array.isArray(data.hourly.cloudcover)).toBeTruthy();
  });

  test('weather proxy soft-fails for far-future dates (no 502)', async ({ request }) => {
    const res = await request.get('/api/weather?lat=37.5665&lon=126.9780&date=2099-12-21');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.unavailable === true || Array.isArray(data.hourly?.time)).toBeTruthy();
  });

  test('geocode search returns array or object', async ({ request }) => {
    const res = await request.get('/api/geocode?q=Seoul&type=search');
    expect(res.ok(), await res.text()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data) || typeof data === 'object').toBeTruthy();
  });

  test('legacy /api/proxy returns complete integrated JSON (no truncation)', async ({ request }) => {
    const res = await request.post('/api/proxy/api/v1/integrated/calculate', {
      data: {
        location: { lat: 37.5665, lon: 126.978 },
        datetime: { date: '2026-06-21', interval: 60 },
        object: { height: 10 },
      },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data.series)).toBeTruthy();
    expect(data.series.length).toBeGreaterThan(10);
    const noon = data.series.find((p: { timestamp?: string }) =>
      String(p.timestamp || '').includes('12:00')
    );
    expect(noon?.sun?.altitude).toBeGreaterThan(50);
    expect(typeof noon?.shadow?.length === 'number' || noon?.shadow?.length == null).toBeTruthy();
  });
});
