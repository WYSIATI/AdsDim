import { describe, expect, it } from 'vitest';
import { urlSignal } from '../../src/detector/heuristics/url-signal';

describe('urlSignal', () => {
  it.each([
    ['no urls', [], 0],
    ['plain link', ['https://example.com/article'], 0],
    ['amazon shortlink', ['amzn.to/3xYz'], 1],
    ['affiliate tag param', ['https://www.amazon.com/dp/B0?tag=me-20'], 1],
    ['aff_id param', ['https://shop.example.com/item?aff_id=42'], 1],
    ['utm affiliate campaign', ['https://x.example/?utm_campaign=affiliate'], 1],
    ['taobao storefront', ['https://item.taobao.com/item.htm?id=1'], 1],
    ['shopee storefront', ['https://shopee.tw/product/123'], 1],
    ['single shortener is weak', ['bit.ly/abc'], 0.5],
    ['single bio-link hub is weak', ['linktr.ee/someone'], 0.5],
    ['two weak urls saturate', ['bit.ly/a', 'tinyurl.com/b'], 1],
    ['status permalinks are not signals', ['/user/status/123456'], 0],
  ])('%s -> score %d', (_description, urls, expectedScore) => {
    expect(urlSignal(urls).score).toBeCloseTo(expectedScore, 5);
  });

  it('lists matched urls and is case-insensitive', () => {
    const result = urlSignal(['AMZN.TO/deal', 'https://ok.example']);
    expect(result.id).toBe('url');
    expect(result.matches).toEqual(['AMZN.TO/deal']);
  });
});
