import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../fixtures';

const ALL_ARTICLES = 8;

const article = (page: Page, fixtureId: string): Locator =>
  page.locator(`article[data-fixture-id="${fixtureId}"]`);

const waitForMarks = async (page: Page): Promise<void> => {
  await expect(page.locator('article[data-adsdim-tier]')).toHaveCount(ALL_ARTICLES);
  await expect(page.locator('article.adsdim-in')).toHaveCount(ALL_ARTICLES);
};

/** Computed style of the article itself (filter/opacity live on it). */
const styleOf = (locator: Locator, property: string): Promise<string> =>
  locator.evaluate((el, prop) => getComputedStyle(el).getPropertyValue(prop).trim(), property);

/** Computed style of one of the article's overlay pseudo-elements. */
const pseudoStyleOf = (
  locator: Locator,
  pseudo: '::before' | '::after',
  property: string,
): Promise<string> =>
  locator.evaluate(
    (el, { pseudoElement, prop }) => getComputedStyle(el, pseudoElement).getPropertyValue(prop).trim(),
    { pseudoElement: pseudo, prop: property },
  );

test.describe('tier marking on the timeline', () => {
  test('promoted articles are marked hard with a visible pill', async ({ page, timelineUrl }) => {
    await page.goto(timelineUrl());
    await waitForMarks(page);

    for (const fixtureId of ['promoted-en', 'promoted-zh', 'promoted-placement']) {
      const post = article(page, fixtureId);
      await expect(post).toHaveAttribute('data-adsdim-tier', 'hard');

      const pill = post.locator('.adsdim-pill');
      await expect(pill).toHaveCount(1);
      await expect(pill).toBeVisible();
      await expect(pill).toHaveText('Ad');
      await expect(pill).toHaveClass(/adsdim-pill--hard/);
      await expect(pill).toHaveAttribute('title', 'AdsDim: promoted label');
    }
  });

  test('soft and potential ads get their own tiers and pills', async ({ page, timelineUrl }) => {
    await page.goto(timelineUrl());
    await waitForMarks(page);

    const soft = article(page, 'soft-zh');
    await expect(soft).toHaveAttribute('data-adsdim-tier', 'soft');
    await expect(soft.locator('.adsdim-pill')).toHaveText('Sponsored');
    // The why tooltip lists the fired signal categories and matches.
    await expect(soft.locator('.adsdim-pill')).toHaveAttribute(
      'title',
      /^AdsDim: keyword\(优惠码\), url\(amzn\.to/,
    );

    const potential = article(page, 'potential-en');
    await expect(potential).toHaveAttribute('data-adsdim-tier', 'potential');
    await expect(potential.locator('.adsdim-pill')).toHaveText('Possible');
    await expect(potential.locator('.adsdim-pill')).toHaveAttribute(
      'title',
      /^AdsDim: keyword\(link in bio\), url\(linktr\.ee/,
    );
  });

  test('organic articles are tiered organic and never get a pill', async ({
    page,
    timelineUrl,
  }) => {
    await page.goto(timelineUrl());
    await waitForMarks(page);

    // The organic tier is marked explicitly: the glass scheme keys its
    // frosted overlay off data-adsdim-tier="organic". The quote repost
    // must stay organic even though the quoted card carries an affiliate
    // link and promo-code text.
    for (const fixtureId of ['organic-en', 'organic-zh-mentions-ad', 'quote-organic']) {
      const post = article(page, fixtureId);
      await expect(post).toHaveAttribute('data-adsdim-tier', 'organic');
      await expect(post.locator('.adsdim-pill')).toHaveCount(0);
    }
  });

  test('hard ads recede visually under default glass + strong (dark)', async ({
    page,
    timelineUrl,
  }) => {
    await page.goto(timelineUrl());
    await waitForMarks(page);
    await expect(page.locator('html')).toHaveAttribute('data-adsdim-theme', 'dark');

    const hard = article(page, 'promoted-en');
    // Transitions run 200ms in strong contrast; poll until settled.
    await expect.poll(() => styleOf(hard, 'opacity')).toBe('0.55');
    await expect.poll(() => styleOf(hard, 'filter')).toBe('saturate(0.15) brightness(0.5)');
  });

  test('genuine posts get the frosted glass overlay layers', async ({ page, timelineUrl }) => {
    await page.goto(timelineUrl());
    await waitForMarks(page);

    // Sheen on ::before, blur alone on ::after (scroll-gated via opacity).
    const organic = article(page, 'organic-en');
    await expect
      .poll(() => pseudoStyleOf(organic, '::after', 'backdrop-filter'))
      .toBe('blur(8px) saturate(1.2)');
    await expect.poll(() => pseudoStyleOf(organic, '::after', 'opacity')).toBe('1');
    await expect.poll(() => pseudoStyleOf(organic, '::before', 'opacity')).toBe('1');
    expect(await pseudoStyleOf(organic, '::before', 'backdrop-filter')).toBe('none');
    // Strong-contrast dark glass card: inset border + deep drop shadow.
    expect(await pseudoStyleOf(organic, '::before', 'box-shadow')).toContain('inset');

    // Ads must NOT get either overlay layer.
    const hard = article(page, 'promoted-en');
    expect(await pseudoStyleOf(hard, '::before', 'backdrop-filter')).toBe('none');
    expect(await pseudoStyleOf(hard, '::after', 'backdrop-filter')).toBe('none');
  });

  test('light pages are detected and flip the theme attribute', async ({ page, timelineUrl }) => {
    await page.goto(timelineUrl('light'));
    await waitForMarks(page);
    await expect(page.locator('html')).toHaveAttribute('data-adsdim-theme', 'light');
  });
});
