import type { Classification } from '../../../src/types';

const MAX_MATCHES_PER_SIGNAL = 2;
const MAX_MATCH_LENGTH = 40;

const compact = (match: string): string =>
  match.length > MAX_MATCH_LENGTH ? `${match.slice(0, MAX_MATCH_LENGTH - 1)}…` : match;

/**
 * Compact English explanation of why a tweet was marked, shown as the
 * pill's native title tooltip, e.g. "AdsDim: keyword(#ad), url(amzn.to)".
 * Returns null for organic posts (they carry no pill).
 */
export function buildWhyTitle(classification: Classification): string | null {
  if (classification.tier === null) return null;
  if (classification.source === 'promoted-label') return 'AdsDim: promoted label';
  if (classification.signals.length === 0) return 'AdsDim: heuristics';

  const parts = classification.signals.map((signal) => {
    const matches = signal.matches.slice(0, MAX_MATCHES_PER_SIGNAL).map(compact).join(', ');
    return `${signal.id}(${matches})`;
  });
  return `AdsDim: ${parts.join(', ')}`;
}
