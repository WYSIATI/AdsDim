import type { SignalResult } from '../../types';

/**
 * Disclosure-format tokens: explicit ad labelling (hashtag disclosures and
 * "paid partnership"). These are the only keywords trusted on their own.
 */
export const DISCLOSURE_KEYWORDS: readonly string[] = [
  '#ad',
  '#sponsored',
  '#广告',
  '#推广',
  'paid partnership',
];

/** Strong commercial keywords: disclosures plus explicit promo-code phrasing. */
const STRONG_KEYWORDS: readonly string[] = [
  ...DISCLOSURE_KEYWORDS,
  '优惠码',
  '折扣码',
  '促销码',
  '邀请码',
  '注册码',
  '返利',
  'use code',
  'promo code',
  'discount code',
];

/**
 * Weaker hints that often accompany soft ads. Bare "sponsored" lives here:
 * posts frequently *talk about* sponsored things ("the conference was
 * sponsored by Acme") without being ads themselves.
 */
const WEAK_KEYWORDS: readonly string[] = [
  '#合作',
  '#带货',
  'gifted',
  'link in bio',
  'affiliate',
  'sponsored',
];

const STRONG_WEIGHT = 0.8;
const WEAK_WEIGHT = 0.4;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Word-boundary aware containment check. `#ad` must not match `#advice`,
 * `sponsored` must not match `unsponsored` nor `#sponsored` (the hashtag
 * variant is its own keyword, so bare words reject a leading `#`).
 *
 * Keywords containing CJK match as plain substrings instead: CJK has no word
 * boundaries, and the Latin-oriented trailing guard would reject real hits
 * like 优惠码5折 where a digit directly follows the keyword (live x.com
 * false negative, 2026-07).
 */
export function containsKeyword(haystack: string, keyword: string): boolean {
  if (/[^\x00-\x7f]/.test(keyword)) return haystack.includes(keyword);
  const prefixGuard = keyword.startsWith('#') ? '(?<![a-z0-9])' : '(?<![a-z0-9#])';
  const pattern = new RegExp(`${prefixGuard}${escapeRegExp(keyword)}(?![a-z0-9])`, 'i');
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
  const disclosure = strong.some((keyword) => DISCLOSURE_KEYWORDS.includes(keyword));

  return { id: 'keyword', score, matches: [...strong, ...weak, ...extra], disclosure };
}
