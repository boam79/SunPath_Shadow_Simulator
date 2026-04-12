import { test, expect } from '@playwright/test';

test.describe('API routes', () => {
  test('weather proxy returns JSON with hourly', async ({ request }) => {
    const res = await request.get('/api/weather?lat=37.5665&lon=126.9780&date=2026-04-12');
    expect(res.ok(), await res.text()).toBeTruthy();
    const data = await res.json();
    expect(data.hourly).toBeDefined();
    expect(Array.isArray(data.hourly.time)).toBeTruthy();
  });

  test('geocode search returns array or object', async ({ request }) => {
    const res = await request.get('/api/geocode?q=Seoul&type=search');
    expect(res.ok(), await res.text()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data) || typeof data === 'object').toBeTruthy();
  });
});
