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

  it('detects the label span inside a placementTracking wrapper', () => {
    expect(detectHardAd(fixtureArticle(doc, 'promoted-placement'))).toBe(true);
  });

  it('does not convict a bare placementTracking wrapper (organic video)', () => {
    document.body.innerHTML = `
      <article data-testid="tweet">
        <div data-testid="User-Name"><span>Video Poster</span><span>@videoposter</span></div>
        <div data-testid="tweetText"><span>Check out this sunset timelapse!</span></div>
        <div data-testid="placementTracking"><div><span>0:42</span></div></div>
      </article>`;
    const article = document.querySelector('article') as Element;
    expect(detectHardAd(article)).toBe(false);
  });

  it('does not convict a display name that equals a label word', () => {
    document.body.innerHTML = `
      <article data-testid="tweet">
        <div data-testid="User-Name">
          <a href="/promo_account"><span>推广</span><span>@promo_account</span></a>
        </div>
        <div data-testid="tweetText"><span>今天天气不错</span></div>
      </article>`;
    const article = document.querySelector('article') as Element;
    expect(detectHardAd(article)).toBe(false);
  });

  it('does not convict label words inside a quoted card', () => {
    document.body.innerHTML = `
      <article data-testid="tweet">
        <div data-testid="tweetText"><span>Interesting take below</span></div>
        <div role="link">
          <div><span>广告</span><span>@ad_watchdog</span></div>
          <div data-testid="tweetText"><span>Quoted body</span></div>
        </div>
      </article>`;
    const article = document.querySelector('article') as Element;
    expect(detectHardAd(article)).toBe(false);
  });

  it('does not convict label-like text inside anchors (link cards)', () => {
    document.body.innerHTML = `
      <article data-testid="tweet">
        <div data-testid="tweetText"><span>Good read on the ad industry</span></div>
        <a href="https://news.example.com/story"><span>Ad</span><span>news.example.com</span></a>
      </article>`;
    const article = document.querySelector('article') as Element;
    expect(detectHardAd(article)).toBe(false);
  });

  it('still detects a real badge span outside anchors and name rows', () => {
    document.body.innerHTML = `
      <article data-testid="tweet">
        <div data-testid="User-Name">
          <a href="/brand"><span>Brand</span><span>@brand</span></a>
        </div>
        <div><span>Ad</span></div>
        <div data-testid="tweetText"><span>Our new product is here.</span></div>
      </article>`;
    const article = document.querySelector('article') as Element;
    expect(detectHardAd(article)).toBe(true);
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
