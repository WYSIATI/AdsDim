import type { SignalResult } from '../../types';

/**
 * Promotion mechanics: entry instructions and prize/launch hooks that only
 * appear when a post is running a promotion ("To enter: Follow @x, Repost",
 * "connect wallet to claim the airdrop", 转发+关注 抽奖). Ordinary
 * conversation never uses this grammar, so every rule here is
 * disclosure-grade and can mark a post on its own. Bare vocabulary
 * ("airdrop", "presale") is NEVER enough — each rule demands mechanics
 * co-occurrence, and rules may carry a guard regex that silences them for
 * known innocent phrasings (Apple AirDrop, concert presales, USB drives).
 */
interface MechanicsRule {
  /** Disclosure-grade promotion-mechanics pattern. */
  readonly pattern: RegExp;
  /** Innocent-context escape hatch: when it matches, the rule stays silent. */
  readonly guard?: RegExp;
}

/** Apple AirDrop contexts: file transfers and bug reports, not token drops. */
const APPLE_AIRDROP_GUARD =
  /(?:via|over|by|per)\s+airdrop\b|airdrop\s+(?:is\s+)?(?:not|isn'?t|keeps?|stopped)\s+work/i;

/** Crypto-airdrop mechanics vocabulary (claim / wallet / snapshot side). */
const AIRDROP_MECHANICS =
  /\bclaim\b|\beligib\w*|connect\s+(?:your\s+)?wallet|drop\s+your\s+wallet|\bsnapshot\b|\bholders?\b/i;

const MECHANICS_RULES: readonly MechanicsRule[] = [
  // A prize plus entry instructions is always marketing
  // ("$300 Giveaway ... To enter: Follow @x, Repost").
  {
    pattern:
      /\bgiveaway\b[\s\S]{0,220}?\b(?:to\s+enter|follow\s+@|repost|retweet|winners?|tag\s+a?\s?friend)\b/i,
  },
  { pattern: /(?:转发|关注|關注)[\s\S]{0,30}?抽奖|抽奖[\s\S]{0,30}?(?:转发|关注|參与|参与)/ },
  // Crypto airdrop farming: "airdrop" near claim/eligibility/wallet/snapshot
  // mechanics (either order). Apple file-transfer contexts are guarded out.
  {
    pattern: new RegExp(
      `\\bairdrop\\b[\\s\\S]{0,200}?(?:${AIRDROP_MECHANICS.source})|(?:${AIRDROP_MECHANICS.source})[\\s\\S]{0,200}?\\bairdrop\\b`,
      'i',
    ),
    guard: APPLE_AIRDROP_GUARD,
  },
  // Paid trade-signal solicitations are promotions by definition.
  { pattern: /join\s+my\s+(?:signals?|vip)\b|copy\s+my\s+trades?\b|带单|收徒/i },
  // Engagement-bait entry instructions.
  {
    pattern:
      /\b(?:rt|retweet|repost)\s+to\s+win\b|\blike\s+(?:and|&)\s+follow[\s\S]{0,40}?(?:\bwin|prize)|\bcomment\b[\s\S]{0,30}?\bto\s+win\b|\bfirst\s+\d+\s+(?:people|followers)\b|\btag\s+\d+\s+friends?\b/i,
  },
  // Wallet-address solicitation has zero innocent uses.
  { pattern: /\bdrop\s+your\s+wallet(?:\s+address)?\b/i },
  // Chinese crypto airdrop mechanics (领取/钱包/资格 = claim/wallet/eligibility);
  // relief-supply airdrops (空投物资) lack these hooks.
  { pattern: /空投[\s\S]{0,30}?(?:领取|钱包|资格)/ },
  // Chinese engagement bait: like+follow+prize, comment-section draws.
  { pattern: /点赞[\s\S]{0,10}?关注[\s\S]{0,20}?[送抽]/ },
  { pattern: /评论区[\s\S]{0,20}?抽/ },
  // USDT over-the-counter dealing (收U/出U); U盘/U型 hardware talk is guarded.
  { pattern: /[收出]U(?![A-Za-z0-9型盘口形])/ },
  // Gambling promos: 博彩/菠菜 need platform-mechanics co-occurrence so that
  // industry news and 菠菜-the-vegetable stay unmarked.
  {
    pattern:
      /(?:博彩|菠菜)[\s\S]{0,40}?(?:平台|注册|充值|首存|上分|担保|优惠|送)|(?:平台|注册|充值|首存|上分|担保)[\s\S]{0,40}?(?:博彩|菠菜)/,
  },
  { pattern: /\bcasino\b[\s\S]{0,40}?\b(?:bonus|code)\b/i },
];

/** Token-launch vocabulary that needs a companion (cashtag/URL/join). */
const LAUNCH_TERM_PATTERN =
  /\b(?:pre-?sale|whitelist\s+spots?|mint\s+is\s+(?:now\s+)?live|stealth\s+launch)\b/i;
/** Concert/event ticket presales are ordinary commerce chatter. */
const LAUNCH_TICKET_GUARD = /\bpre-?sale\s+tickets?\b|\btickets?\b[\s\S]{0,30}?\bpre-?sale\b/i;
const CASHTAG_PATTERN = /\$[A-Z]{2,8}\b/;
const URL_IN_TEXT_PATTERN = /\bhttps?:\/\/|\bt\.co\//i;
const JOIN_PATTERN = /\bjoin\b/i;

/**
 * Token-launch hype ("presale", "mint is live") counts only next to a launch
 * companion: a cashtag, any link, or a "join" call to action.
 */
const matchTokenLaunch = (text: string, urls: readonly string[]): readonly string[] => {
  if (LAUNCH_TICKET_GUARD.test(text)) return [];
  const launch = text.match(LAUNCH_TERM_PATTERN);
  if (!launch) return [];
  const hasCompanion =
    CASHTAG_PATTERN.test(text) ||
    urls.length > 0 ||
    URL_IN_TEXT_PATTERN.test(text) ||
    JOIN_PATTERN.test(text);
  return hasCompanion ? [launch[0]] : [];
};

const matchRule = (text: string, rule: MechanicsRule): readonly string[] => {
  if (rule.guard?.test(text)) return [];
  const match = text.match(rule.pattern);
  return match ? [match[0]] : [];
};

/** Detects promotion-entry and crypto-launch mechanics in the tweet text. */
export function promoMechanicsSignal(text: string, urls: readonly string[] = []): SignalResult {
  const matches = [
    ...MECHANICS_RULES.flatMap((rule) => matchRule(text, rule)),
    ...matchTokenLaunch(text, urls),
  ];
  return {
    id: 'promo-mechanics',
    score: matches.length > 0 ? 1 : 0,
    matches,
    disclosure: matches.length > 0,
  };
}
