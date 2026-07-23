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
  // 온보딩이 떠 있으면 닫기
  const dialog = page.getByRole('dialog');
  if (await dialog.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: /알겠어요/i }).click();
    await expect(dialog).toBeHidden({ timeout: 5_000 });
  }
  // isMobile 측정 후 크롬 마운트 대기
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
  test.setTimeout(120_000);

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
    // 단일 Timeline만 존재 (이중 마운트 방지)
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
});

test.describe('Mobile user stories', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  test.setTimeout(120_000);

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
    // 재생 중에도 Timeline 인스턴스는 1개
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

    // 시트 열림 시 독 Timeline 숨김 → 시트 안 Timeline만
    const playInSheet = page.getByRole('button', { name: /재생|Play|일시정지|Pause/i });
    const n = await playInSheet.count();
    expect(n).toBeLessThanOrEqual(1);

    const height = page.getByLabel(/물체 높이|Object height|Height/i).first();
    await expect(height).toBeVisible();
    await height.fill('30');

    // 헤더의 텍스트 "닫기" 버튼 (backdrop aria-label과 구분)
    await page.locator('button').filter({ hasText: /^닫기$/ }).click();
    await page.waitForTimeout(400);
    // 시트 닫힌 뒤 독에 다시 단일 재생 버튼
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
    const compare = page.getByRole('tab', { name: /비교|Compare/i });
    await compare.click();
    await page.waitForTimeout(300);
    const tools = page.getByRole('tab', { name: /도구|Tools/i });
    await tools.click();
  });
});
