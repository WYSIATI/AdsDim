import type { SignalId, SignalResult } from '../../types';

/**
 * Per-signal weights. They intentionally sum past 1 so that multiple
 * corroborating signals saturate the score; a single weak signal cannot.
 */
export const SIGNAL_WEIGHTS: Readonly<Record<SignalId, number>> = {
  keyword: 0.55,
  url: 0.35,
  'discount-code': 0.3,
  'contact-info': 0.2,
};

/** Aggregates weighted signal scores into a 0..1 ad-likelihood score. */
export function aggregateScore(signals: readonly SignalResult[]): number {
  const total = signals.reduce(
    (sum, signal) => sum + (SIGNAL_WEIGHTS[signal.id] ?? 0) * clamp01(signal.score),
    0,
  );
  return Math.min(1, total);
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
