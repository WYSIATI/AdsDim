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
  /**
   * Candidate quote-repost card container. Only a match that contains its
   * own tweetText is a real quoted tweet; link-preview cards also use
   * role="link" but carry no tweet text.
   */
  quotedTweet: 'div[role="link"]',
  /**
   * Candidate "Replying to @x" / "回复" context rows. X gives the row no
   * testid, so the extractor confirms candidates by their leading text and
   * a contained profile anchor, and excludes anything inside tweetText.
   */
  replyContext: 'div[dir]',
} as const;

export type XSelectorKey = keyof typeof X_SELECTORS;
