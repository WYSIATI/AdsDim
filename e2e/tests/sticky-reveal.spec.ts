import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../fixtures';

/**
 * Regression specs for the user-confirmed sticky-reveal bug: on real x.com,
 * dimmed ads stayed revealed after hover/click + move-away. Root cause: X
 * programmatically re-focuses timeline tweets (keyboard-nav anchoring after
 * clicks and scrolling), Chromium applies `:focus-visible` to programmatic
 * focus whenever the session had no mousedown yet or the last input was a
 * key, and mouse movement never blurs the tweet — so a reveal keyed on
 * focus pseudo-classes latches indefinitely.
 */

/** Dimmed opacity of a hard ad under the defaults: glass + strong + dark. */
const DIMMED_OPACITY = '0.55';

/** Small viewport so the timeline is actually scrollable (content ~1000px). */
const VIEWPORT = { width: 1280, height: 600 };

const article = (page: Page, fixtureId: string): Locator =>
  page.locator(`article[data-fixture-id="${fixtureId}"]`);

const opacityOf = (locator: Locator): Promise<string> =>
  locator.evaluate((el) => getComputedStyle(el).getPropertyValue('opacity').trim());

const parkPointer = (page: Page): Promise<void> => page.mouse.move(5, 5);

const activeFixtureId = (page: Page): Promise<string | null> =>
  page.evaluate(() => document.activeElement?.getAttribute('data-fixture-id') ?? null);

/**
 * Trackpad flick that leaves the promoted article nearest the viewport top,
 * then waits for the fixture's X-like scroll-end handler to programmatically
 * focus it (the fixture mirrors X's keyboard-nav re-anchoring).
 */
const wheelAdToTop = async (page: Page, ad: Locator): Promise<void> => {
  const delta = await ad.evaluate((el) => Math.round(el.getBoundingClientRect().top));
  await page.mouse.move(640, 300);
  await page.mouse.wheel(0, delta);
  await expect.poll(() => activeFixtureId(page)).toBe('promoted-en');
};

const setUp = async (page: Page, url: string): Promise<Locator> => {
  await page.setViewportSize(VIEWPORT);
  await page.goto(url);
  await expect(page.locator('article[data-adsdim-tier]')).toHaveCount(8);
  const ad = article(page, 'promoted-en');
  await expect.poll(() => opacityOf(ad)).toBe(DIMMED_OPACITY);
  return ad;
};

test.describe('programmatic focus must never latch the ad reveal', () => {
  test('trackpad-only session: scroll-end refocus, then hover + move-away re-dims', async ({
    page,
    timelineUrl,
  }) => {
    const ad = await setUp(page, timelineUrl());

    // No mousedown has happened in this session, so Chromium applies
    // :focus-visible to the fixture's programmatic scroll-end focus.
    await wheelAdToTop(page, ad);

    await ad.hover({ position: { x: 450, y: 30 } });
    await expect.poll(() => opacityOf(ad)).toBe('1');

    // Moving the pointer away MUST re-dim the ad within 500ms, even though
    // the programmatically focused tweet is never blurred by mouse movement.
    await parkPointer(page);
    await page.waitForTimeout(500);
    expect(await opacityOf(ad)).toBe(DIMMED_OPACITY);
  });

  test('hover + click + keyboard scroll: refocus after scroll, move-away re-dims', async ({
    page,
    timelineUrl,
  }) => {
    const ad = await setUp(page, timelineUrl());
    await wheelAdToTop(page, ad);

    await ad.hover({ position: { x: 450, y: 30 } });
    await expect.poll(() => opacityOf(ad)).toBe('1');

    // Click parks programmatic focus on the ad's cell (fixture mimics X).
    await ad.click({ position: { x: 450, y: 30 } });
    expect(await ad.evaluate((el) => el.ownerDocument.activeElement === el.parentElement)).toBe(
      true,
    );

    // Press X's `j` nav key (no default action in the fixture, but it flips
    // Chromium's input modality back to keyboard), then jitter the trackpad
    // by 2px: the fixture's scroll-end refocus of the ad now carries
    // :focus-visible — exactly X's j/k-era behavior on real timelines.
    await page.keyboard.press('j');
    await page.mouse.wheel(0, 2);
    await expect.poll(() => activeFixtureId(page)).toBe('promoted-en');

    await parkPointer(page);
    await page.waitForTimeout(500);
    expect(await opacityOf(ad)).toBe(DIMMED_OPACITY);
  });
});
