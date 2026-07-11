import type { SignalResult } from '../../types';

/**
 * Structural spam shape: how a post is built rather than what it says.
 * Hashtag floods, cashtag spam, hype-emoji clusters and link-heavy stubs are
 * weak evidence — organic posts occasionally look like this, so the signal
 * is never disclosure-grade and always needs a second category. Each fired
 * component contributes {@link COMPONENT_SCORE}; two components saturate.
 */
const COMPONENT_SCORE = 0.5;

const HASHTAG_THRESHOLD = 5;
const CASHTAG_THRESHOLD = 2;
const HYPE_EMOJI_THRESHOLD = 3;
const SHORT_TEXT_MAX_LENGTH = 80;
const MULTI_LINK_THRESHOLD = 2;

const HASHTAG_PATTERN = /#[\p{L}\p{N}_]/gu;
const CASHTAG_PATTERN = /\$[A-Z]{2,8}\b/g;
/** Money/hype emoji commonly stacked on shill posts. */
const HYPE_EMOJI_PATTERN = /[🔥💰🚀💎🤑💸🪙📈]/gu;
/** Pointer emoji that direct readers at a link. */
const POINTER_EMOJI_PATTERN = /[👇👆⬇➡]/u;
const URL_IN_TEXT_PATTERN = /\bhttps?:\/\//i;

/** Hosts that are part of X itself, never destination links. */
const PLATFORM_HOSTS: readonly string[] = ['t.co', 'x.com', 'twitter.com', 'pbs.twimg.com'];

const countMatches = (text: string, pattern: RegExp): number => [...text.matchAll(pattern)].length;

/**
 * Distinct external destinations. Relative paths (mention/hashtag anchors)
 * and X's own hosts are excluded; the t.co href and its display text would
 * otherwise double-count one link. Also used by classify-content to decide
 * whether a reply actually carries a link (reply-spam bonus).
 */
export const countExternalUrls = (urls: readonly string[]): number => {
  const normalized = urls
    .map((url) =>
      url
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, ''),
    )
    .filter((url) => /^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/?#]|$)/.test(url))
    .filter((url) => !PLATFORM_HOSTS.some((host) => url === host || url.startsWith(`${host}/`)));
  return new Set(normalized).size;
};

interface Component {
  /** Match token rendered in the "why" tooltip. */
  readonly label: string;
  readonly fired: boolean;
}

const buildComponents = (text: string, urls: readonly string[]): readonly Component[] => {
  const hashtags = countMatches(text, HASHTAG_PATTERN);
  const cashtags = countMatches(text, CASHTAG_PATTERN);
  const hypeEmoji = countMatches(text, HYPE_EMOJI_PATTERN);
  const externalUrls = countExternalUrls(urls);
  const hasLink = externalUrls > 0 || URL_IN_TEXT_PATTERN.test(text);

  return [
    { label: `hashtag-flood(${hashtags})`, fired: hashtags >= HASHTAG_THRESHOLD },
    { label: `cashtag-spam(${cashtags})`, fired: cashtags >= CASHTAG_THRESHOLD },
    { label: `hype-emoji(${hypeEmoji})`, fired: hypeEmoji >= HYPE_EMOJI_THRESHOLD },
    { label: 'pointer-to-link', fired: POINTER_EMOJI_PATTERN.test(text) && hasLink },
    {
      label: `short-text-multi-link(${externalUrls})`,
      fired: text.trim().length < SHORT_TEXT_MAX_LENGTH && externalUrls >= MULTI_LINK_THRESHOLD,
    },
  ];
};

/** Scores structural spam shape over the tweet text and links. */
export function structuralSignal(text: string, urls: readonly string[] = []): SignalResult {
  const fired = buildComponents(text, urls).filter((component) => component.fired);
  return {
    id: 'structural',
    score: Math.min(1, fired.length * COMPONENT_SCORE),
    matches: fired.map((component) => component.label),
    disclosure: false,
  };
}
