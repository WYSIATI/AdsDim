import { expect, test } from '../fixtures';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type RectsById = Record<string, Rect>;

declare global {
  interface Window {
    __adsdimPreRects?: RectsById;
  }
}

const TOLERANCE_PX = 0.5;

const collectRects = (): RectsById =>
  Object.fromEntries(
    [...document.querySelectorAll('article[data-fixture-id]')].map((el) => {
      const { x, y, width, height } = el.getBoundingClientRect();
      return [el.getAttribute('data-fixture-id') ?? '', { x, y, width, height }];
    }),
  );

test('marking causes zero layout shift on any article', async ({ page, timelineUrl }) => {
  // Snapshot geometry at DOMContentLoaded — before the content script runs
  // (it is injected at document_idle, which fires strictly later).
  await page.addInitScript(() => {
    window.addEventListener('DOMContentLoaded', () => {
      window.__adsdimPreRects = Object.fromEntries(
        [...document.querySelectorAll('article[data-fixture-id]')].map((el) => {
          const { x, y, width, height } = el.getBoundingClientRect();
          return [el.getAttribute('data-fixture-id') ?? '', { x, y, width, height }];
        }),
      );
    });
  });

  await page.goto(timelineUrl());
  await expect(page.locator('article[data-adsdim-tier]')).toHaveCount(8);
  await expect(page.locator('article.adsdim-in')).toHaveCount(8);
  // Let the 200ms strong-contrast transitions fully settle.
  await page.waitForTimeout(700);

  const before = await page.evaluate(() => window.__adsdimPreRects);
  const after = await page.evaluate(collectRects);

  expect(before, 'pre-mark rects must have been captured at DOMContentLoaded').toBeTruthy();
  expect(Object.keys(after).sort()).toEqual(Object.keys(before ?? {}).sort());

  for (const [fixtureId, pre] of Object.entries(before ?? {})) {
    const post = after[fixtureId];
    expect(post, `article ${fixtureId} disappeared`).toBeTruthy();
    for (const axis of ['x', 'y', 'width', 'height'] as const) {
      expect
        .soft(Math.abs((post?.[axis] ?? Number.NaN) - pre[axis]), `${fixtureId} ${axis}`)
        .toBeLessThanOrEqual(TOLERANCE_PX);
    }
  }
});
