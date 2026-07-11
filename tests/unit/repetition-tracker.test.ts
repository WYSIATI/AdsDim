import { describe, expect, it } from 'vitest';
import { RepetitionTracker, repetitionSignal } from '../../src/detector/repetition-tracker';

const SHILL_TEXT = 'Limited time offer on the new Glow serum, do not miss this one folks!';

describe('RepetitionTracker identical-text detection', () => {
  it('counts distinct authors sharing the same normalized text', () => {
    const tracker = new RepetitionTracker();
    expect(tracker.record(SHILL_TEXT, '@a1', []).textAuthorCount).toBe(1);
    expect(tracker.record(SHILL_TEXT, '@a2', []).textAuthorCount).toBe(2);
    expect(tracker.record(SHILL_TEXT, '@a3', []).textAuthorCount).toBe(3);
  });

  it('normalizes away URLs, mentions, hashtags and whitespace', () => {
    const tracker = new RepetitionTracker();
    tracker.record(`${SHILL_TEXT} https://a.example/x @alice #deal`, '@a1', []);
    tracker.record(`${SHILL_TEXT}   @bob #promo https://b.example/y`, '@a2', []);
    const third = tracker.record(SHILL_TEXT, '@a3', []);
    expect(third.textAuthorCount).toBe(3);
  });

  it('buckets by the first 120 normalized chars', () => {
    const long = SHILL_TEXT.repeat(3);
    const tracker = new RepetitionTracker();
    tracker.record(`${long} unique tail one`, '@a1', []);
    const second = tracker.record(`${long} completely different tail`, '@a2', []);
    expect(second.textAuthorCount).toBe(2);
  });

  it('does not inflate the count for one author reposting', () => {
    const tracker = new RepetitionTracker();
    tracker.record(SHILL_TEXT, '@same', []);
    tracker.record(SHILL_TEXT, '@same', []);
    expect(tracker.record(SHILL_TEXT, '@same', []).textAuthorCount).toBe(1);
  });

  it('ignores very short texts (gm-collision guard)', () => {
    const tracker = new RepetitionTracker();
    tracker.record('gm', '@a1', []);
    tracker.record('gm', '@a2', []);
    expect(tracker.record('gm', '@a3', []).textAuthorCount).toBe(0);
  });

  it('does not attribute posts without an author handle', () => {
    const tracker = new RepetitionTracker();
    tracker.record(SHILL_TEXT, '@a1', []);
    tracker.record(SHILL_TEXT, '@a2', []);
    expect(tracker.record(SHILL_TEXT, null, []).textAuthorCount).toBe(2);
  });

  it('bounds memory via LRU eviction', () => {
    const tracker = new RepetitionTracker(2);
    tracker.record(`${SHILL_TEXT} variant one`, '@a1', []);
    tracker.record(`${SHILL_TEXT} variant two`, '@a1', []);
    tracker.record(`${SHILL_TEXT} variant three`, '@a1', []);
    // "variant one" was evicted: a fresh sighting starts from scratch.
    expect(tracker.record(`${SHILL_TEXT} variant one`, '@a2', []).textAuthorCount).toBe(1);
  });
});

describe('RepetitionTracker hot-domain detection', () => {
  const texts = [
    'first take on this product, honestly impressed by the battery',
    'second opinion here, the camera is the real highlight for me',
    'third completely different review text, mostly about the screen',
    'fourth author yet another angle, shipping was fast at least',
  ];

  it('flags a non-platform domain shared by four distinct authors', () => {
    const tracker = new RepetitionTracker();
    const counts = texts.map((text, i) =>
      tracker.record(text, `@author${i}`, ['https://sketchy-shop.example/item']),
    );
    expect(counts[2]?.hotDomainAuthorCount).toBe(3);
    expect(counts[3]?.hotDomainAuthorCount).toBe(4);
  });

  it('never counts platform hosts', () => {
    const tracker = new RepetitionTracker();
    const counts = texts.map((text, i) =>
      tracker.record(text, `@author${i}`, ['https://t.co/abc', '/status/1', 'x.com/foo']),
    );
    expect(counts[3]?.hotDomainAuthorCount).toBe(0);
  });
});

describe('repetitionSignal', () => {
  it('is disclosure-grade for 3+ authors sharing text', () => {
    const result = repetitionSignal({ textAuthorCount: 3, hotDomainAuthorCount: 0 });
    expect(result.id).toBe('repetition');
    expect(result.score).toBe(1);
    expect(result.disclosure).toBe(true);
    expect(result.matches).toEqual(['identical text posted by 3 accounts']);
  });

  it('gives a weak non-disclosure boost for a hot domain', () => {
    const result = repetitionSignal({ textAuthorCount: 1, hotDomainAuthorCount: 4 });
    expect(result.score).toBe(0.5);
    expect(result.disclosure).toBe(false);
    expect(result.matches).toEqual(['link domain shared by 4 accounts']);
  });

  it('stays silent below both thresholds', () => {
    const result = repetitionSignal({ textAuthorCount: 2, hotDomainAuthorCount: 3 });
    expect(result.score).toBe(0);
    expect(result.matches).toEqual([]);
    expect(result.disclosure).toBe(false);
  });
});
