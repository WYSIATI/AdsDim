import { X_SELECTORS } from '../../../src/selectors/x-selectors';

/**
 * Vertical margin (px) around the viewport still counted as "visible" —
 * matches the viewport observer's 150px pre-activation rootMargin.
 */
export const SWEEP_MARGIN_PX = 150;

export type SweepCallback = (articles: readonly Element[]) => void;

/**
 * Self-heal sweep, layer three behind the data-attribute state and the
 * attribute-watching MutationObserver: on scroll-idle, hand every article
 * currently intersecting the viewport (± margin) back to the marking
 * pipeline, which re-applies tier + in-view state idempotently from the
 * classification cache. Bounded work — visible articles only, no network,
 * no re-classification (cache hits), and no-op writes for healthy articles,
 * so the sweep can never echo into a MutationObserver loop.
 */
export function sweepVisibleArticles(
  doc: Document,
  win: Window,
  onArticles: SweepCallback,
  margin: number = SWEEP_MARGIN_PX,
): void {
  const viewportHeight = win.innerHeight;
  const visible = [...doc.querySelectorAll(X_SELECTORS.tweet)].filter((article) => {
    const rect = article.getBoundingClientRect();
    return rect.bottom >= -margin && rect.top <= viewportHeight + margin;
  });
  if (visible.length > 0) onArticles(visible);
}
