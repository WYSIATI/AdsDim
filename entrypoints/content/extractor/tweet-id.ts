import { X_SELECTORS } from '../../../src/selectors/x-selectors';

const STATUS_ID_PATTERN = /\/status\/(\d{1,25})/;

/** Stable non-crypto hash for articles without a permalink. */
export function hashText(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

/**
 * Derives a stable tweet id from the `/status/<id>` permalink.
 *
 * Anchors wrapping a <time> element are preferred: that is the tweet's own
 * header permalink, whereas bare status links may point at a quoted tweet.
 * Falls back to a text hash so caching still works for permalink-less cards.
 */
export function extractTweetId(article: Element): string {
  const anchors = [...article.querySelectorAll<HTMLAnchorElement>(X_SELECTORS.statusLink)];

  const permalink = anchors.find((anchor) => anchor.querySelector('time') !== null) ?? anchors[0];

  const match = permalink?.getAttribute('href')?.match(STATUS_ID_PATTERN);
  if (match?.[1]) {
    return `tweet:${match[1]}`;
  }
  return `text:${hashText(article.textContent ?? '')}`;
}
