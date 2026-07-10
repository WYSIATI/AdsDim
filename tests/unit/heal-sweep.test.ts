import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SWEEP_MARGIN_PX,
  sweepVisibleArticles,
} from '../../entrypoints/content/observer/heal-sweep';

afterEach(() => {
  document.body.innerHTML = '';
});

/** Creates a tweet article whose bounding rect reports the given top/bottom. */
const addArticle = (top: number, bottom: number): HTMLElement => {
  const article = document.createElement('article');
  article.setAttribute('data-testid', 'tweet');
  article.getBoundingClientRect = vi.fn(
    () =>
      ({
        top,
        bottom,
        left: 0,
        right: 600,
        width: 600,
        height: bottom - top,
        x: 0,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect,
  );
  document.body.appendChild(article);
  return article;
};

describe('sweepVisibleArticles', () => {
  const viewportHeight = window.innerHeight;

  it('hands only the articles intersecting the viewport (± margin) to the callback', () => {
    const above = addArticle(-900, -700); // fully above, outside the margin
    const nearTop = addArticle(-SWEEP_MARGIN_PX + 10, -10); // inside top margin
    const visible = addArticle(100, 400);
    const nearBottom = addArticle(viewportHeight + 10, viewportHeight + SWEEP_MARGIN_PX + 300);
    const below = addArticle(viewportHeight + SWEEP_MARGIN_PX + 50, viewportHeight + 2000);

    const onArticles = vi.fn();
    sweepVisibleArticles(document, window, onArticles);

    expect(onArticles).toHaveBeenCalledTimes(1);
    expect(onArticles.mock.calls[0]?.[0]).toEqual([nearTop, visible, nearBottom]);
    expect(onArticles.mock.calls[0]?.[0]).not.toContain(above);
    expect(onArticles.mock.calls[0]?.[0]).not.toContain(below);
  });

  it('skips the callback entirely when nothing is visible (bounded work)', () => {
    addArticle(-2000, -1800);
    addArticle(viewportHeight + 1800, viewportHeight + 2000);

    const onArticles = vi.fn();
    sweepVisibleArticles(document, window, onArticles);
    expect(onArticles).not.toHaveBeenCalled();
  });

  it('ignores non-tweet elements', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const onArticles = vi.fn();
    sweepVisibleArticles(document, window, onArticles);
    expect(onArticles).not.toHaveBeenCalled();
  });

  it('honors a custom margin', () => {
    const article = addArticle(-500, -400);

    const wideMargin = vi.fn();
    sweepVisibleArticles(document, window, wideMargin, 600);
    expect(wideMargin.mock.calls[0]?.[0]).toEqual([article]);

    const zeroMargin = vi.fn();
    sweepVisibleArticles(document, window, zeroMargin, 0);
    expect(zeroMargin).not.toHaveBeenCalled();
  });
});
