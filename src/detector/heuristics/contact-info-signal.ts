import type { SignalResult } from '../../types';

/**
 * WeChat-style handle disclosure: "微信: glow88", "vx：abc123". A concrete
 * handle is a solicitation on its own; a bare platform mention is not.
 */
const WECHAT_HANDLE_PATTERN = /(?<![a-z0-9])(?:微信|wechat|weixin|vx|v)\s*[:：]\s*[A-Za-z0-9_-]{4,}/i;

/** Bare WeChat mention: only counts alongside commerce vocabulary. */
const WECHAT_MENTION_PATTERN = /微信|weixin|wechat/i;

/** DM solicitation: only counts alongside commerce vocabulary. */
const DM_PATTERN = /私信|\bdm\s+(?:me|for|to)\b/i;

/** Contact channels that are suspicious without further context. */
const DIRECT_CHANNEL_PATTERNS: readonly RegExp[] = [
  /whatsapp/i,
  /\btelegram\b|\bt\.me\//i,
  /\bline\s*id\b/i,
];

/** Commerce vocabulary that turns a casual mention into a solicitation. */
const COMMERCE_PATTERN = /下单|拿货|价|优惠|购|\border\b|\bbuy\b|\bprice\b|\bshop\b/i;

const PER_MATCH_WEIGHT = 0.6;

const matchOf = (text: string, pattern: RegExp): readonly string[] => {
  const match = text.match(pattern);
  return match ? [match[0]] : [];
};

/**
 * Detects direct-contact solicitations in the tweet text. Casual mentions of
 * messaging apps ("他微信上说", "私信我聊聊") are ignored unless they carry a
 * concrete handle or co-occur with commerce terms.
 */
export function contactInfoSignal(text: string): SignalResult {
  const hasCommerce = COMMERCE_PATTERN.test(text);
  const handle = matchOf(text, WECHAT_HANDLE_PATTERN);
  const wechatMention =
    handle.length === 0 && hasCommerce ? matchOf(text, WECHAT_MENTION_PATTERN) : [];
  const dm = hasCommerce ? matchOf(text, DM_PATTERN) : [];
  const channels = DIRECT_CHANNEL_PATTERNS.flatMap((pattern) => matchOf(text, pattern));

  const matches = [...handle, ...wechatMention, ...dm, ...channels];
  return { id: 'contact-info', score: Math.min(1, matches.length * PER_MATCH_WEIGHT), matches };
}
