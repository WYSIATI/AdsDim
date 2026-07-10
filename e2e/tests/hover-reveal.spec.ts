import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../fixtures';

/** Dimmed opacity of a hard ad under the defaults: glass + strong + dark. */
const DIMMED_OPACITY = '0.55';

const article = (page: Page, fixtureId: string): Locator =>
  page.locator(`article[data-fixture-id="${fixtureId}"]`);

const opacityOf = (locator: Locator): Promise<string> =>
  locator.evaluate((el) => getComputedStyle(el).getPropertyValue('opacity').trim());

const waitForMarks = async (page: Page): Promise<void> => {
  await expect(page.locator('article[data-adsdim-tier]')).toHaveCount(7);
  await expect(page.locator('article.adsdim-in')).toHaveCount(7);
};

/** Parks the pointer on the page background, away from every article. */
const parkPointer = (page: Page): Promise<void> => page.mouse.move(5, 5);

/**
 * X's tweet articles are keyboard-focusable. The fixture mirrors that here
 * (instead of in timeline.html) so the vitest integration suite stays
 * byte-identical to the DOM shapes it asserts on.
 */
const makeArticleFocusable = (locator: Locator): Promise<void> =>
  locator.evaluate((el) => el.setAttribute('tabindex', '0'));

test.describe('hover reveal of dimmed ads', () => {
  test('hovering reveals the ad and leaving re-dims it', async ({ page, timelineUrl }) => {
    await page.goto(timelineUrl());
    await waitForMarks(page);

    const ad = article(page, 'promoted-en');
    await expect.poll(() => opacityOf(ad)).toBe(DIMMED_OPACITY);

    await ad.hover();
    await expect.poll(() => opacityOf(ad)).toBe('1');

    await parkPointer(page);
    await expect.poll(() => opacityOf(ad)).toBe(DIMMED_OPACITY);
  });

  test('a mouse click that parks focus inside the ad never sticks the reveal', async ({
    page,
    timelineUrl,
  }) => {
    await page.goto(timelineUrl());
    await waitForMarks(page);

    const ad = article(page, 'promoted-en');
    await makeArticleFocusable(ad);
    await expect.poll(() => opacityOf(ad)).toBe(DIMMED_OPACITY);

    await ad.click({ position: { x: 200, y: 30 } });
    await expect.poll(() => opacityOf(ad)).toBe('1');

    await parkPointer(page);
    // The click left :focus inside the article — exactly the state X restores
    // after visiting a post and navigating back. The reveal must not latch
    // onto it (regression guard against :focus-within-style rules).
    expect(await ad.evaluate((el) => el.contains(el.ownerDocument.activeElement))).toBe(true);
    await expect.poll(() => opacityOf(ad)).toBe(DIMMED_OPACITY);
  });

  test('the reveal survives a detail-page visit and SPA back-restore', async ({
    page,
    timelineUrl,
  }) => {
    await page.goto(timelineUrl());
    await waitForMarks(page);

    const ad = article(page, 'promoted-en');
    await makeArticleFocusable(ad);
    await expect.poll(() => opacityOf(ad)).toBe(DIMMED_OPACITY);

    // Click the ad (focus lands inside it), then simulate X's SPA navigation:
    // the timeline is hidden behind a detail view, and restored on "Back".
    await ad.click({ position: { x: 200, y: 30 } });
    await page.evaluate(() => {
      const main = document.querySelector('main');
      const timeline = main?.firstElementChild;
      if (!main || !(timeline instanceof HTMLElement)) throw new Error('fixture missing');
      timeline.style.display = 'none';
      const detail = document.createElement('div');
      detail.id = 'detail-view';
      detail.innerHTML =
        '<article role="article" data-testid="tweet"><div>' +
        '<div data-testid="User-Name"><span>VPN Global</span><span>@vpn_official</span></div>' +
        '<div data-testid="tweetText"><span>Experience the fastest VPN worldwide!</span></div>' +
        '</div></article>';
      main.appendChild(detail);
    });
    await expect(page.locator('#detail-view article[data-adsdim-tier]')).toHaveCount(1);

    await page.evaluate(() => {
      document.getElementById('detail-view')?.remove();
      const timeline = document.querySelector('main')?.firstElementChild;
      if (!(timeline instanceof HTMLElement)) throw new Error('fixture missing');
      timeline.style.display = '';
    });

    await parkPointer(page);
    await expect(ad).toHaveAttribute('data-adsdim-tier', 'hard');
    await expect.poll(() => opacityOf(ad)).toBe(DIMMED_OPACITY);
  });
});

test.describe('keyboard reveal of dimmed ads', () => {
  test('keyboard focus inside the ad reveals it; moving focus on re-dims it', async ({
    page,
    timelineUrl,
  }) => {
    await page.goto(timelineUrl());
    await waitForMarks(page);

    const ad = article(page, 'promoted-en');
    await expect.poll(() => opacityOf(ad)).toBe(DIMMED_OPACITY);

    // Tab from the top of the page until focus lands inside the promoted
    // article (its permalink anchor). Keyboard focus is :focus-visible, so
    // the ad must reveal for accessibility.
    const focusIsInsideAd = (): Promise<boolean> =>
      ad.evaluate((el) => el.contains(el.ownerDocument.activeElement));
    for (let i = 0; i < 10 && !(await focusIsInsideAd()); i += 1) {
      await page.keyboard.press('Tab');
    }
    expect(await focusIsInsideAd()).toBe(true);
    await expect.poll(() => opacityOf(ad)).toBe('1');

    // Tabbing onwards moves focus out of the article and the dim returns.
    for (let i = 0; i < 10 && (await focusIsInsideAd()); i += 1) {
      await page.keyboard.press('Tab');
    }
    expect(await focusIsInsideAd()).toBe(false);
    await expect.poll(() => opacityOf(ad)).toBe(DIMMED_OPACITY);
  });
});
