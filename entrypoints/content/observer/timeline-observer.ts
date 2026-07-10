import { X_SELECTORS } from '../../../src/selectors/x-selectors';

export const TIMELINE_THROTTLE_MS = 100;

export interface TimelineObserver {
  start(): void;
  stop(): void;
}

export type ArticlesCallback = (articles: readonly Element[]) => void;

/**
 * Watches X's virtualized timeline for tweet articles.
 * Mutations are throttled to one scan per 100ms; downstream classification
 * and rendering are idempotent, so scanning the full visible set is safe.
 */
export function createTimelineObserver(
  doc: Document,
  onArticles: ArticlesCallback,
  throttleMs: number = TIMELINE_THROTTLE_MS,
): TimelineObserver {
  let pending = false;
  let stopped = false;

  const scan = (): void => {
    pending = false;
    if (stopped) return;
    const articles = [...doc.querySelectorAll(X_SELECTORS.tweet)];
    if (articles.length > 0) onArticles(articles);
  };

  const schedule = (): void => {
    if (pending || stopped) return;
    pending = true;
    setTimeout(scan, throttleMs);
  };

  const observer = new MutationObserver(schedule);

  return {
    start(): void {
      stopped = false;
      observer.observe(doc.body, { childList: true, subtree: true });
      scan();
    },
    stop(): void {
      stopped = true;
      observer.disconnect();
    },
  };
}
