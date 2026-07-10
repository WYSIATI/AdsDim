import { X_SELECTORS } from '../selectors/x-selectors';
import { isPromotedLabel } from './promoted-labels';

/** Labels are short; anything longer is regular content, not a badge. */
const MAX_LABEL_LENGTH = 20;

/**
 * Detects X's own "Promoted"/"Ad" badge on a tweet.
 *
 * Only a real badge convicts: the socialContext banner text, or a standalone
 * short leaf span outside the tweet text, the quoted card, the author name
 * row and any anchor. X's badge is never a link, while display names,
 * handles, timestamps and link-card domains all live inside anchors — that
 * asymmetry is what keeps "推广" as a display name or a card title reading
 * "Ad" from convicting the post.
 *
 * The placementTracking wrapper alone is deliberately NOT evidence: X also
 * wraps organic video/media components in it, so its mere presence says
 * nothing. A genuine promoted post carries a label span inside that wrapper,
 * which the standalone-span scan below finds on its own.
 */
export function detectHardAd(article: Element): boolean {
  const socialContext = article.querySelector(X_SELECTORS.socialContext);
  if (socialContext && isPromotedLabel(socialContext.textContent ?? '')) {
    return true;
  }

  return hasStandaloneLabelSpan(article);
}

function hasStandaloneLabelSpan(article: Element): boolean {
  for (const span of article.querySelectorAll('span')) {
    if (span.children.length > 0) continue;
    if (span.closest(X_SELECTORS.tweetText) !== null) continue;
    if (span.closest(X_SELECTORS.quotedTweet) !== null) continue;
    if (span.closest(X_SELECTORS.userName) !== null) continue;
    if (span.closest('a') !== null) continue;
    const text = (span.textContent ?? '').trim();
    if (text.length === 0 || text.length > MAX_LABEL_LENGTH) continue;
    if (isPromotedLabel(text)) return true;
  }
  return false;
}
