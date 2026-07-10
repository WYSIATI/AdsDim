import { describe, expect, it } from 'vitest';
import {
  BASE_THRESHOLDS,
  mapScoreToTier,
  thresholdsForSensitivity,
} from '../../src/detector/tier-mapping';

describe('mapScoreToTier boundaries (default thresholds)', () => {
  it.each([
    [1, 'soft'],
    [0.65, 'soft'],
    [0.6499, 'potential'],
    [0.5, 'potential'],
    [0.35, 'potential'],
    [0.3499, null],
    [0.1, null],
    [0, null],
  ] as const)('score %d -> %s', (score, expected) => {
    expect(mapScoreToTier(score)).toBe(expected);
  });
});

describe('thresholdsForSensitivity', () => {
  it('yields the spec baseline 0.65/0.35 at default sensitivity 0.5', () => {
    expect(thresholdsForSensitivity(0.5)).toEqual(BASE_THRESHOLDS);
  });

  it('lowers thresholds at high sensitivity (more marks)', () => {
    const t = thresholdsForSensitivity(1);
    expect(t.soft).toBeCloseTo(0.55, 5);
    expect(t.potential).toBeCloseTo(0.25, 5);
  });

  it('raises thresholds at low sensitivity (fewer marks)', () => {
    const t = thresholdsForSensitivity(0);
    expect(t.soft).toBeCloseTo(0.75, 5);
    expect(t.potential).toBeCloseTo(0.45, 5);
  });

  it('clamps out-of-range sensitivity', () => {
    expect(thresholdsForSensitivity(99)).toEqual(thresholdsForSensitivity(1));
    expect(thresholdsForSensitivity(-99)).toEqual(thresholdsForSensitivity(0));
  });

  it('a borderline score flips tier when sensitivity changes', () => {
    expect(mapScoreToTier(0.6, thresholdsForSensitivity(1))).toBe('soft');
    expect(mapScoreToTier(0.6, thresholdsForSensitivity(0.5))).toBe('potential');
    expect(mapScoreToTier(0.4, thresholdsForSensitivity(0))).toBe(null);
  });
});
