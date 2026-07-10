import { X_SELECTORS } from '../selectors/x-selectors';
import { isPromotedLabel } from './promoted-labels';

/** Labels are short; anything longer is regular content, not a badge. */
const MAX_LABEL_LENGTH = 20;

/**
 * Detects X's own "Promoted"/"Ad" badge on a tweet.
 *
 * Only the tweet chrome (header/footer/context rows) is inspected — never the
 * tweet text body — so a post that merely *talks about* 广告/ads is not a hit.
 * A label counts when it is a standalone short leaf span, which is how X
 * renders the badge in every locale.
 */
export function detectHardAd(article: Element): boolean {
  const socialContext = article.querySelector(X_SELECTORS.socialContext);
  if (socialContext && isPromotedLabel(socialContext.textContent ?? '')) {
    return true;
  }

  if (article.querySelector(X_SELECTORS.placementTracking) !== null) {
    return true;
  }

  return hasStandaloneLabelSpan(article);
}

function hasStandaloneLabelSpan(article: Element): boolean {
  for (const span of article.querySelectorAll('span')) {
    if (span.children.length > 0) continue;
    if (span.closest(X_SELECTORS.tweetText) !== null) continue;
    const text = (span.textContent ?? '').trim();
    if (text.length === 0 || text.length > MAX_LABEL_LENGTH) continue;
    if (isPromotedLabel(text)) return true;
  }
  return false;
}
