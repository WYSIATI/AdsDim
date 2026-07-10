import { beforeEach, describe, expect, it } from 'vitest';
import { detectHardAd } from '../../src/detector/hard-ad';
import { fixtureArticle, loadFixture } from '../helpers/fixture';

describe('detectHardAd', () => {
  let doc: Document;

  beforeEach(() => {
    doc = loadFixture('timeline.html');
  });

  it('detects the EN "Ad" badge rendered as a standalone span', () => {
    expect(detectHardAd(fixtureArticle(doc, 'promoted-en'))).toBe(true);
  });

  it('detects the ZH 广告 label in the socialContext banner', () => {
    expect(detectHardAd(fixtureArticle(doc, 'promoted-zh'))).toBe(true);
  });

  it('detects the placementTracking wrapper', () => {
    expect(detectHardAd(fixtureArticle(doc, 'promoted-placement'))).toBe(true);
  });

  it('ignores organic posts', () => {
    expect(detectHardAd(fixtureArticle(doc, 'organic-en'))).toBe(false);
  });

  it('does not fire on 广告 appearing inside the tweet text body', () => {
    expect(detectHardAd(fixtureArticle(doc, 'organic-zh-mentions-ad'))).toBe(false);
  });

  it('does not fire on soft-ad posts without a platform badge', () => {
    expect(detectHardAd(fixtureArticle(doc, 'soft-zh'))).toBe(false);
  });

  it('ignores long spans that merely contain a label word', () => {
    document.body.innerHTML = `
      <article data-testid="tweet">
        <div><span>This whole product category is one big ad, honestly speaking</span></div>
      </article>`;
    const article = document.querySelector('article') as Element;
    expect(detectHardAd(article)).toBe(false);
  });
});
