import { X_SELECTORS } from '../../../src/selectors/x-selectors';
import { TIER_ATTR } from '../renderer/mark-renderer';
import { IN_VIEW_ATTR } from './viewport-observer';

export const TIMELINE_THROTTLE_MS = 100;

/**
 * AdsDim's own marking attributes, watched for erasure: X's React re-renders
 * can strip attributes it does not know about from the article without any
 * childList mutation. `class` is deliberately NOT watched — X mutates
 * classes constantly and would flood the throttle (which is exactly why the
 * marking state lives in data-* attributes instead of classes).
 */
export const WATCHED_ATTRIBUTES: readonly string[] = [TIER_ATTR, IN_VIEW_ATTR];

export interface TimelineObserver {
  start(): void;
  stop(): void;
}

export type ArticlesCallback = (articles: readonly Element[]) => void;

/**
 * Watches X's virtualized timeline for tweet articles: childList mutations
 * catch (re)mounts, and attribute mutations on WATCHED_ATTRIBUTES catch X
 * erasing our marking state in place. Mutations are throttled to one scan
 * per 100ms; downstream classification and rendering are idempotent (cache
 * hits, no-op attribute writes), so scanning the full visible set is safe
 * and the healing re-apply can never echo into an observer loop.
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
      observer.observe(doc.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [...WATCHED_ATTRIBUTES],
      });
      scan();
    },
    stop(): void {
      stopped = true;
      observer.disconnect();
    },
  };
}
