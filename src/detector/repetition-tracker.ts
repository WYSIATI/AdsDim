import { LruCache } from '../cache/lru';
import type { SignalResult } from '../types';

/**
 * Session-scoped shill-network memory. Coordinated promo campaigns post the
 * same text (or the same landing domain) from many throwaway accounts; a
 * single account never triggers this. Lives in content-script memory only —
 * nothing is persisted — and is bounded by LRU eviction.
 */

/** Distinct authors sharing one normalized text before it counts as a network. */
export const TEXT_AUTHOR_THRESHOLD = 3;
/** Distinct authors sharing one destination domain before it counts. */
export const DOMAIN_AUTHOR_THRESHOLD = 4;

const DEFAULT_CAPACITY = 300;
const NORMALIZED_PREFIX_LENGTH = 120;
/** Short texts ("gm", "lol") collide massively across authors: never track. */
const MIN_NORMALIZED_LENGTH = 20;
/** Hot-domain evidence is a weak boost, not proof (half score, no disclosure). */
const HOT_DOMAIN_SCORE = 0.5;

/** Hosts that belong to X itself and never identify a campaign destination. */
const PLATFORM_HOSTS: readonly string[] = [
  't.co',
  'x.com',
  'twitter.com',
  'mobile.twitter.com',
  'pbs.twimg.com',
  'pic.twitter.com',
];

/** Cross-author evidence for one post, produced by {@link RepetitionTracker}. */
export interface RepetitionEvidence {
  /** Distinct authors seen with this post's normalized text (incl. this one). */
  readonly textAuthorCount: number;
  /** Highest distinct-author count among this post's destination domains. */
  readonly hotDomainAuthorCount: number;
}

/** Strips URLs, mentions, hashtags and whitespace; keys on the first 120 chars. */
const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[@#][\p{L}\p{N}_]+/gu, '')
    .replace(/\s+/gu, '')
    .slice(0, NORMALIZED_PREFIX_LENGTH);

const normalizeAuthor = (handle: string): string => handle.replace(/^@/, '').toLowerCase();

/** Destination host of a URL, or null for relative paths and X's own hosts. */
const extractDomain = (url: string): string | null => {
  const trimmed = url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '');
  if (!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/?#]|$)/.test(trimmed)) return null;
  const host = (trimmed.split(/[/?#]/, 1)[0] ?? '').replace(/^www\./, '');
  return PLATFORM_HOSTS.includes(host) ? null : host;
};

/** Tracks normalized-text and domain sightings per author, LRU-bounded. */
export class RepetitionTracker {
  private readonly textAuthors: LruCache<string, ReadonlySet<string>>;
  private readonly domainAuthors: LruCache<string, ReadonlySet<string>>;

  constructor(capacity: number = DEFAULT_CAPACITY) {
    this.textAuthors = new LruCache(capacity);
    this.domainAuthors = new LruCache(capacity);
  }

  /** Records one sighting (idempotent per author) and returns the evidence. */
  record(text: string, authorHandle: string | null, urls: readonly string[]): RepetitionEvidence {
    const author = authorHandle === null ? null : normalizeAuthor(authorHandle);
    const key = normalizeText(text);
    const textAuthorCount =
      key.length < MIN_NORMALIZED_LENGTH ? 0 : addSighting(this.textAuthors, key, author);

    const domains = new Set(urls.map(extractDomain).filter((d): d is string => d !== null));
    const domainCounts = [...domains].map((domain) =>
      addSighting(this.domainAuthors, domain, author),
    );
    return { textAuthorCount, hotDomainAuthorCount: Math.max(0, ...domainCounts) };
  }
}

/** Adds an author to a keyed set (immutably) and returns the distinct count. */
const addSighting = (
  cache: LruCache<string, ReadonlySet<string>>,
  key: string,
  author: string | null,
): number => {
  const existing = cache.get(key) ?? new Set<string>();
  const next = author === null || existing.has(author) ? existing : new Set([...existing, author]);
  cache.set(key, next);
  return next.size;
};

/** Builds the repetition signal from tracker evidence. */
export function repetitionSignal(evidence: RepetitionEvidence): SignalResult {
  if (evidence.textAuthorCount >= TEXT_AUTHOR_THRESHOLD) {
    return {
      id: 'repetition',
      score: 1,
      matches: [`identical text posted by ${evidence.textAuthorCount} accounts`],
      disclosure: true,
    };
  }
  if (evidence.hotDomainAuthorCount >= DOMAIN_AUTHOR_THRESHOLD) {
    return {
      id: 'repetition',
      score: HOT_DOMAIN_SCORE,
      matches: [`link domain shared by ${evidence.hotDomainAuthorCount} accounts`],
      disclosure: false,
    };
  }
  return { id: 'repetition', score: 0, matches: [], disclosure: false };
}
