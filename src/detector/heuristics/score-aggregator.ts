import type { SignalId, SignalResult } from '../../types';

/**
 * Per-signal weights. They intentionally sum past 1 so that multiple
 * corroborating signals saturate the score; a single weak signal cannot.
 */
export const SIGNAL_WEIGHTS: Readonly<Record<SignalId, number>> = {
  keyword: 0.55,
  url: 0.35,
  // 0.4 so a disclosure-grade concrete code offer clears the potential
  // threshold (0.35) on its own.
  'discount-code': 0.4,
  'contact-info': 0.2,
  // Same rationale as discount-code: mechanics are disclosure-grade, so the
  // weight alone must clear the potential threshold (0.35).
  'promo-mechanics': 0.4,
  // Weak structural shape (hashtag floods, emoji clusters): never enough on
  // its own, only ever a corroborating nudge.
  structural: 0.25,
};

/** Aggregated heuristic evidence for one tweet. */
export interface AggregateResult {
  /** Weighted 0..1 ad-likelihood score. */
  readonly score: number;
  /** Signal categories that produced a non-zero score. */
  readonly firedCategories: readonly SignalId[];
  /** True when any fired signal matched a disclosure-format token. */
  readonly hasDisclosure: boolean;
}

/** Aggregates weighted signal scores into a single evidence summary. */
export function aggregateSignals(signals: readonly SignalResult[]): AggregateResult {
  const fired = signals.filter((signal) => clamp01(signal.score) > 0);
  const total = fired.reduce(
    (sum, signal) => sum + (SIGNAL_WEIGHTS[signal.id] ?? 0) * clamp01(signal.score),
    0,
  );
  return {
    score: Math.min(1, total),
    firedCategories: fired.map((signal) => signal.id),
    hasDisclosure: fired.some((signal) => signal.disclosure === true),
  };
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
