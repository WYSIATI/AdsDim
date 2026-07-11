import type { LruCache } from '../../../src/cache/lru';
import { classifyContent } from '../../../src/detector/classify-content';
import { detectHardAd } from '../../../src/detector/hard-ad';
import { repetitionSignal, type RepetitionTracker } from '../../../src/detector/repetition-tracker';
import type { Settings } from '../../../src/storage/schema';
import type { Classification, MarkTier, SignalResult, TweetData } from '../../../src/types';
import { extractTweetData } from '../extractor/tweet-extractor';

export interface ClassifierContext {
  readonly settings: Settings;
  readonly cache: LruCache<string, Classification>;
  /** Session-scoped shill-network memory (see repetition-tracker). */
  readonly repetition: RepetitionTracker;
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
 * Classification pipeline: whitelist -> repetition memory -> cache ->
 * hard-ad label -> heuristics. Results are cached by tweet id so virtualized
 * re-mounts are near free; a cached organic verdict is recomputed when the
 * repetition tracker has since accumulated network evidence, so every
 * matching post in the timeline eventually carries the repetition signal.
 */
export function classifyTweet(article: Element, context: ClassifierContext): ClassifyResult {
  const data = extractTweetData(article);

  if (isWhitelisted(data, context.settings)) {
    return { data, classification: ORGANIC };
  }

  const repetition = repetitionSignal(
    context.repetition.record(data.text, data.authorHandle, data.urls),
  );

  const cached = context.cache.get(data.id);
  if (cached && !needsRepetitionUpgrade(cached, repetition)) {
    return { data, classification: cached };
  }

  const classification = classify(article, data, context.settings, repetition);
  context.cache.set(data.id, classification);
  return { data, classification };
}

/** A cached verdict is stale once repetition evidence appeared after it. */
function needsRepetitionUpgrade(cached: Classification, repetition: SignalResult): boolean {
  return (
    repetition.score > 0 &&
    cached.source === 'heuristics' &&
    !cached.signals.some((signal) => signal.id === 'repetition')
  );
}

function classify(
  article: Element,
  data: TweetData,
  settings: Settings,
  repetition: SignalResult,
): Classification {
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
    [repetition],
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
