/** Ad tiers AdsDim can assign to a tweet. */
export type AdTier = 'hard' | 'soft' | 'potential';

/** Tier used for rendering; organic posts are explicitly marked too. */
export type MarkTier = AdTier | 'organic';

/** How a classification was produced. */
export type ClassificationSource = 'promoted-label' | 'heuristics';

/** Result of classifying a single tweet. */
export interface Classification {
  readonly tier: AdTier | null;
  readonly source: ClassificationSource;
  readonly confidence: number;
  /** Heuristic signals that fired (score > 0); empty for promoted-label hits. */
  readonly signals: readonly SignalResult[];
}

/** Immutable snapshot of a tweet extracted from the DOM. */
export interface TweetData {
  readonly id: string;
  readonly text: string;
  readonly authorName: string | null;
  readonly authorHandle: string | null;
  readonly urls: readonly string[];
}

/** Output of a single heuristic signal. */
export interface SignalResult {
  readonly id: SignalId;
  readonly score: number;
  readonly matches: readonly string[];
  /** True when a disclosure-format token (#ad, #广告, ...) matched. */
  readonly disclosure?: boolean;
}

export type SignalId = 'keyword' | 'url' | 'discount-code' | 'contact-info' | 'promo-mechanics';

/** Visual scheme names (see design/preview-v2-inverted.html). */
export type Scheme = 'glass' | 'glow' | 'theater';
export type Contrast = 'normal' | 'strong';
export type Theme = 'dark' | 'light';
