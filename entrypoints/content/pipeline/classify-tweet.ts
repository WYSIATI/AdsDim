import type { LruCache } from '../../../src/cache/lru';
import { detectHardAd } from '../../../src/detector/hard-ad';
import { contactInfoSignal } from '../../../src/detector/heuristics/contact-info-signal';
import { discountCodeSignal } from '../../../src/detector/heuristics/discount-code-signal';
import { keywordSignal } from '../../../src/detector/heuristics/keyword-signal';
import { urlSignal } from '../../../src/detector/heuristics/url-signal';
import { aggregateScore } from '../../../src/detector/heuristics/score-aggregator';
import { mapScoreToTier, thresholdsForSensitivity } from '../../../src/detector/tier-mapping';
import type { Settings } from '../../../src/storage/schema';
import type { Classification, MarkTier, TweetData } from '../../../src/types';
import { extractTweetData } from '../extractor/tweet-extractor';

export interface ClassifierContext {
  readonly settings: Settings;
  readonly cache: LruCache<string, Classification>;
}

export interface ClassifyResult {
  readonly data: TweetData;
  readonly classification: Classification;
}

const ORGANIC: Classification = Object.freeze({
  tier: null,
  source: 'heuristics',
  confidence: 0,
});

const normalizeHandle = (handle: string): string => handle.replace(/^@/, '').toLowerCase();

/**
 * Classification pipeline: whitelist -> cache -> hard-ad label -> heuristics.
 * Results are cached by tweet id so virtualized re-mounts are near free.
 */
export function classifyTweet(article: Element, context: ClassifierContext): ClassifyResult {
  const data = extractTweetData(article);

  if (isWhitelisted(data, context.settings)) {
    return { data, classification: ORGANIC };
  }

  const cached = context.cache.get(data.id);
  if (cached) {
    return { data, classification: cached };
  }

  const classification = classify(article, data, context.settings);
  context.cache.set(data.id, classification);
  return { data, classification };
}

function classify(article: Element, data: TweetData, settings: Settings): Classification {
  if (detectHardAd(article)) {
    return Object.freeze({
      tier: 'hard' as const,
      source: 'promoted-label' as const,
      confidence: 1,
    });
  }

  const signals = [
    keywordSignal(data.text, settings.keywords),
    urlSignal(data.urls),
    discountCodeSignal(data.text),
    contactInfoSignal(data.text),
  ];
  const score = aggregateScore(signals);
  const tier = mapScoreToTier(score, thresholdsForSensitivity(settings.sensitivity));
  return Object.freeze({ tier, source: 'heuristics' as const, confidence: score });
}

function isWhitelisted(data: TweetData, settings: Settings): boolean {
  if (!data.authorHandle) return false;
  const handle = normalizeHandle(data.authorHandle);
  return settings.whitelist.some((entry) => normalizeHandle(entry) === handle);
}

/** Applies the per-tier user toggles: a disabled tier renders as organic. */
export function resolveMarkTier(classification: Classification, settings: Settings): MarkTier {
  const { tier } = classification;
  if (tier === null) return 'organic';
  return settings.tiers[tier] ? tier : 'organic';
}
