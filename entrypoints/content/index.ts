import { defineContentScript } from 'wxt/utils/define-content-script';
import { LruCache } from '../../src/cache/lru';
import { getMessages } from '../../src/i18n';
import { X_SELECTORS } from '../../src/selectors/x-selectors';
import { syncStorageArea, watchSettings } from '../../src/storage/browser-area';
import type { Settings } from '../../src/storage/schema';
import { createSettingsStore } from '../../src/storage/settings-store';
import type { Classification } from '../../src/types';
import { logger } from '../../src/utils/logger';
import { sweepVisibleArticles } from './observer/heal-sweep';
import { createTimelineObserver } from './observer/timeline-observer';
import { createViewportObserver } from './observer/viewport-observer';
import { classifyTweet, resolveMarkTier } from './pipeline/classify-tweet';
import { applyRootState, clearMarks, renderMark } from './renderer/mark-renderer';
import { buildWhyTitle } from './renderer/why-tooltip';
import { createKeyboardReveal } from './renderer/keyboard-reveal';
import { createScrollGate, SCROLL_IDLE_MS } from './renderer/scroll-gate';
import { injectStyles } from './renderer/styles';
import { detectTheme, watchTheme } from './renderer/theme';

const CACHE_CAPACITY = 500;

export default defineContentScript({
  matches: ['*://x.com/*', '*://twitter.com/*', '*://mobile.twitter.com/*'],
  runAt: 'document_idle',
  main(): void {
    bootstrap().catch((error) => logger.error('Failed to start', error));
  },
});

async function bootstrap(): Promise<void> {
  const store = createSettingsStore(syncStorageArea);
  let settings: Settings = await store.load();

  const cache = new LruCache<string, Classification>(CACHE_CAPACITY);
  let messages = getMessages(settings.locale);
  const viewport = createViewportObserver(window);

  injectStyles(document);
  applyRootState(document, settings, detectTheme(document));

  // Keyboard accessibility for the reveal without CSS focus pseudo-classes
  // (those latch on X's programmatic focus management).
  const keyboardReveal = createKeyboardReveal(window);
  keyboardReveal.start();

  const processArticles = (articles: readonly Element[]): void => {
    if (!settings.enabled) return;
    for (const article of articles) {
      const { classification } = classifyTweet(article, { settings, cache });
      renderMark(
        article,
        resolveMarkTier(classification, settings),
        messages.pills,
        buildWhyTitle(classification),
      );
      viewport.observe(article);
    }
  };

  // Scroll-idle doubles as the self-heal sweep: re-assert marking state on
  // the visible articles in case X's React erased it (cache-hit cheap).
  const scrollGate = createScrollGate(window, SCROLL_IDLE_MS, () =>
    sweepVisibleArticles(document, window, processArticles),
  );
  scrollGate.start();

  const timeline = createTimelineObserver(document, processArticles);
  timeline.start();

  watchTheme(document, (theme) => applyRootState(document, settings, theme));

  watchSettings((next) => {
    settings = next;
    messages = getMessages(settings.locale);
    // Sensitivity/keywords/whitelist affect classification: recompute all.
    cache.clear();
    clearMarks(document);
    applyRootState(document, settings, detectTheme(document));
    if (settings.enabled) {
      processArticles([...document.querySelectorAll(X_SELECTORS.tweet)]);
    }
  });

  logger.debug('AdsDim content script ready');
}
