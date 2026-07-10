import { describe, expect, it } from 'vitest';
import { getMessages, SUPPORTED_LOCALES } from '../../src/i18n';
import { en } from '../../src/i18n/en';
import { zh } from '../../src/i18n/zh';

describe('getMessages', () => {
  it.each([
    ['en', en],
    ['zh', zh],
  ])('explicit locale %j -> its bundle', (locale, expected) => {
    expect(getMessages(locale)).toBe(expected);
  });

  it.each([
    // Unknown or malformed values fall back to English, never auto-detect.
    ['zh-CN', en],
    ['ja-JP', en],
    ['fr', en],
    ['', en],
    [undefined, en],
  ])('unsupported value %j -> English fallback', (locale, expected) => {
    expect(getMessages(locale)).toBe(expected);
  });

  it('lists every supported locale exactly once', () => {
    expect(SUPPORTED_LOCALES).toEqual(['en', 'zh']);
    expect(new Set(SUPPORTED_LOCALES).size).toBe(SUPPORTED_LOCALES.length);
  });

  it('zh pill labels match the design mockup', () => {
    expect(zh.pills).toEqual({ hard: '硬广', soft: '软广', potential: '疑似' });
  });

  it('bundles share the same shape', () => {
    expect(Object.keys(zh.pills)).toEqual(Object.keys(en.pills));
    expect(Object.keys(zh.popup)).toEqual(Object.keys(en.popup));
  });
});
