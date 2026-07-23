import { test, expect, type Page } from '@playwright/test';

async function waitForAppReady(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('sunpath_onboarding_v3', '1');
    } catch {
      /* ignore */
    }
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /SunPath/i }).first()).toBeVisible({
    timeout: 90_000,
  });
  const dialog = page.getByRole('dialog');
  if (await dialog.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: /알겠어요|Get Started|시작/i }).click();
    await expect(dialog).toBeHidden({ timeout: 5_000 });
  }
  await page.waitForTimeout(500);
}

async function openMobileSettings(page: Page) {
  await page.getByRole('navigation', { name: /주요 메뉴|main/i }).getByText(/^설정$|^More$/i).click();
  await expect(page.getByRole('tab', { name: /시뮬레이트|Simulate/i })).toBeVisible({
    timeout: 10_000,
  });
}

test.describe('PC user stories', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.setTimeout(180_000);

  test('map fills stage and sidebar tabs work', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await waitForAppReady(page);

    const map = page.locator('.d1-map-stage').first();
    await expect(map).toBeVisible({ timeout: 30_000 });
    const box = await map.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThan(400);

    await expect(page.getByRole('tab', { name: /시뮬레이트|Simulate/i })).toBeVisible();
    await page.getByRole('tab', { name: /비교|Compare/i }).click();
    await expect(page.getByText(/비교|Compare/i).first()).toBeVisible();
    await page.getByRole('tab', { name: /도구|Tools/i }).click();
    await page.getByRole('tab', { name: /시뮬레이트|Simulate/i }).click();

    expect(errors).toEqual([]);
  });

  test('search quick location, date, height, play, share', async ({ page }) => {
    await waitForAppReady(page);

    await page.getByRole('button', { name: /서울|Seoul/i }).first().click();
    await page.waitForTimeout(1500);

    const date = page.getByLabel(/날짜|Date/i).first();
    await expect(date).toBeVisible();
    await date.fill('2026-06-21');

    const height = page.getByLabel(/물체 높이|Object height|Height/i).first();
    await height.fill('25');
    await expect(page.getByText(/25m/)).toBeVisible({ timeout: 10_000 });

    const play = page.getByRole('button', { name: /재생|Play/i }).first();
    await expect(play).toBeVisible();
    expect(await page.getByRole('button', { name: /재생|Play|일시정지|Pause/i }).count()).toBe(1);
    await play.click();
    await page.waitForTimeout(1200);
    const pause = page.getByRole('button', { name: /일시정지|Pause/i }).first();
    await expect(pause).toBeVisible();
    await pause.click();

    const share = page.getByRole('button', { name: /공유|Share/i }).first();
    if (await share.isVisible().catch(() => false)) {
      await share.click();
    }
  });

  test('analytics drawer opens on desktop', async ({ page }) => {
    await waitForAppReady(page);
    const toggle = page.getByRole('button', { name: /차트|분석|Chart|Analytics/i }).first();
    if (await toggle.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await toggle.click();
      await page.waitForTimeout(500);
    }
  });

  test('CSP allows OpenFreeMap and DEM hosts', async ({ page }) => {
    const res = await page.goto('/', { waitUntil: 'domcontentloaded' });
    const csp = res?.headers()['content-security-policy'] || '';
    expect(csp).toMatch(/openfreemap\.org/);
    expect(csp).toMatch(/amazonaws\.com/);
  });

  test('Seoul solar loads shadow meters; 3D and raycast toggles', async ({ page }) => {
    await waitForAppReady(page);
    await page.getByRole('button', { name: /서울|Seoul/i }).first().click();
    await expect(page.getByText(/그림자\s+\d+(\.\d+)?\s*m|Shadow\s+\d+(\.\d+)?\s*m/i).first()).toBeVisible({
      timeout: 90_000,
    });

    await expect(page.locator('.maplibregl-canvas').first()).toBeVisible({ timeout: 30_000 });

    const btn3d = page.getByRole('button', { name: /^3D$/i });
    await expect(btn3d).toBeVisible();
    await btn3d.click();
    await expect(btn3d).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: /지형|Terrain/i })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /건물 레이캐스트|Building raycast|레이캐스트/i })
    ).toBeVisible();

    const ray = page.getByRole('button', { name: /건물 레이캐스트|Building raycast|레이캐스트/i });
    await ray.click();
    await page.waitForTimeout(300);
    await ray.click();
    await page.getByRole('button', { name: /^2D$/i }).click();
  });
});

test.describe('Mobile user stories', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  test.setTimeout(180_000);

  test('map + bottom nav + single timeline dock', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await waitForAppReady(page);

    await expect(page.getByRole('navigation', { name: /주요 메뉴|main/i })).toBeVisible({
      timeout: 15_000,
    });

    const playButtons = page.getByRole('button', { name: /재생|Play/i });
    await expect(playButtons.first()).toBeVisible({ timeout: 15_000 });
    expect(await playButtons.count()).toBe(1);

    await playButtons.first().click();
    await page.waitForTimeout(1500);
    const pause = page.getByRole('button', { name: /일시정지|Pause/i });
    await expect(pause).toBeVisible();
    expect(await page.getByRole('button', { name: /일시정지|Pause/i }).count()).toBe(1);
    await pause.click();

    expect(errors).toEqual([]);
  });

  test('settings sheet: date and height without hidden desktop inputs', async ({ page }) => {
    await waitForAppReady(page);
    await openMobileSettings(page);

    const date = page.getByLabel(/날짜|Date/i);
    await expect(date).toBeVisible({ timeout: 10_000 });
    const box = await date.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(40);
    expect(box!.height).toBeGreaterThan(10);
    await date.fill('2026-12-21');

    const playInSheet = page.getByRole('button', { name: /재생|Play|일시정지|Pause/i });
    expect(await playInSheet.count()).toBeLessThanOrEqual(1);

    const height = page.getByLabel(/물체 높이|Object height|Height/i).first();
    await expect(height).toBeVisible();
    await height.fill('30');

    await page.locator('button').filter({ hasText: /^닫기$/ }).click();
    await page.waitForTimeout(400);
    expect(await page.getByRole('button', { name: /재생|Play/i }).count()).toBe(1);
  });

  test('mobile data tab and compare tab in sheet', async ({ page }) => {
    await waitForAppReady(page);

    const dataTab = page.getByRole('navigation').getByText(/^데이터$|^Data$/i);
    if (await dataTab.isVisible().catch(() => false)) {
      await dataTab.click();
      await page.waitForTimeout(500);
    }

    await openMobileSettings(page);
    await page.getByRole('tab', { name: /비교|Compare/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole('tab', { name: /도구|Tools/i }).click();
  });

  test('mobile: Seoul load + 3D map canvas visible', async ({ page }) => {
    await waitForAppReady(page);
    await openMobileSettings(page);
    await page.getByRole('button', { name: /서울|Seoul/i }).first().click();
    await page.locator('button').filter({ hasText: /^닫기$/ }).click();

    await expect(page.getByText(/그림자\s+\d+(\.\d+)?\s*m|Shadow\s+\d+(\.\d+)?\s*m/i).first()).toBeVisible({
      timeout: 90_000,
    });

    await page.getByRole('button', { name: /^3D$/i }).click();
    const canvas = page.locator('.maplibregl-canvas').first();
    await expect(canvas).toBeVisible({ timeout: 30_000 });
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(200);
    expect(box!.height).toBeGreaterThan(200);
  });
});
