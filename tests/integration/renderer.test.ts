import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  applyRootState,
  clearMarks,
  CONTRAST_ATTR,
  PILL_CLASS,
  renderMark,
  SCHEME_ATTR,
  THEME_ATTR,
  TIER_ATTR,
} from '../../entrypoints/content/renderer/mark-renderer';
import { getMessages } from '../../src/i18n';
import { zh } from '../../src/i18n/zh';
import { DEFAULT_SETTINGS, parseSettings } from '../../src/storage/schema';
import { fixtureArticle, loadFixture } from '../helpers/fixture';

const labels = zh.pills;

describe('renderMark', () => {
  let doc: Document;

  beforeEach(() => {
    doc = loadFixture('timeline.html');
  });

  it('sets the tier data attribute per tier', () => {
    const article = fixtureArticle(doc, 'promoted-en');
    renderMark(article, 'hard', labels);
    expect(article.getAttribute(TIER_ATTR)).toBe('hard');

    renderMark(fixtureArticle(doc, 'soft-zh'), 'soft', labels);
    expect(fixtureArticle(doc, 'soft-zh').getAttribute(TIER_ATTR)).toBe('soft');

    renderMark(fixtureArticle(doc, 'organic-en'), 'organic', labels);
    expect(fixtureArticle(doc, 'organic-en').getAttribute(TIER_ATTR)).toBe('organic');
  });

  it('injects a localized pill into the header name row for ad tiers only', () => {
    const article = fixtureArticle(doc, 'promoted-zh');
    renderMark(article, 'hard', labels);

    const pill = article.querySelector(`.${PILL_CLASS}`);
    expect(pill?.textContent).toBe('硬广');
    expect(pill?.classList.contains(`${PILL_CLASS}--hard`)).toBe(true);
    expect(pill?.closest('[data-testid="User-Name"]')).not.toBeNull();

    const organic = fixtureArticle(doc, 'organic-en');
    renderMark(organic, 'organic', labels);
    expect(organic.querySelector(`.${PILL_CLASS}`)).toBeNull();
  });

  it('is idempotent: marking twice yields exactly one pill and reports no change', () => {
    const article = fixtureArticle(doc, 'promoted-en');
    expect(renderMark(article, 'hard', labels)).toBe(true);
    expect(renderMark(article, 'hard', labels)).toBe(false);
    expect(article.querySelectorAll(`.${PILL_CLASS}`)).toHaveLength(1);
  });

  it('swaps the pill when the tier changes', () => {
    const article = fixtureArticle(doc, 'soft-zh');
    renderMark(article, 'soft', labels);
    expect(renderMark(article, 'potential', labels)).toBe(true);

    const pills = article.querySelectorAll(`.${PILL_CLASS}`);
    expect(pills).toHaveLength(1);
    expect(pills[0]?.textContent).toBe('疑似');
    expect(article.getAttribute(TIER_ATTR)).toBe('potential');
  });

  it('pill text follows the explicit locale setting, English by default', () => {
    const article = fixtureArticle(doc, 'promoted-en');

    // Default settings carry locale 'en': pills render in English.
    renderMark(article, 'hard', getMessages(DEFAULT_SETTINGS.locale).pills);
    expect(article.querySelector(`.${PILL_CLASS}`)?.textContent).toBe('Ad');

    // Switching the setting to zh (clear + re-render, as the content
    // script does on settings change) swaps the pill text live.
    const zhSettings = parseSettings({ locale: 'zh' });
    clearMarks(doc);
    renderMark(article, 'hard', getMessages(zhSettings.locale).pills);
    expect(article.querySelector(`.${PILL_CLASS}`)?.textContent).toBe('硬广');
  });

  it('appends the pill to the article when the name row is missing', () => {
    doc.body.innerHTML = '<article data-testid="tweet"><div></div></article>';
    const article = doc.querySelector('article') as Element;
    renderMark(article, 'hard', labels);
    expect(article.querySelector(`.${PILL_CLASS}`)).not.toBeNull();
  });
});

describe('clearMarks', () => {
  it('removes all tier attributes and pills', () => {
    const doc = loadFixture('timeline.html');
    renderMark(fixtureArticle(doc, 'promoted-en'), 'hard', labels);
    renderMark(fixtureArticle(doc, 'organic-en'), 'organic', labels);

    clearMarks(doc);
    expect(doc.querySelectorAll(`[${TIER_ATTR}]`)).toHaveLength(0);
    expect(doc.querySelectorAll(`.${PILL_CLASS}`)).toHaveLength(0);
  });
});

describe('applyRootState', () => {
  afterEach(() => {
    document.documentElement.removeAttribute(SCHEME_ATTR);
    document.documentElement.removeAttribute(CONTRAST_ATTR);
    document.documentElement.removeAttribute(THEME_ATTR);
  });

  it('reflects scheme, contrast and theme on <html> when enabled', () => {
    applyRootState(document, DEFAULT_SETTINGS, 'dark');
    const root = document.documentElement;
    expect(root.getAttribute(SCHEME_ATTR)).toBe('glass');
    expect(root.getAttribute(CONTRAST_ATTR)).toBe('strong');
    expect(root.getAttribute(THEME_ATTR)).toBe('dark');
  });

  it('drops scheme/contrast attributes when disabled (visuals off)', () => {
    applyRootState(document, DEFAULT_SETTINGS, 'dark');
    applyRootState(document, { ...DEFAULT_SETTINGS, enabled: false }, 'light');
    const root = document.documentElement;
    expect(root.hasAttribute(SCHEME_ATTR)).toBe(false);
    expect(root.hasAttribute(CONTRAST_ATTR)).toBe(false);
    expect(root.getAttribute(THEME_ATTR)).toBe('light');
  });

  it('reflects non-default scheme/contrast', () => {
    applyRootState(
      document,
      { ...DEFAULT_SETTINGS, scheme: 'theater', contrast: 'normal' },
      'light',
    );
    expect(document.documentElement.getAttribute(SCHEME_ATTR)).toBe('theater');
    expect(document.documentElement.getAttribute(CONTRAST_ATTR)).toBe('normal');
  });
});
