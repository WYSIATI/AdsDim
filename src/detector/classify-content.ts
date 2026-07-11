import type { AdTier, SignalResult } from '../types';
import { contactInfoSignal } from './heuristics/contact-info-signal';
import { discountCodeSignal } from './heuristics/discount-code-signal';
import { keywordSignal } from './heuristics/keyword-signal';
import { promoMechanicsSignal } from './heuristics/promo-mechanics-signal';
import { aggregateSignals } from './heuristics/score-aggregator';
import { urlSignal } from './heuristics/url-signal';
import { mapAggregateToTier, thresholdsForSensitivity } from './tier-mapping';

/** The text/link content of one tweet, independent of any DOM. */
export interface TweetContent {
  readonly text: string;
  readonly urls: readonly string[];
}

/** User-tunable heuristic options (subset of Settings). */
export interface ContentOptions {
  readonly sensitivity: number;
  readonly keywords: readonly string[];
}

/** Pure heuristic verdict for a tweet's content. */
export interface ContentVerdict {
  readonly tier: AdTier | null;
  readonly score: number;
  /** Signals that fired (score > 0), for the "why" tooltip. */
  readonly signals: readonly SignalResult[];
}

/**
 * Runs every heuristic signal over the tweet content and applies the
 * corroboration rule via `mapAggregateToTier`. Pure and DOM-free, so
 * regression suites can exercise real-world texts directly.
 */
export function classifyContent(content: TweetContent, options: ContentOptions): ContentVerdict {
  const signals = [
    keywordSignal(content.text, options.keywords),
    urlSignal(content.urls),
    discountCodeSignal(content.text),
    contactInfoSignal(content.text),
    promoMechanicsSignal(content.text, content.urls),
  ];
  const aggregate = aggregateSignals(signals);
  const tier = mapAggregateToTier(aggregate, thresholdsForSensitivity(options.sensitivity));

  return {
    tier,
    score: aggregate.score,
    signals: signals.filter((signal) => signal.score > 0),
  };
}
