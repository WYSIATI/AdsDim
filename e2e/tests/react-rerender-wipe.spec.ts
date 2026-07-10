import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { FIXTURE_WIPE_DELAY_MS, type WipeMode } from '../helpers/fixture-server';

/**
 * Regression specs for the user-confirmed sticky bugs on real x.com that no
 * static fixture could reproduce: X's hover-triggered React re-renders
 * rewrite the tweet article's className wholesale (and, worst case, strip
 * unknown attributes), silently erasing AdsDim's injected state. No
 * childList mutation fires, so a childList-only observer never notices —
 * ads stay revealed and the organic glass vanishes, permanently.
 *
 * The fixture's `wipe` mode simulates that commit ~50ms after every article
 * mouseenter/mouseleave:
 * - `class` — className rewritten from the VDOM (drops all adsdim classes).
 *   Survived by keying marking state off data-* attributes, which React
 *   leaves alone on reconciliation.
 * - `attrs` — className wipe PLUS removal of all `data-adsdim-*` attributes.
 *   Recovered by the MutationObserver watching our own attributes and
 *   re-applying from the classification cache.
 */

/** Dimmed opacity of a hard ad under the defaults: glass + strong + dark. */
const DIMMED_OPACITY = '0.55';

/** The wipe commits 50ms after hover; recovery must land within 1s. */
const RECOVERY_MS = 1000;

const WIPE_MODES: readonly Exclude<WipeMode, 'none'>[] = ['class', 'attrs'];

const article = (page: Page, fixtureId: string): Locator =>
  page.locator(`article[data-fixture-id="${fixtureId}"]`);

const opacityOf = (locator: Locator): Promise<string> =>
  locator.evaluate((el) => getComputedStyle(el).getPropertyValue('opacity').trim());

/**
 * True while the organic frosted-glass sheen is actually painting: the
 * ::before layer must exist (content set — gone when the tier attribute is
 * wiped) AND be fully faded in. Checking opacity alone would pass vacuously
 * after an attribute wipe (no rules match, so opacity computes to 1).
 */
const glassSheenOn = (locator: Locator): Promise<boolean> =>
  locator.evaluate((el) => {
    const style = getComputedStyle(el, '::before');
    return style.content === '""' && style.opacity === '1';
  });

const parkPointer = (page: Page): Promise<void> => page.mouse.move(5, 5);

const goToWipeTimeline = async (page: Page, url: string, mode: WipeMode): Promise<void> => {
  await page.goto(`${url}&wipe=${mode}`);
  await expect(page.locator('article[data-adsdim-tier]')).toHaveCount(8);
};

for (const mode of WIPE_MODES) {
  test.describe(`React re-render wipe (${mode})`, () => {
    test('hovered ad re-dims within 1s after the wipe erases injected state', async ({
      page,
      timelineUrl,
    }) => {
      await goToWipeTimeline(page, timelineUrl(), mode);

      const ad = article(page, 'promoted-en');
      await expect.poll(() => opacityOf(ad)).toBe(DIMMED_OPACITY);

      // Hover reveals the ad; ~50ms later the simulated React commit wipes
      // AdsDim's classes (and, in attrs mode, its data attributes).
      await ad.hover({ position: { x: 450, y: 30 } });
      await expect.poll(() => opacityOf(ad)).toBe('1');
      await page.waitForTimeout(FIXTURE_WIPE_DELAY_MS * 3);

      // Moving away triggers another wipe on mouseleave. The ad MUST still
      // re-dim within 1s — this latched forever before the fix.
      await parkPointer(page);
      await page.waitForTimeout(RECOVERY_MS);
      expect(await opacityOf(ad)).toBe(DIMMED_OPACITY);
    });

    test('organic glass overlay returns within 1s after the wipe', async ({
      page,
      timelineUrl,
    }) => {
      await goToWipeTimeline(page, timelineUrl(), mode);

      const organic = article(page, 'organic-en');
      await expect.poll(() => glassSheenOn(organic)).toBe(true);

      // Hover → simulated React commit erases the injected state; the glass
      // dies instantly and, before the fix, never came back.
      await organic.hover({ position: { x: 300, y: 40 } });
      await page.waitForTimeout(FIXTURE_WIPE_DELAY_MS * 3);

      await parkPointer(page);
      await page.waitForTimeout(RECOVERY_MS);
      expect(await glassSheenOn(organic)).toBe(true);
      await expect(organic).toHaveAttribute('data-adsdim-tier', 'organic');
    });
  });
}
