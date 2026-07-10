import type { SignalResult } from '../../types';

/**
 * Concrete code offers: an actual redeemable token is present ("use code
 * SAVE20", 优惠码5折:DEAL50OFF, "code: GLOW20"). Nobody hands out discount
 * codes conversationally, so these count as disclosure-grade evidence and
 * can mark a post without a second signal category. Short interludes
 * between the noun and the code are tolerated (live x.com false negatives).
 */
const TOKEN_PATTERNS: readonly RegExp[] = [
  /(?:优惠码|折扣码|促销码|折扣代码|邀请码|注册码)[^,，。;；!！\n]{0,8}?[A-Za-z0-9-]{3,}/,
  /\b(?:use|with|using)\s+(?:my\s+)?code\s+[A-Z0-9-]{3,}/i,
  /\bcode\s*[:：]\s*[A-Z0-9-]{4,}/,
  // Giveaway mechanics: a prize plus entry instructions is always marketing
  // ("$300 Giveaway ... To enter: Follow @x, Repost").
  /\bgiveaway\b[\s\S]{0,220}?\b(?:to\s+enter|follow\s+@|repost|retweet|winners?|tag\s+a?\s?friend)\b/i,
  /(?:转发|关注|關注)[\s\S]{0,30}?抽奖|抽奖[\s\S]{0,30}?(?:转发|关注|參与|参与)/,
];

/**
 * Softer promo phrasings without a concrete token — real signal, but they
 * still need corroboration from another category ("promo code" can be
 * discussed, "20% off" can be reported news).
 */
const PHRASE_PATTERNS: readonly RegExp[] = [
  /\b(?:promo|coupon|discount|referral)\s+code\b/i,
  /\b\d{1,3}\s?%\s?off\b/i,
];

/** Detects explicit discount / referral code offers in the tweet text. */
export function discountCodeSignal(text: string): SignalResult {
  const tokenMatches = TOKEN_PATTERNS.flatMap((pattern) => {
    const match = text.match(pattern);
    return match ? [match[0]] : [];
  });
  const phraseMatches = PHRASE_PATTERNS.flatMap((pattern) => {
    const match = text.match(pattern);
    return match ? [match[0]] : [];
  });
  const matches = [...tokenMatches, ...phraseMatches];
  return {
    id: 'discount-code',
    score: matches.length > 0 ? 1 : 0,
    matches,
    disclosure: tokenMatches.length > 0,
  };
}
