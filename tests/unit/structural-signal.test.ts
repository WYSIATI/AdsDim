import { describe, expect, it } from 'vitest';
import { structuralSignal } from '../../src/detector/heuristics/structural-signal';

const NO_URLS: readonly string[] = [];

describe('structuralSignal components', () => {
  it.each([
    // [description, text, urls, expectedScore]
    ['hashtag flood (5)', '#deal #sale #promo #shop #new great product', NO_URLS, 0.5],
    ['hashtag flood zh + digits', '#优惠 #促销 #好物 #折扣 #1元购 快来', NO_URLS, 0.5],
    ['four hashtags stay silent', '#a #b #c #d nice day out', NO_URLS, 0],
    ['cashtag spam (2 distinct)', '$MOON $GEM both pumping', NO_URLS, 0.5],
    ['cashtag spam (repeated)', '$MOON up, buy $MOON now', NO_URLS, 0.5],
    ['single cashtag stays silent', '$TSLA earnings tomorrow', NO_URLS, 0],
    ['hype emoji cluster (3)', '🔥🔥🔥 huge move', NO_URLS, 0.5],
    ['mixed hype emoji cluster', 'to the moon 🚀💰💎', NO_URLS, 0.5],
    ['two emojis stay silent (enthusiasm guard)', 'what a game 🔥🔥', NO_URLS, 0],
    ['pointer emoji + url', 'grab it 👇', ['shop-deals.example/x'], 0.5],
    ['pointer emoji + inline url', 'details ⬇️ https://shop.example/x', NO_URLS, 0.5],
    ['pointer emoji without url stays silent', 'scroll down 👇 for the thread', NO_URLS, 0],
    ['url without pointer emoji stays silent', 'my write-up', ['blog.example/post'], 0],
    ['short text + two links', 'two drops', ['a-shop.example/x', 'b-shop.example/y'], 0.5],
    ['short text + one link stays silent', 'one drop', ['a-shop.example/x'], 0],
    [
      'short text + platform links stays silent',
      'thread below',
      ['t.co/abc', '/status/123', 'x.com/user'],
      0,
    ],
    [
      'long text + two links stays silent',
      'a genuinely long write-up about two sources I found useful this week, with citations',
      ['a.example/x', 'b.example/y'],
      0,
    ],
    ['plain organic post', 'lovely sunset over the bay tonight', NO_URLS, 0],
  ])('%s -> %d', (_description, text, urls, expectedScore) => {
    expect(structuralSignal(text, urls).score).toBeCloseTo(expectedScore, 5);
  });

  it('caps stacked components at 1', () => {
    const result = structuralSignal('$AA $BB 🚀🚀🚀 #a #b #c #d #e 👇', ['pump.example/x']);
    expect(result.score).toBe(1);
    expect(result.matches.length).toBeGreaterThanOrEqual(2);
  });

  it('is never disclosure-grade', () => {
    const result = structuralSignal('$AA $BB 🚀🚀🚀 #a #b #c #d #e 👇', ['pump.example/x']);
    expect(result.id).toBe('structural');
    expect(result.disclosure).toBe(false);
  });

  it('describes each fired component in matches', () => {
    const result = structuralSignal('$AA $BB pumping 🚀🚀🚀', NO_URLS);
    expect(result.matches).toContain('cashtag-spam(2)');
    expect(result.matches).toContain('hype-emoji(3)');
  });
});
