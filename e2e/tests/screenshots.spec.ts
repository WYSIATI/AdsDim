import type { Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '../fixtures';

const SCREENSHOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../design/screenshots');

const settle = async (page: Page): Promise<void> => {
  await expect(page.locator('article[data-adsdim-tier]')).toHaveCount(8);
  await expect(page.locator('article.adsdim-in')).toHaveCount(8);
  // Let entrance transitions (200-400ms) finish before capturing.
  await page.waitForTimeout(800);
};

test.beforeAll(() => {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

test('screenshot: glass + strong on dark (defaults)', async ({ page, timelineUrl }) => {
  await page.goto(timelineUrl());
  await settle(page);
  await page.screenshot({
    path: resolve(SCREENSHOT_DIR, 'e2e-glass-strong-dark.png'),
    fullPage: true,
  });
});

test('screenshot: theater + strong on dark', async ({ page, timelineUrl, setSettings }) => {
  await setSettings({ scheme: 'theater', contrast: 'strong' });
  await page.goto(timelineUrl());
  await settle(page);
  await page.screenshot({
    path: resolve(SCREENSHOT_DIR, 'e2e-theater-strong-dark.png'),
    fullPage: true,
  });
});

test('screenshot: glass + normal on light', async ({ page, timelineUrl, setSettings }) => {
  await setSettings({ scheme: 'glass', contrast: 'normal' });
  await page.goto(timelineUrl('light'));
  await settle(page);
  await page.screenshot({
    path: resolve(SCREENSHOT_DIR, 'e2e-glass-normal-light.png'),
    fullPage: true,
  });
});
