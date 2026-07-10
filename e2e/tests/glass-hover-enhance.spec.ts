import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../fixtures';

/**
 * Hovering an ORGANIC post in the glass scheme must ENHANCE the glass, never
 * remove it: sheen gradient alphas x1.3 and border ring alpha x1.5 versus the
 * contrast level's base values, with the blur untouched.
 *
 * Defaults under test: glass + strong + dark. Base sheen leads with
 * rgba(255,255,255,0.11) and the ring is rgba(255,255,255,0.14); hover must
 * read ~0.143 and ~0.21. Alphas are parsed numerically because Chromium
 * serializes computed alpha at 8-bit precision.
 */

const RING_SEGMENT = '0px 0px 0px 1px';

/** Leading white alpha of the overlay's sheen gradient. */
const sheenAlpha = (locator: Locator): Promise<number> =>
  locator.evaluate((el) => {
    const background = getComputedStyle(el, '::before').backgroundImage;
    const match = background.match(/rgba\(255, 255, 255, ([\d.]+)\)/);
    return match ? Number(match[1]) : Number.NaN;
  });

/** Alpha of the 1px inset border ring in the overlay's box-shadow. */
const ringAlpha = (locator: Locator, segment: string): Promise<number> =>
  locator.evaluate((el, marker) => {
    const shadow = getComputedStyle(el, '::before').boxShadow;
    const part = shadow.split(/,(?![^(]*\))/).find((entry) => entry.includes(marker));
    const match = part?.match(/rgba\(\d+, \d+, \d+, ([\d.]+)\)/);
    return match ? Number(match[1]) : Number.NaN;
  }, segment);

const blurOf = (locator: Locator): Promise<string> =>
  locator.evaluate((el) =>
    getComputedStyle(el, '::after').getPropertyValue('backdrop-filter').trim(),
  );

const parkPointer = (page: Page): Promise<void> => page.mouse.move(5, 5);

test('hovering an organic post strengthens the glass; unhover restores it', async ({
  page,
  timelineUrl,
}) => {
  await page.goto(timelineUrl());
  await expect(page.locator('article[data-adsdim-tier]')).toHaveCount(8);
  const organic = page.locator('article[data-fixture-id="organic-en"]');
  await expect(organic).toHaveAttribute('data-adsdim-in', '1');
  await parkPointer(page);

  // Base: strong-contrast dark glass.
  await expect.poll(() => sheenAlpha(organic)).toBeCloseTo(0.11, 2);
  await expect.poll(() => ringAlpha(organic, RING_SEGMENT)).toBeCloseTo(0.14, 2);

  await organic.hover({ position: { x: 300, y: 40 } });
  await expect.poll(() => sheenAlpha(organic)).toBeCloseTo(0.143, 2);
  await expect.poll(() => ringAlpha(organic, RING_SEGMENT)).toBeCloseTo(0.21, 2);
  // The blur layer is untouched by the hover enhancement.
  expect(await blurOf(organic)).toBe('blur(8px) saturate(1.2)');

  await parkPointer(page);
  await expect.poll(() => sheenAlpha(organic)).toBeCloseTo(0.11, 2);
  await expect.poll(() => ringAlpha(organic, RING_SEGMENT)).toBeCloseTo(0.14, 2);
});
