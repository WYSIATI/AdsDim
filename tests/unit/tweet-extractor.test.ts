import { beforeEach, describe, expect, it } from 'vitest';
import { extractTweetData } from '../../entrypoints/content/extractor/tweet-extractor';
import { fixtureArticle, loadFixture } from '../helpers/fixture';

describe('extractTweetData', () => {
  let doc: Document;

  beforeEach(() => {
    doc = loadFixture('timeline.html');
  });

  it('extracts id, author and text from an organic tweet', () => {
    const data = extractTweetData(fixtureArticle(doc, 'organic-en'));
    expect(data.id).toBe('tweet:1001');
    expect(data.authorName).toBe('Tech Opinions');
    expect(data.authorHandle).toBe('@techguy');
    expect(data.text).toContain('Open models');
  });

  it('collects both hrefs and visible link texts as urls', () => {
    const data = extractTweetData(fixtureArticle(doc, 'soft-zh'));
    expect(data.urls).toContain('https://t.co/abc123');
    expect(data.urls).toContain('amzn.to/3xYz?tag=stylekol-20');
  });

  it('returns a frozen (immutable) snapshot', () => {
    const data = extractTweetData(fixtureArticle(doc, 'organic-en'));
    expect(Object.isFrozen(data)).toBe(true);
    expect(Object.isFrozen(data.urls)).toBe(true);
  });

  it('handles articles missing author and text gracefully', () => {
    document.body.innerHTML = '<article data-testid="tweet"><div></div></article>';
    const data = extractTweetData(document.querySelector('article') as Element);
    expect(data.authorName).toBeNull();
    expect(data.authorHandle).toBeNull();
    expect(data.text).toBe('');
    expect(data.urls).toEqual([]);
  });
});
