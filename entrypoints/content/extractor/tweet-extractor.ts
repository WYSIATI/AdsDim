import { X_SELECTORS } from '../../../src/selectors/x-selectors';
import type { TweetData } from '../../../src/types';
import { extractTweetId } from './tweet-id';

/**
 * Extracts an immutable TweetData snapshot from a tweet <article>.
 * Pure DOM reads only; never mutates the page.
 */
export function extractTweetData(article: Element): TweetData {
  return Object.freeze({
    id: extractTweetId(article),
    text: extractText(article),
    authorName: extractAuthorName(article),
    authorHandle: extractAuthorHandle(article),
    urls: extractUrls(article),
  });
}

function extractText(article: Element): string {
  const textEl = article.querySelector(X_SELECTORS.tweetText);
  return (textEl?.textContent ?? '').trim();
}

function extractAuthorHandle(article: Element): string | null {
  const userName = article.querySelector(X_SELECTORS.userName);
  if (!userName) return null;
  for (const span of userName.querySelectorAll('span')) {
    const text = (span.textContent ?? '').trim();
    if (/^@[A-Za-z0-9_]+$/.test(text)) return text;
  }
  return null;
}

function extractAuthorName(article: Element): string | null {
  const userName = article.querySelector(X_SELECTORS.userName);
  if (!userName) return null;
  for (const span of userName.querySelectorAll('span')) {
    const text = (span.textContent ?? '').trim();
    if (text.length > 0 && !text.startsWith('@') && !text.startsWith('·')) {
      return text;
    }
  }
  return null;
}

/**
 * Collects both href attributes and visible link texts. X routes hrefs
 * through t.co, while the display text keeps the real domain — both matter
 * for URL heuristics.
 */
function extractUrls(article: Element): readonly string[] {
  const urls: string[] = [];
  for (const anchor of article.querySelectorAll<HTMLAnchorElement>('a[href]')) {
    const href = anchor.getAttribute('href');
    if (href) urls.push(href);
    const text = (anchor.textContent ?? '').trim();
    if (text.includes('.') && !text.startsWith('@')) urls.push(text);
  }
  return Object.freeze(urls);
}
