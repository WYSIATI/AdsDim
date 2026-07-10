import { describe, expect, it } from 'vitest';
import { containsKeyword, keywordSignal } from '../../src/detector/heuristics/keyword-signal';

describe('containsKeyword', () => {
  it.each([
    ['check out #ad today', '#ad', true],
    ['#advice for you', '#ad', false],
    ['this is sponsored content', 'sponsored', true],
    ['unsponsored review', 'sponsored', false],
    ['#sponsored collab', 'sponsored', false],
    ['#sponsored collab', '#sponsored', true],
    ['我的优惠码在这里', '优惠码', true],
    ['USE CODE now', 'use code', true],
  ])('%j contains %j -> %s', (haystack, keyword, expected) => {
    expect(containsKeyword(haystack.toLowerCase(), keyword)).toBe(expected);
  });
});

describe('keywordSignal', () => {
  it.each([
    // [description, text, expectedScore]
    ['no keywords', 'just a normal post about cats', 0],
    ['single strong keyword', 'honest review #ad', 0.8],
    ['single weak keyword', 'full review, link in bio', 0.4],
    ['strong + weak', '#ad gifted by the brand', 1],
    ['two strong keywords capped at 1', '#ad #sponsored', 1],
    ['zh strong keyword', '用我的优惠码 STYLE2024', 0.8],
    ['zh hashtag disclosure', '#广告 新品上市', 0.8],
    ['weak zh collab tag', '#合作 内容', 0.4],
    ['plain 广告 mention is not a keyword', '新广告法实施了', 0],
    ['bare sponsored is only a weak hint', 'The conference was sponsored by Acme, great talks', 0.4],
    ['hashtag sponsored is strong, not double counted', 'great collab #sponsored', 0.8],
    ['paid partnership disclosure is strong', 'Paid partnership with Acme Skincare', 0.8],
    ['casual wechat mention is not a keyword', '刚跟朋友吃饭，他微信上说这家店不错', 0],
  ])('%s -> score %d', (_description, text, expectedScore) => {
    expect(keywordSignal(text).score).toBeCloseTo(expectedScore, 5);
  });

  it('reports which keywords matched', () => {
    const result = keywordSignal('review time #ad, item was gifted');
    expect(result.id).toBe('keyword');
    expect(result.matches).toContain('#ad');
    expect(result.matches).toContain('gifted');
  });

  it('honours user-defined extra keywords as strong signals', () => {
    const result = keywordSignal('限时团购开始啦', ['团购']);
    expect(result.score).toBeCloseTo(0.8, 5);
    expect(result.matches).toContain('团购');
  });

  it('ignores empty extra keywords', () => {
    expect(keywordSignal('anything', ['', '  ']).score).toBe(0);
  });
});
