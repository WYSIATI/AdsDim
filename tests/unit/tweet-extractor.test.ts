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

  describe('quote reposts', () => {
    it('takes text from the outer tweet, not the quoted one', () => {
      const data = extractTweetData(fixtureArticle(doc, 'quote-organic'));
      expect(data.text).toBe('这个观点有意思');
      expect(data.text).not.toContain('优惠码');
    });

    it('does not inherit urls from the quoted tweet', () => {
      const data = extractTweetData(fixtureArticle(doc, 'quote-organic'));
      expect(data.urls).not.toContain('https://t.co/qqq111');
      expect(data.urls.some((url) => url.includes('amzn.to'))).toBe(false);
    });

    it('keeps the outer author, not the quoted one', () => {
      const data = extractTweetData(fixtureArticle(doc, 'quote-organic'));
      expect(data.authorHandle).toBe('@thinker');
      expect(data.id).toBe('tweet:1008');
    });
  });

  it('only collects anchor text that looks like a domain', () => {
    document.body.innerHTML = `
      <article data-testid="tweet">
        <div data-testid="tweetText">
          <span>Great writeup on</span>
          <a href="https://t.co/aaa111">Node.js</a>
          <a href="https://t.co/bbb222">amzn.to/3xYz</a>
        </div>
      </article>`;
    const data = extractTweetData(document.querySelector('article') as Element);
    expect(data.urls).toContain('https://t.co/aaa111');
    expect(data.urls).toContain('https://t.co/bbb222');
    expect(data.urls).toContain('amzn.to/3xYz');
    expect(data.urls).not.toContain('Node.js');
  });

  describe('reply detection', () => {
    const replyArticle = (contextRow: string, text = 'nice take'): Element => {
      document.body.innerHTML = `
        <article data-testid="tweet">
          <div>
            ${contextRow}
            <div data-testid="tweetText" dir="auto"><span>${text}</span></div>
          </div>
        </article>`;
      return document.querySelector('article') as Element;
    };

    it('detects an English reply context row', () => {
      const article = replyArticle(
        '<div dir="ltr">Replying to <a href="/someone">@someone</a></div>',
      );
      expect(extractTweetData(article).isReply).toBe(true);
    });

    it('detects a Chinese reply context row', () => {
      const article = replyArticle('<div dir="ltr">回复 <a href="/someone">@someone</a></div>');
      expect(extractTweetData(article).isReply).toBe(true);
    });

    it('is false for a plain tweet', () => {
      expect(extractTweetData(fixtureArticle(doc, 'organic-en')).isReply).toBe(false);
    });

    it('ignores tweet text that merely starts with "Replying to"', () => {
      document.body.innerHTML = `
        <article data-testid="tweet">
          <div>
            <div data-testid="tweetText" dir="auto">
              <span>Replying to </span><a href="/x">@x</a><span> thanks all!</span>
            </div>
          </div>
        </article>`;
      const article = document.querySelector('article') as Element;
      expect(extractTweetData(article).isReply).toBe(false);
    });

    it('ignores a dir row without a profile anchor', () => {
      const article = replyArticle('<div dir="ltr">Replying to my earlier point here</div>');
      expect(extractTweetData(article).isReply).toBe(false);
    });
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
