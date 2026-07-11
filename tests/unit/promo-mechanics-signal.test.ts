import { describe, expect, it } from 'vitest';
import { promoMechanicsSignal } from '../../src/detector/heuristics/promo-mechanics-signal';

describe('promoMechanicsSignal giveaway mechanics', () => {
  it.each([
    ['en giveaway with entry steps', '$300 Giveaway! To enter: Follow @brand and Repost', 1],
    ['en giveaway with winners', 'Big giveaway — 3 winners picked Friday', 1],
    ['zh repost-follow draw', '转发+关注,抽奖送新款耳机一台!', 1],
    ['zh draw then participate', '抽奖啦，参与方式见评论', 1],
  ])('%s -> %d', (_description, text, expected) => {
    expect(promoMechanicsSignal(text).score).toBe(expected);
  });

  it.each([
    ['musing about a giveaway', 'Thinking about doing a giveaway next month, what should the prize be?'],
    ['plain post', 'lovely sunset over the bay tonight'],
    ['zh draw mention without mechanics', '上次抽奖的奖品今天到了'],
  ])('%s -> 0', (_description, text) => {
    const result = promoMechanicsSignal(text);
    expect(result.score).toBe(0);
    expect(result.matches).toEqual([]);
  });

  it('is disclosure-grade when it fires', () => {
    const result = promoMechanicsSignal('Giveaway time! RT and follow @us — 2 winners');
    expect(result.id).toBe('promo-mechanics');
    expect(result.disclosure).toBe(true);
  });

  it('carries no disclosure flag when silent', () => {
    expect(promoMechanicsSignal('nothing to see here').disclosure).toBe(false);
  });
});
