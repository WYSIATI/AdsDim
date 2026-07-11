import { X_SELECTORS } from '../../../src/selectors/x-selectors';
import type { TweetData } from '../../../src/types';
import { extractTweetId } from './tweet-id';

/**
 * Anchor display text is only treated as a URL when it looks domain-like
 * ("amzn.to/3xYz", "example.com"). Matched case-sensitively against the
 * trimmed text: X lowercases display URLs, while prose brand names that
 * merely contain a dot ("Node.js") keep their casing and are rejected.
 */
const DOMAIN_LIKE_TEXT = /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/;

/**
 * Extracts an immutable TweetData snapshot from a tweet <article>.
 * Content nested in a quote-repost card is excluded: the quoted tweet's
 * text and links belong to the quoted author, not the outer post.
 * Pure DOM reads only; never mutates the page.
 */
export function extractTweetData(article: Element): TweetData {
  const quotes = findQuoteContainers(article);
  return Object.freeze({
    id: extractTweetId(article),
    text: extractText(article, quotes),
    authorName: extractAuthorName(article),
    authorHandle: extractAuthorHandle(article),
    urls: extractUrls(article, quotes),
    isReply: detectIsReply(article),
  });
}

/** Leading text of a genuine reply-context row (en/zh UI). */
const REPLY_TEXT_PATTERN = /^(?:replying to|回复)/i;

/**
 * A tweet is a reply when a context row above the body says "Replying to
 * @x" / 回复. Candidates inside tweetText are the post's own words, and a
 * real row always links the parent author's profile.
 */
function detectIsReply(article: Element): boolean {
  return [...article.querySelectorAll(X_SELECTORS.replyContext)].some(
    (candidate) =>
      candidate.closest(X_SELECTORS.tweetText) === null &&
      candidate.querySelector('a[href]') !== null &&
      REPLY_TEXT_PATTERN.test((candidate.textContent ?? '').trim()),
  );
}

/** Quote-repost cards: role="link" containers with their own tweet text. */
function findQuoteContainers(article: Element): readonly Element[] {
  return [...article.querySelectorAll(X_SELECTORS.quotedTweet)].filter(
    (candidate) => candidate.querySelector(X_SELECTORS.tweetText) !== null,
  );
}

const isInsideAny = (element: Element, containers: readonly Element[]): boolean =>
  containers.some((container) => container.contains(element));

/** The outer tweet's own text: the first tweetText not inside a quote card. */
function extractText(article: Element, quotes: readonly Element[]): string {
  const textEl = [...article.querySelectorAll(X_SELECTORS.tweetText)].find(
    (el) => !isInsideAny(el, quotes),
  );
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
 * Collects both href attributes and domain-like visible link texts from the
 * outer tweet. X routes hrefs through t.co, while the display text keeps the
 * real domain — both matter for URL heuristics. Anchors inside a quoted
 * tweet are skipped entirely.
 */
function extractUrls(article: Element, quotes: readonly Element[]): readonly string[] {
  const anchors = [...article.querySelectorAll<HTMLAnchorElement>('a[href]')].filter(
    (anchor) => !isInsideAny(anchor, quotes),
  );

  const urls = anchors.flatMap((anchor) => {
    const href = anchor.getAttribute('href');
    const text = (anchor.textContent ?? '').trim();
    return [...(href ? [href] : []), ...(DOMAIN_LIKE_TEXT.test(text) ? [text] : [])];
  });
  return Object.freeze(urls);
}
