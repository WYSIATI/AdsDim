import { describe, expect, it } from 'vitest';
import { isPromotedLabel, PROMOTED_LABELS } from '../../src/detector/promoted-labels';

describe('promoted-labels', () => {
  it.each([
    'Ad',
    'ad',
    'AD',
    'Promoted',
    '广告',
    '推广',
    '廣告',
    'プロモーション',
    '광고',
    'Anzeige',
    'Gesponsert',
    'Publicidad',
    'Publicité',
    'Sponsorisé',
    'Реклама',
    '  Promoted  ',
  ])('recognises %j as a promoted label', (label) => {
    expect(isPromotedLabel(label)).toBe(true);
  });

  it.each([
    '',
    'Advert',
    'Advertisement',
    'ads are annoying',
    '广告法',
    '这是广告',
    'Promoted by nobody',
    '@promoted',
  ])('rejects %j', (text) => {
    expect(isPromotedLabel(text)).toBe(false);
  });

  it('stores latin labels lowercased for case-insensitive matching', () => {
    for (const label of PROMOTED_LABELS) {
      expect(label).toBe(label.toLowerCase());
    }
  });
});
