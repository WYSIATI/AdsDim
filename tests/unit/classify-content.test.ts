import { describe, expect, it } from 'vitest';
import { classifyContent } from '../../src/detector/classify-content';

const DEFAULT_OPTIONS = { sensitivity: 0.5, keywords: [] as readonly string[] };

const verdict = (text: string, urls: readonly string[] = []) =>
  classifyContent({ text, urls }, DEFAULT_OPTIONS);

describe('classifyContent false-positive regressions', () => {
  it.each([
    // [description, text, urls]
    ['asking for a promo code', '有人有优惠码吗？求一个', []],
    ['discussing a sponsored event', 'The conference was sponsored by Acme, great talks', []],
    ['casual wechat mention', '刚跟朋友吃饭，他微信上说这家店不错', []],
    ['dm about sports', '私信我聊聊今天的比赛', []],
    ['single strong-domain url alone', 'check this out', ['amzn.to/3xYz']],
    ['single affiliate-param url alone', 'interesting read', ['https://a.example/?tag=x-20']],
    ['single weak url alone', 'my links', ['linktr.ee/someone']],
    ['plain organic post', 'what a lovely sunset over the bay', []],
  ] as const)('%s -> organic', (_description, text, urls) => {
    expect(verdict(text, urls).tier).toBeNull();
  });
});

describe('classifyContent true positives still fire', () => {
  it.each([
    // [description, text, urls, expectedTier]
    ['disclosure + discount code', '#ad New skincare routine! use code SAVE20', [], 'soft'],
    ['zh soft ad with contact', '面霜真的好用，优惠码 GLOW20,私信我拿货', [], 'soft'],
    ['disclosure-only post (single-category exception)', '#ad great product', [], 'potential'],
    [
      'promo keyword + affiliate url',
      '用我的优惠码 STYLE2024 可以打八折',
      ['amzn.to/3xYz?tag=stylekol-20'],
      'soft',
    ],
    ['weak keyword + weak url corroborate', 'Full review — link in bio', ['linktr.ee/me'], 'potential'],
  ] as const)('%s -> %s', (_description, text, urls, expectedTier) => {
    expect(verdict(text, urls).tier).toBe(expectedTier);
  });

  it('exposes only fired signals with their matches', () => {
    const result = verdict('#ad great product', ['amzn.to/3xYz']);
    expect(result.signals.map((signal) => signal.id)).toEqual(['keyword', 'url']);
    expect(result.signals[0]?.matches).toContain('#ad');
    expect(result.signals[1]?.matches).toContain('amzn.to/3xYz');
  });

  it('reports the raw score even when uncorroborated', () => {
    const single = verdict('有人有优惠码吗？求一个');
    expect(single.tier).toBeNull();
    expect(single.score).toBeGreaterThan(0);
  });

  it('honours user keywords and sensitivity', () => {
    const result = classifyContent(
      { text: '限时团购，私信下单', urls: [] },
      { sensitivity: 0.5, keywords: ['团购'] },
    );
    expect(result.tier).not.toBeNull();
  });
});
