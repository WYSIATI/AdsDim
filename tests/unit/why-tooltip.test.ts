import { describe, expect, it } from 'vitest';
import { buildWhyTitle } from '../../entrypoints/content/renderer/why-tooltip';
import type { Classification, SignalResult } from '../../src/types';

const signal = (id: SignalResult['id'], matches: readonly string[]): SignalResult => ({
  id,
  score: 0.8,
  matches,
});

const heuristic = (signals: readonly SignalResult[]): Classification => ({
  tier: 'soft',
  source: 'heuristics',
  confidence: 0.8,
  signals,
});

describe('buildWhyTitle', () => {
  it('explains promoted-label hits', () => {
    const classification: Classification = {
      tier: 'hard',
      source: 'promoted-label',
      confidence: 1,
      signals: [],
    };
    expect(buildWhyTitle(classification)).toBe('AdsDim: promoted label');
  });

  it('returns null for organic posts', () => {
    const classification: Classification = {
      tier: null,
      source: 'heuristics',
      confidence: 0.2,
      signals: [signal('keyword', ['sponsored'])],
    };
    expect(buildWhyTitle(classification)).toBeNull();
  });

  it('lists fired signals with their matches', () => {
    const classification = heuristic([
      signal('keyword', ['#ad']),
      signal('url', ['amzn.to/3xYz']),
    ]);
    expect(buildWhyTitle(classification)).toBe('AdsDim: keyword(#ad), url(amzn.to/3xYz)');
  });

  it('keeps the tooltip compact: at most two matches per signal, long urls truncated', () => {
    const longUrl = `https://example.com/${'a'.repeat(80)}`;
    const classification = heuristic([
      signal('keyword', ['#ad', 'use code', 'promo code']),
      signal('url', [longUrl]),
    ]);
    const title = buildWhyTitle(classification);
    expect(title).toContain('keyword(#ad, use code)');
    expect(title).not.toContain('promo code');
    expect(title).toContain('…');
    expect(title?.length ?? 0).toBeLessThan(120);
  });
});
