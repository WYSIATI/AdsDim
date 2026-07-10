import type { LruCache } from '../../../src/cache/lru';
import { classifyContent } from '../../../src/detector/classify-content';
import { detectHardAd } from '../../../src/detector/hard-ad';
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
  signals: [],
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
      signals: [],
    });
  }

  const verdict = classifyContent(
    { text: data.text, urls: data.urls },
    { sensitivity: settings.sensitivity, keywords: settings.keywords },
  );
  return Object.freeze({
    tier: verdict.tier,
    source: 'heuristics' as const,
    confidence: verdict.score,
    signals: verdict.signals,
  });
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
