/**
 * Localized labels X places on promoted tweets.
 * Latin-script labels are stored lowercase and matched case-insensitively.
 */
const LABELS: readonly string[] = [
  // English — X renders "Ad" or "Promoted", never "Ads".
  'ad',
  'promoted',
  // Chinese (Simplified / Traditional)
  '广告',
  '推广',
  '廣告',
  '推廣',
  // Japanese
  'プロモーション',
  'プロモツイート',
  // Korean
  '광고',
  // German
  'anzeige',
  'gesponsert',
  // Spanish
  'publicidad',
  'promocionado',
  // French
  'publicité',
  'sponsorisé',
  // Portuguese
  'publicidade',
  'promovido',
  // Italian
  'sponsorizzato',
  // Russian
  'реклама',
];

export const PROMOTED_LABELS: ReadonlySet<string> = new Set(LABELS);

/** True when the given text is exactly a promoted-tweet label. */
export function isPromotedLabel(text: string): boolean {
  return PROMOTED_LABELS.has(text.trim().toLowerCase());
}
