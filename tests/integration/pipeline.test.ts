import { beforeEach, describe, expect, it } from 'vitest';
import { LruCache } from '../../src/cache/lru';
import { RepetitionTracker } from '../../src/detector/repetition-tracker';
import { DEFAULT_SETTINGS } from '../../src/storage/schema';
import type { Classification } from '../../src/types';
import { classifyTweet, resolveMarkTier } from '../../entrypoints/content/pipeline/classify-tweet';
import { fixtureArticle, loadFixture } from '../helpers/fixture';

describe('classifyTweet pipeline (fixture timeline)', () => {
  let doc: Document;
  let cache: LruCache<string, Classification>;
  let repetition: RepetitionTracker;

  beforeEach(() => {
    doc = loadFixture('timeline.html');
    cache = new LruCache(500);
    repetition = new RepetitionTracker();
  });

  const context = () => ({ settings: DEFAULT_SETTINGS, cache, repetition });

  const classify = (fixtureId: string) => classifyTweet(fixtureArticle(doc, fixtureId), context());

  it.each([
    ['organic-en', null],
    ['promoted-en', 'hard'],
    ['promoted-zh', 'hard'],
    ['soft-zh', 'soft'],
    ['potential-en', 'potential'],
    ['organic-zh-mentions-ad', null],
    ['promoted-placement', 'hard'],
    ['quote-organic', null],
  ] as const)('%s -> tier %s', (fixtureId, expectedTier) => {
    const { classification } = classify(fixtureId);
    expect(classification.tier).toBe(expectedTier);
  });

  it('labels promoted tweets with source promoted-label and confidence 1', () => {
    const { classification } = classify('promoted-en');
    expect(classification.source).toBe('promoted-label');
    expect(classification.confidence).toBe(1);
  });

  it('scores heuristic tiers between the thresholds', () => {
    const soft = classify('soft-zh').classification;
    expect(soft.source).toBe('heuristics');
    expect(soft.confidence).toBeGreaterThanOrEqual(0.65);

    const potential = classify('potential-en').classification;
    expect(potential.confidence).toBeGreaterThanOrEqual(0.35);
    expect(potential.confidence).toBeLessThan(0.65);
  });

  it('serves repeat classifications from the cache (virtualized re-mounts)', () => {
    const first = classify('promoted-en').classification;
    // Simulate X re-rendering the card without its Ad badge quirks:
    // the cached verdict must survive DOM churn.
    const badge = fixtureArticle(doc, 'promoted-en').querySelector('div > span');
    badge?.remove();
    const second = classify('promoted-en').classification;
    expect(second).toBe(first);
    expect(second.tier).toBe('hard');
  });

  it('never marks whitelisted authors', () => {
    const settings = { ...DEFAULT_SETTINGS, whitelist: ['stylekol'] };
    const { classification } = classifyTweet(fixtureArticle(doc, 'soft-zh'), {
      settings,
      cache,
      repetition,
    });
    expect(classification.tier).toBeNull();
  });

  it('whitelist matching ignores the @ prefix and case', () => {
    const settings = { ...DEFAULT_SETTINGS, whitelist: ['@StyleKOL'] };
    const { classification } = classifyTweet(fixtureArticle(doc, 'soft-zh'), {
      settings,
      cache,
      repetition,
    });
    expect(classification.tier).toBeNull();
  });

  it('user keywords can escalate an organic post', () => {
    const settings = { ...DEFAULT_SETTINGS, keywords: ['开源'] };
    doc.querySelector(
      '[data-fixture-id="organic-en"] [data-testid="tweetText"] span',
    )!.textContent = '开源项目周报来了';
    const { classification } = classifyTweet(fixtureArticle(doc, 'organic-en'), {
      settings,
      cache,
      repetition,
    });
    expect(classification.confidence).toBeGreaterThan(0);
  });

  describe('shill-network repetition detection', () => {
    const SHILL_TEXT = 'Limited drop from GlowLab today, absolutely insane value, run do not walk';

    const makeShillArticle = (handle: string, statusId: string): Element => {
      const article = fixtureArticle(doc, 'organic-en').cloneNode(true) as Element;
      article.setAttribute('data-fixture-id', `shill-${statusId}`);
      const userName = article.querySelector('[data-testid="User-Name"]')!;
      userName.querySelectorAll('span')[1]!.textContent = handle;
      userName.querySelector('a')!.setAttribute('href', `/${handle.slice(1)}/status/${statusId}`);
      article.querySelector('[data-testid="tweetText"] span')!.textContent = SHILL_TEXT;
      doc.body.append(article);
      return article;
    };

    it('marks the network once three authors post identical text', () => {
      const first = makeShillArticle('@shill1', '9001');
      makeShillArticle('@shill2', '9002');
      const third = makeShillArticle('@shill3', '9003');

      expect(classifyTweet(first, context()).classification.tier).toBeNull();
      expect(
        classifyTweet(fixtureArticle(doc, 'shill-9002'), context()).classification.tier,
      ).toBeNull();

      const verdict = classifyTweet(third, context()).classification;
      expect(verdict.tier).toBe('potential');
      expect(verdict.signals.map((signal) => signal.id)).toContain('repetition');

      // Re-mount of the first card: the cached organic verdict is upgraded.
      const upgraded = classifyTweet(first, context()).classification;
      expect(upgraded.tier).toBe('potential');
    });

    it('two authors are not a network', () => {
      const first = makeShillArticle('@only1', '9101');
      const second = makeShillArticle('@only2', '9102');
      classifyTweet(first, context());
      expect(classifyTweet(second, context()).classification.tier).toBeNull();
    });
  });
});

describe('resolveMarkTier', () => {
  const heuristic = (tier: Classification['tier']): Classification => ({
    tier,
    source: 'heuristics',
    confidence: tier === null ? 0 : 0.7,
    signals: [],
  });

  it('maps null tier to organic', () => {
    expect(resolveMarkTier(heuristic(null), DEFAULT_SETTINGS)).toBe('organic');
  });

  it('passes enabled tiers through', () => {
    expect(resolveMarkTier(heuristic('soft'), DEFAULT_SETTINGS)).toBe('soft');
  });

  it('renders disabled tiers as organic', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      tiers: { hard: true, soft: false, potential: true },
    };
    expect(resolveMarkTier(heuristic('soft'), settings)).toBe('organic');
    expect(resolveMarkTier(heuristic('hard'), settings)).toBe('hard');
  });
});
