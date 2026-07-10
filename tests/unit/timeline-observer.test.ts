import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createTimelineObserver,
  WATCHED_ATTRIBUTES,
} from '../../entrypoints/content/observer/timeline-observer';
import { loadFixture } from '../helpers/fixture';

afterEach(() => {
  document.body.innerHTML = '';
});

const flush = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

describe('createTimelineObserver', () => {
  it('scans existing articles immediately on start', () => {
    loadFixture('timeline.html');
    const onArticles = vi.fn();
    const observer = createTimelineObserver(document, onArticles, 5);

    observer.start();
    expect(onArticles).toHaveBeenCalledTimes(1);
    expect(onArticles.mock.calls[0]?.[0]).toHaveLength(8);
    observer.stop();
  });

  it('coalesces rapid mutations into one throttled scan', async () => {
    const onArticles = vi.fn();
    const observer = createTimelineObserver(document, onArticles, 10);
    observer.start();
    onArticles.mockClear();

    for (let i = 0; i < 5; i += 1) {
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');
      document.body.appendChild(article);
    }

    await flush(50);
    expect(onArticles).toHaveBeenCalledTimes(1);
    expect(onArticles.mock.calls[0]?.[0]).toHaveLength(5);
    observer.stop();
  });

  it('does not fire after stop()', async () => {
    const onArticles = vi.fn();
    const observer = createTimelineObserver(document, onArticles, 5);
    observer.start();
    onArticles.mockClear();
    observer.stop();

    const article = document.createElement('article');
    article.setAttribute('data-testid', 'tweet');
    document.body.appendChild(article);

    await flush(30);
    expect(onArticles).not.toHaveBeenCalled();
  });

  it('skips the callback entirely when no articles exist', () => {
    const onArticles = vi.fn();
    const observer = createTimelineObserver(document, onArticles, 5);
    observer.start();
    expect(onArticles).not.toHaveBeenCalled();
    observer.stop();
  });

  it('rescans when a marking attribute is erased from an existing article', async () => {
    // X's React re-renders can strip our data-* attributes in place: no
    // childList mutation fires, so the observer must watch the attributes
    // themselves to heal the marking.
    const article = document.createElement('article');
    article.setAttribute('data-testid', 'tweet');
    article.setAttribute('data-adsdim-tier', 'hard');
    article.setAttribute('data-adsdim-in', '1');
    document.body.appendChild(article);

    const onArticles = vi.fn();
    const observer = createTimelineObserver(document, onArticles, 5);
    observer.start();
    onArticles.mockClear();

    for (const attribute of WATCHED_ATTRIBUTES) {
      article.removeAttribute(attribute);
      await flush(30);
      expect(onArticles).toHaveBeenCalledTimes(1);
      expect(onArticles.mock.calls[0]?.[0]).toEqual([article]);
      onArticles.mockClear();
    }
    observer.stop();
  });

  it('ignores class mutations — X churns classes constantly', async () => {
    const article = document.createElement('article');
    article.setAttribute('data-testid', 'tweet');
    document.body.appendChild(article);

    const onArticles = vi.fn();
    const observer = createTimelineObserver(document, onArticles, 5);
    observer.start();
    onArticles.mockClear();

    // Simulated React commit: className rewritten wholesale.
    article.className = 'css-175oi2r r-1igl3o0';
    article.setAttribute('aria-labelledby', 'id-rewritten-by-react');

    await flush(30);
    expect(onArticles).not.toHaveBeenCalled();
    observer.stop();
  });
});
