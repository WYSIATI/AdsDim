import { describe, expect, it } from 'vitest';
import { aggregateScore, SIGNAL_WEIGHTS } from '../../src/detector/heuristics/score-aggregator';
import type { SignalResult } from '../../src/types';

const signal = (id: SignalResult['id'], score: number): SignalResult => ({
  id,
  score,
  matches: [],
});

describe('aggregateScore', () => {
  it('returns 0 for no signals', () => {
    expect(aggregateScore([])).toBe(0);
  });

  it('weights a single signal', () => {
    expect(aggregateScore([signal('keyword', 1)])).toBeCloseTo(SIGNAL_WEIGHTS.keyword, 5);
    expect(aggregateScore([signal('url', 1)])).toBeCloseTo(SIGNAL_WEIGHTS.url, 5);
  });

  it('sums weighted signals', () => {
    const score = aggregateScore([signal('keyword', 0.5), signal('url', 0.5)]);
    expect(score).toBeCloseTo(0.5 * SIGNAL_WEIGHTS.keyword + 0.5 * SIGNAL_WEIGHTS.url, 5);
  });

  it('caps the aggregate at 1', () => {
    const score = aggregateScore([
      signal('keyword', 1),
      signal('url', 1),
      signal('discount-code', 1),
      signal('contact-info', 1),
    ]);
    expect(score).toBe(1);
  });

  it('clamps out-of-range signal scores defensively', () => {
    expect(aggregateScore([signal('keyword', 5)])).toBeCloseTo(SIGNAL_WEIGHTS.keyword, 5);
    expect(aggregateScore([signal('keyword', -1)])).toBe(0);
  });
});
