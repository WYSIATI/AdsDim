import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../fixtures';

const hardArticle = (page: Page): Locator => page.locator('article[data-fixture-id="promoted-en"]');

const styleOf = (locator: Locator, property: string): Promise<string> =>
  locator.evaluate((el, prop) => getComputedStyle(el).getPropertyValue(prop).trim(), property);

const waitForMarks = async (page: Page): Promise<void> => {
  await expect(page.locator('article[data-adsdim-tier]')).toHaveCount(8);
  await expect(page.locator('article.adsdim-in')).toHaveCount(8);
};

test('scheme and contrast changes flip root attributes and computed styles live', async ({
  page,
  timelineUrl,
  setSettings,
}) => {
  await page.goto(timelineUrl());
  await waitForMarks(page);

  const html = page.locator('html');
  const hard = hardArticle(page);

  // Defaults: glass + strong on a dark page.
  await expect(html).toHaveAttribute('data-adsdim-scheme', 'glass');
  await expect(html).toHaveAttribute('data-adsdim-contrast', 'strong');
  await expect(html).toHaveAttribute('data-adsdim-theme', 'dark');
  await expect.poll(() => styleOf(hard, 'opacity')).toBe('0.55');
  await expect.poll(() => styleOf(hard, 'filter')).toBe('saturate(0.15) brightness(0.5)');

  // glass -> theater (strong stays): house lights go down on ads.
  await setSettings({ scheme: 'theater', contrast: 'strong' });
  await expect(html).toHaveAttribute('data-adsdim-scheme', 'theater');
  await expect(hard).toHaveAttribute('data-adsdim-tier', 'hard');
  await expect.poll(() => styleOf(hard, 'opacity')).toBe('0.3');
  await expect
    .poll(() => styleOf(hard, 'filter'))
    .toBe('grayscale(1) brightness(0.55) blur(1.2px)');

  // strong -> normal within theater: softer dimming.
  await setSettings({ scheme: 'theater', contrast: 'normal' });
  await expect(html).toHaveAttribute('data-adsdim-contrast', 'normal');
  await expect.poll(() => styleOf(hard, 'opacity')).toBe('0.5');
  await expect.poll(() => styleOf(hard, 'filter')).toBe('grayscale(0.9) brightness(0.75)');

  // Back to glass at normal contrast: filter-only treatment, no fade.
  await setSettings({ scheme: 'glass', contrast: 'normal' });
  await expect(html).toHaveAttribute('data-adsdim-scheme', 'glass');
  await expect.poll(() => styleOf(hard, 'opacity')).toBe('1');
  await expect.poll(() => styleOf(hard, 'filter')).toBe('saturate(0.35) brightness(0.72)');
});

test('locale change swaps pill labels live', async ({ page, timelineUrl, setSettings }) => {
  await page.goto(timelineUrl());
  await waitForMarks(page);

  const pill = hardArticle(page).locator('.adsdim-pill');

  // Default locale is English, regardless of the browser language.
  await expect(pill).toHaveText('Ad');

  await setSettings({ locale: 'zh' });
  await expect(pill).toHaveText('硬广');

  await setSettings({ locale: 'en' });
  await expect(pill).toHaveText('Ad');
});

test('disabling the extension clears attributes and pills', async ({
  page,
  timelineUrl,
  setSettings,
}) => {
  await page.goto(timelineUrl());
  await waitForMarks(page);
  await expect(page.locator('.adsdim-pill')).not.toHaveCount(0);

  await setSettings({ enabled: false });

  await expect(page.locator('html')).not.toHaveAttribute('data-adsdim-scheme');
  await expect(page.locator('html')).not.toHaveAttribute('data-adsdim-contrast');
  await expect(page.locator('article[data-adsdim-tier]')).toHaveCount(0);
  await expect(page.locator('.adsdim-pill')).toHaveCount(0);
});
