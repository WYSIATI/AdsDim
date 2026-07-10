/**
 * Single source of truth for every X (Twitter) DOM selector AdsDim relies on.
 * If X changes its DOM, this is the only file that should need updating.
 */
export const X_SELECTORS = {
  /** A tweet card in any timeline. */
  tweet: 'article[data-testid="tweet"]',
  /** The tweet body text container. */
  tweetText: '[data-testid="tweetText"]',
  /** Author display name + handle row in the tweet header. */
  userName: '[data-testid="User-Name"]',
  /** Context banner above a tweet ("Promoted", "Ad", "XX reposted", ...). */
  socialContext: '[data-testid="socialContext"]',
  /** Wrapper X uses around promoted content. */
  placementTracking: '[data-testid="placementTracking"]',
  /** Permalink anchors that carry the tweet id. */
  statusLink: 'a[href*="/status/"]',
} as const;

export type XSelectorKey = keyof typeof X_SELECTORS;
