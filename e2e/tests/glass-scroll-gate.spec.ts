import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { diffRatio, shoot, type ClipBox } from '../helpers/pixels';

/**
 * Regression spec for the user-confirmed glass-vanish bug: on real x.com the
 * organic glass overlay disappeared during hover + trackpad micro-scrolls and
 * never came back. Two mechanisms combine:
 *
 * 1. Gate starvation: a continuous stream of 1-3px scroll events keeps
 *    re-arming the 150ms idle timer, so the gate holds for the whole
 *    interaction.
 * 2. Chrome repaint quirk: when `backdrop-filter` is toggled via a rule
 *    change, the blur sometimes never re-renders — computed style claims the
 *    filter is active while the pixels stay unblurred.
 *
 * Hence the pixel-evidence assertions: the striped article background behind
 * the overlay must actually be blurred again after the burst, per screenshot
 * comparison, not per computed style.
 */

/** Small viewport so the timeline is actually scrollable (content ~1000px). */
const VIEWPORT = { width: 1280, height: 600 };

/** Per-channel delta above which a pixel counts as different. */
const PIXEL_THRESHOLD = 8;

/** Trackpad-like micro-scroll jitter; partial sums never go negative and end at 0. */
const MICRO_DELTAS = [2, -1, 3, -2, 1, -3, 2, -2, 3, -1, 2, -2, 1, -1, 3, -3, 2, -2, 1, -1, -2];

/** Viewport box of the organic article's glass overlay (CSS inset: 4px 8px). */
const overlayBox = (page: Page): Promise<ClipBox> =>
  page.evaluate(() => {
    const el = document.querySelector('article[data-fixture-id="organic-en"]');
    if (!el) throw new Error('fixture article missing');
    const rect = el.getBoundingClientRect();
    return { x: rect.x + 8, y: rect.y + 4, width: rect.width - 16, height: rect.height - 8 };
  });

test('glass blur is actually rendering again after hover + micro-scroll bursts', async ({
  page,
  timelineUrl,
}) => {
  await page.setViewportSize(VIEWPORT);
  await page.goto(timelineUrl());
  await expect(page.locator('article[data-adsdim-tier]')).toHaveCount(8);
  const organic = page.locator('article[data-fixture-id="organic-en"]');
  await expect(organic).toHaveAttribute('data-adsdim-tier', 'organic');
  await expect(organic).toHaveAttribute('data-adsdim-in', '1');

  // Let the 400ms entrance transitions fully settle, then park the pointer
  // so the reference and final screenshots share identical hover state.
  await page.waitForTimeout(800);
  await page.mouse.move(5, 5);
  const clip = await overlayBox(page);
  const reference = await shoot(page, clip);

  // Sanity: prove the pixel assertion can see blur loss at all. Forcing the
  // scroll gate on must visibly sharpen the stripes behind the overlay —
  // otherwise the final assertion below would be vacuous.
  await page.evaluate(() => document.documentElement.classList.add('adsdim-scrolling'));
  await page.waitForTimeout(250);
  const gated = await shoot(page, clip);
  await page.evaluate(() => document.documentElement.classList.remove('adsdim-scrolling'));
  expect(await diffRatio(page, reference, gated, PIXEL_THRESHOLD)).toBeGreaterThan(0.02);
  await page.waitForTimeout(800);

  // Hover the organic post and jitter-scroll like a trackpad: a continuous
  // stream of tiny deltas that keeps re-arming the 150ms idle gate for the
  // whole interaction (starvation). Net scroll movement is zero.
  await organic.hover({ position: { x: 300, y: 40 } });
  for (const delta of MICRO_DELTAS) {
    await page.mouse.wheel(0, delta);
    await page.waitForTimeout(40);
  }
  await page.mouse.move(5, 5);

  // The gate releases 150ms after the last scroll event; give the compositor
  // ample time, then demand pixel-identical glass (small anti-alias slack).
  await page.waitForTimeout(900);
  const after = await shoot(page, clip);
  expect(await diffRatio(page, reference, after, PIXEL_THRESHOLD)).toBeLessThan(0.01);
});
