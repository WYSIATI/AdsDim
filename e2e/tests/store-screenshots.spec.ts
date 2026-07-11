import type { Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '../fixtures';

/**
 * Chrome Web Store listing screenshots: exactly 1280x800, viewport-sized
 * (not full page). Written to store/screenshots/ for upload as-is.
 */
const SCREENSHOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../store/screenshots');
const STORE_VIEWPORT = { width: 1280, height: 800 };

const settle = async (page: Page): Promise<void> => {
  await expect(page.locator('article[data-adsdim-tier]')).toHaveCount(8);
  await expect(page.locator('article[data-adsdim-in]')).toHaveCount(8);
  // Let entrance transitions (200-400ms) finish before capturing.
  await page.waitForTimeout(800);
};

const captureStoreShot = async (page: Page, name: string): Promise<void> => {
  await page.setViewportSize(STORE_VIEWPORT);
  await settle(page);
  await page.screenshot({ path: resolve(SCREENSHOT_DIR, name) });
};

test.beforeAll(() => {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

test('store screenshot: glass + strong on dark (defaults)', async ({ page, timelineUrl }) => {
  await page.goto(timelineUrl());
  await captureStoreShot(page, 'store-1280x800-glass-strong-dark.png');
});

test('store screenshot: theater + strong on dark', async ({ page, timelineUrl, setSettings }) => {
  await setSettings({ scheme: 'theater', contrast: 'strong' });
  await page.goto(timelineUrl());
  await captureStoreShot(page, 'store-1280x800-theater-strong-dark.png');
});

test('store screenshot: glass + normal on light', async ({ page, timelineUrl, setSettings }) => {
  await setSettings({ scheme: 'glass', contrast: 'normal' });
  await page.goto(timelineUrl('light'));
  await captureStoreShot(page, 'store-1280x800-glass-normal-light.png');
});
