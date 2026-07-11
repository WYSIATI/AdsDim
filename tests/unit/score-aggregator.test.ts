import { describe, expect, it } from 'vitest';
import {
  aggregateSignals,
  REPLY_SPAM_BONUS,
  SIGNAL_WEIGHTS,
} from '../../src/detector/heuristics/score-aggregator';
import type { SignalResult } from '../../src/types';

const signal = (id: SignalResult['id'], score: number, disclosure?: boolean): SignalResult => ({
  id,
  score,
  matches: [],
  ...(disclosure === undefined ? {} : { disclosure }),
});

describe('aggregateSignals', () => {
  it('returns an empty result for no signals', () => {
    expect(aggregateSignals([])).toEqual({
      score: 0,
      firedCategories: [],
      hasDisclosure: false,
    });
  });

  it('weights a single signal and reports its category', () => {
    const result = aggregateSignals([signal('keyword', 1)]);
    expect(result.score).toBeCloseTo(SIGNAL_WEIGHTS.keyword, 5);
    expect(result.firedCategories).toEqual(['keyword']);

    expect(aggregateSignals([signal('url', 1)]).score).toBeCloseTo(SIGNAL_WEIGHTS.url, 5);
  });

  it('sums weighted signals and lists every fired category', () => {
    const result = aggregateSignals([signal('keyword', 0.5), signal('url', 0.5)]);
    expect(result.score).toBeCloseTo(0.5 * SIGNAL_WEIGHTS.keyword + 0.5 * SIGNAL_WEIGHTS.url, 5);
    expect(result.firedCategories).toEqual(['keyword', 'url']);
  });

  it('does not list zero-score signals as fired', () => {
    const result = aggregateSignals([signal('keyword', 0.8), signal('url', 0)]);
    expect(result.firedCategories).toEqual(['keyword']);
  });

  it('caps the aggregate at 1', () => {
    const result = aggregateSignals([
      signal('keyword', 1),
      signal('url', 1),
      signal('discount-code', 1),
      signal('contact-info', 1),
    ]);
    expect(result.score).toBe(1);
  });

  it('clamps out-of-range signal scores defensively', () => {
    expect(aggregateSignals([signal('keyword', 5)]).score).toBeCloseTo(SIGNAL_WEIGHTS.keyword, 5);
    const negative = aggregateSignals([signal('keyword', -1)]);
    expect(negative.score).toBe(0);
    expect(negative.firedCategories).toEqual([]);
  });

  it('flags disclosure from a fired disclosure-bearing signal', () => {
    expect(aggregateSignals([signal('keyword', 0.8, true)]).hasDisclosure).toBe(true);
    expect(aggregateSignals([signal('keyword', 0.8, false)]).hasDisclosure).toBe(false);
  });

  it('ignores disclosure on zero-score signals', () => {
    expect(aggregateSignals([signal('keyword', 0, true)]).hasDisclosure).toBe(false);
  });

  describe('reply-spam bonus', () => {
    it('adds the bonus when a link-carrying reply also fired keywords', () => {
      const result = aggregateSignals([signal('keyword', 1)], { replyWithLink: true });
      expect(result.score).toBeCloseTo(SIGNAL_WEIGHTS.keyword + REPLY_SPAM_BONUS, 5);
    });

    it('adds the bonus for promo-mechanics too', () => {
      const result = aggregateSignals([signal('promo-mechanics', 1)], { replyWithLink: true });
      expect(result.score).toBeCloseTo(SIGNAL_WEIGHTS['promo-mechanics'] + REPLY_SPAM_BONUS, 5);
    });

    it('gives no bonus when only non-lexical signals fired', () => {
      const result = aggregateSignals([signal('url', 1)], { replyWithLink: true });
      expect(result.score).toBeCloseTo(SIGNAL_WEIGHTS.url, 5);
    });

    it('gives no bonus without the reply flag', () => {
      const result = aggregateSignals([signal('keyword', 1)]);
      expect(result.score).toBeCloseTo(SIGNAL_WEIGHTS.keyword, 5);
    });

    it('stays capped at 1 with the bonus', () => {
      const result = aggregateSignals(
        [signal('keyword', 1), signal('url', 1), signal('promo-mechanics', 1)],
        { replyWithLink: true },
      );
      expect(result.score).toBe(1);
    });
  });
});
