import type { SignalResult } from '../../types';

/** "Contact me to buy" style patterns common in soft ads, zh + en. */
const CONTACT_PATTERNS: readonly RegExp[] = [
  /微信|weixin|wechat/i,
  /\bvx\s*[:：]/i,
  /加\s*v[:：\s]/i,
  /私信|\bdm\s+(?:me|for|to)\b/i,
  /whatsapp/i,
  /\btelegram\b|\bt\.me\//i,
  /\bline\s*id\b/i,
];

const PER_MATCH_WEIGHT = 0.6;

/** Detects direct-contact solicitations in the tweet text. */
export function contactInfoSignal(text: string): SignalResult {
  const matches = CONTACT_PATTERNS.flatMap((pattern) => {
    const match = text.match(pattern);
    return match ? [match[0]] : [];
  });
  const score = Math.min(1, matches.length * PER_MATCH_WEIGHT);
  return { id: 'contact-info', score, matches };
}
