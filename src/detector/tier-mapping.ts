import type { AdTier } from '../types';
import type { AggregateResult } from './heuristics/score-aggregator';

export interface TierThresholds {
  /** Score at or above this maps to 'soft'. */
  readonly soft: number;
  /** Score at or above this (but below soft) maps to 'potential'. */
  readonly potential: number;
}

/** Baseline thresholds at sensitivity 0.5. */
export const BASE_THRESHOLDS: TierThresholds = { soft: 0.65, potential: 0.35 };

/** How far the full sensitivity range shifts the thresholds. */
const SENSITIVITY_RANGE = 0.2;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Derives thresholds from the user's sensitivity setting (0..1).
 * Higher sensitivity lowers both thresholds (more marks), lower raises them.
 * At the default 0.5 the thresholds are exactly the spec baseline 0.65/0.35.
 */
export function thresholdsForSensitivity(sensitivity: number): TierThresholds {
  const shift = (clamp(sensitivity, 0, 1) - 0.5) * SENSITIVITY_RANGE;
  return {
    soft: clamp(BASE_THRESHOLDS.soft - shift, 0.05, 0.95),
    potential: clamp(BASE_THRESHOLDS.potential - shift, 0.05, 0.95),
  };
}

/**
 * Corroboration rule: a post is only marked when a disclosure-format token
 * fired, or at least two independent signal categories agree. A single
 * lexical hit — one bare keyword, one storefront link — is never enough.
 */
export function mapAggregateToTier(
  aggregate: AggregateResult,
  thresholds: TierThresholds = BASE_THRESHOLDS,
): AdTier | null {
  const corroborated = aggregate.hasDisclosure || aggregate.firedCategories.length >= 2;
  if (!corroborated) return null;
  return mapScoreToTier(aggregate.score, thresholds);
}

/** Maps an aggregated heuristic score to a tier (or null for organic). */
export function mapScoreToTier(
  score: number,
  thresholds: TierThresholds = BASE_THRESHOLDS,
): AdTier | null {
  if (score >= thresholds.soft) return 'soft';
  if (score >= thresholds.potential) return 'potential';
  return null;
}
