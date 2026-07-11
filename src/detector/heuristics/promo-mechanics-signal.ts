import type { SignalResult } from '../../types';

/**
 * Promotion mechanics: entry instructions and prize hooks that only appear
 * when a post is running a promotion ("To enter: Follow @x, Repost",
 * 转发+关注 抽奖). Ordinary conversation never uses this grammar, so every
 * rule here is disclosure-grade and can mark a post on its own. Each rule may
 * carry a guard regex that silences it for known innocent phrasings.
 */
interface MechanicsRule {
  /** Disclosure-grade promotion-mechanics pattern. */
  readonly pattern: RegExp;
  /** Innocent-context escape hatch: when it matches, the rule stays silent. */
  readonly guard?: RegExp;
}

const MECHANICS_RULES: readonly MechanicsRule[] = [
  // A prize plus entry instructions is always marketing
  // ("$300 Giveaway ... To enter: Follow @x, Repost").
  {
    pattern:
      /\bgiveaway\b[\s\S]{0,220}?\b(?:to\s+enter|follow\s+@|repost|retweet|winners?|tag\s+a?\s?friend)\b/i,
  },
  { pattern: /(?:转发|关注|關注)[\s\S]{0,30}?抽奖|抽奖[\s\S]{0,30}?(?:转发|关注|參与|参与)/ },
];

const matchRule = (text: string, rule: MechanicsRule): readonly string[] => {
  if (rule.guard?.test(text)) return [];
  const match = text.match(rule.pattern);
  return match ? [match[0]] : [];
};

/** Detects promotion-entry mechanics in the tweet text. */
export function promoMechanicsSignal(text: string): SignalResult {
  const matches = MECHANICS_RULES.flatMap((rule) => matchRule(text, rule));
  return {
    id: 'promo-mechanics',
    score: matches.length > 0 ? 1 : 0,
    matches,
    disclosure: matches.length > 0,
  };
}
