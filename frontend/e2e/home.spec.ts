import { test, expect } from '@playwright/test';

test.describe('Home', () => {
  test.setTimeout(120_000);

  test('loads and shows main title', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const title = page.getByRole('heading', { name: /SunPath/i });
    await expect(title).toBeVisible({ timeout: 90_000 });
  });
});
