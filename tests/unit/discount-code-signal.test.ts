import { describe, expect, it } from 'vitest';
import { discountCodeSignal } from '../../src/detector/heuristics/discount-code-signal';

describe('discountCodeSignal', () => {
  it.each([
    ['zh discount code with value', '用我的优惠码 STYLE2024 立减50', 1],
    ['zh discount code with colon', '折扣码：SAVE10', 1],
    ['en use code', 'Use code SUMMER24 at checkout', 1],
    ['en use my code', 'use my code ABC-123 for 20% off', 1],
    ['en promo code phrase', 'There is a promo code available today', 1],
    ['coupon code phrase', 'grab this coupon code before it expires', 1],
  ])('%s -> 1', (_description, text, expected) => {
    expect(discountCodeSignal(text).score).toBe(expected);
  });

  it.each([
    ['plain text', 'lovely weather in taipei today'],
    ['code without offer phrasing', 'I write code every day'],
    ['zh mention without code token', '这次促销没有优惠'],
  ])('%s -> 0', (_description, text) => {
    const result = discountCodeSignal(text);
    expect(result.score).toBe(0);
    expect(result.matches).toEqual([]);
  });

  it('captures the matched snippet', () => {
    const result = discountCodeSignal('优惠码 STYLE2024 八折');
    expect(result.id).toBe('discount-code');
    expect(result.matches[0]).toContain('STYLE2024');
  });
});
