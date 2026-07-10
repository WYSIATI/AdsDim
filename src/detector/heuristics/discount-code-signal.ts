import type { SignalResult } from '../../types';

/** Patterns for "use my code XYZ" style promotions, zh + en. */
const CODE_PATTERNS: readonly RegExp[] = [
  // Tolerate short interludes between the noun and the code itself, e.g.
  // 优惠码5折:DEAL50OFF or 邀请码 TRUSTBNB (live x.com false negatives).
  /(?:优惠码|折扣码|促销码|折扣代码|邀请码|注册码)[^,，。;；!！\n]{0,8}?[A-Za-z0-9-]{3,}/,
  /\b(?:use|with|using)\s+(?:my\s+)?code\s+[A-Z0-9-]{3,}/i,
  /\b(?:promo|coupon|discount|referral)\s+code\b/i,
];

/** Detects explicit discount / referral code offers in the tweet text. */
export function discountCodeSignal(text: string): SignalResult {
  const matches = CODE_PATTERNS.flatMap((pattern) => {
    const match = text.match(pattern);
    return match ? [match[0]] : [];
  });
  return { id: 'discount-code', score: matches.length > 0 ? 1 : 0, matches };
}
