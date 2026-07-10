import { describe, expect, it } from 'vitest';
import { extractTweetId, hashText } from '../../entrypoints/content/extractor/tweet-id';
import { fixtureArticle, loadFixture } from '../helpers/fixture';

const articleWith = (inner: string): Element => {
  document.body.innerHTML = `<article data-testid="tweet">${inner}</article>`;
  return document.querySelector('article') as Element;
};

describe('extractTweetId', () => {
  it('extracts the id from the permalink of fixture tweets', () => {
    const doc = loadFixture('timeline.html');
    expect(extractTweetId(fixtureArticle(doc, 'organic-en'))).toBe('tweet:1001');
    expect(extractTweetId(fixtureArticle(doc, 'promoted-zh'))).toBe('tweet:1003');
  });

  it('prefers the anchor wrapping a <time> over quoted-tweet links', () => {
    const article = articleWith(`
      <a href="/quoted/status/9999">quoted card</a>
      <a href="/author/status/1234"><time datetime="2026-01-01">1h</time></a>
    `);
    expect(extractTweetId(article)).toBe('tweet:1234');
  });

  it('falls back to the first status link without a time element', () => {
    const article = articleWith('<a href="/author/status/777/analytics">stats</a>');
    expect(extractTweetId(article)).toBe('tweet:777');
  });

  it('falls back to a stable text hash without any permalink', () => {
    const article = articleWith('<p>hello world</p>');
    const first = extractTweetId(article);
    const second = extractTweetId(article);
    expect(first).toMatch(/^text:/);
    expect(first).toBe(second);
  });
});

describe('hashText', () => {
  it('is deterministic and input-sensitive', () => {
    expect(hashText('abc')).toBe(hashText('abc'));
    expect(hashText('abc')).not.toBe(hashText('abd'));
    expect(hashText('')).toBe(hashText(''));
  });
});
