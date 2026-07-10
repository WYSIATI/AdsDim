import type { SignalResult } from '../../types';

/** Disclosure-grade keywords: near-certain commercial intent. */
const STRONG_KEYWORDS: readonly string[] = [
  '#ad',
  '#sponsored',
  '#广告',
  '#推广',
  'sponsored',
  '优惠码',
  '折扣码',
  '促销码',
  'use code',
  'promo code',
  'discount code',
];

/** Weaker hints that often accompany soft ads. */
const WEAK_KEYWORDS: readonly string[] = [
  '#合作',
  '#带货',
  'gifted',
  'link in bio',
  '微信',
  'affiliate',
];

const STRONG_WEIGHT = 0.8;
const WEAK_WEIGHT = 0.4;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Word-boundary aware containment check. `#ad` must not match `#advice`,
 * `sponsored` must not match `unsponsored`. CJK keywords match as substrings
 * since CJK has no word boundaries.
 */
export function containsKeyword(haystack: string, keyword: string): boolean {
  const pattern = new RegExp(`(?<![a-z0-9])${escapeRegExp(keyword)}(?![a-z0-9])`, 'i');
  return pattern.test(haystack);
}

/** Scores commercial keywords in the tweet text. */
export function keywordSignal(text: string, extraKeywords: readonly string[] = []): SignalResult {
  const haystack = text.toLowerCase();
  const strong = STRONG_KEYWORDS.filter((k) => containsKeyword(haystack, k));
  const weak = WEAK_KEYWORDS.filter((k) => containsKeyword(haystack, k));
  const extra = extraKeywords
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0 && containsKeyword(haystack, k));

  const score = Math.min(
    1,
    (strong.length + extra.length) * STRONG_WEIGHT + weak.length * WEAK_WEIGHT,
  );

  return { id: 'keyword', score, matches: [...strong, ...weak, ...extra] };
}
