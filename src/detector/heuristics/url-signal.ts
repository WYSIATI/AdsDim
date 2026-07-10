import type { SignalResult } from '../../types';

/** Affiliate query parameters: strongest URL evidence. */
const AFFILIATE_PARAM_PATTERNS: readonly RegExp[] = [
  /[?&]tag=/i,
  /[?&]aff(?:_?id|_?click_?id)?=/i,
  /utm_campaign=affiliate/i,
  /[?&](?:ref|referral|invite|invitation)=/i,
  /register\?[^\s"']*code=/i,
];

/**
 * Influencer-monetization platforms that exist solely to pay commissions
 * (LTK, rewardStyle, MagicLinks, ShopMy): disclosure-grade on their own.
 */
const DISCLOSURE_DOMAINS: readonly string[] = [
  'liketk.it',
  'rstyle.me',
  'go.magik.ly',
  'shopmy.us',
];

/** Storefront / affiliate-shortlink domains: strong evidence. */
const STRONG_DOMAINS: readonly string[] = [
  'amzn.to',
  's.click.aliexpress.com',
  'taobao.com',
  'tb.cn',
  'shopee.',
  'u.jd.com',
  'item.jd.com',
];

/** Generic shorteners / bio-link hubs: weak evidence on their own. */
const WEAK_DOMAINS: readonly string[] = [
  'bit.ly',
  'tinyurl.com',
  'linktr.ee',
  't.cn',
  'beacons.ai',
  'linkin.bio',
];

const STRONG_WEIGHT = 1;
const WEAK_WEIGHT = 0.5;

/** Scores affiliate / storefront URL evidence across a tweet's links. */
export function urlSignal(urls: readonly string[]): SignalResult {
  const strong: string[] = [];
  const weak: string[] = [];
  let disclosure = false;

  for (const url of urls) {
    const lower = url.toLowerCase();
    if (DISCLOSURE_DOMAINS.some((d) => lower.includes(d))) {
      strong.push(url);
      disclosure = true;
      continue;
    }
    const isStrong =
      AFFILIATE_PARAM_PATTERNS.some((p) => p.test(lower)) ||
      STRONG_DOMAINS.some((d) => lower.includes(d));
    if (isStrong) {
      strong.push(url);
      continue;
    }
    if (WEAK_DOMAINS.some((d) => lower.includes(d))) {
      weak.push(url);
    }
  }

  const score = Math.min(1, strong.length * STRONG_WEIGHT + weak.length * WEAK_WEIGHT);
  return { id: 'url', score, matches: [...strong, ...weak], disclosure };
}
