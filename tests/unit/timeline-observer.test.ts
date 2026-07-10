import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTimelineObserver } from '../../entrypoints/content/observer/timeline-observer';
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
});
