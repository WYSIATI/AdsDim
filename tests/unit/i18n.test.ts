import { describe, expect, it } from 'vitest';
import { getMessages } from '../../src/i18n';
import { en } from '../../src/i18n/en';
import { zh } from '../../src/i18n/zh';

describe('getMessages', () => {
  it.each([
    ['zh', zh],
    ['zh-CN', zh],
    ['zh-Hant-TW', zh],
    ['ZH-TW', zh],
    ['en', en],
    ['en-US', en],
    ['ja-JP', en],
    [undefined, en],
  ])('locale %j -> expected bundle', (locale, expected) => {
    expect(getMessages(locale)).toBe(expected);
  });

  it('zh pill labels match the design mockup', () => {
    expect(zh.pills).toEqual({ hard: '硬广', soft: '软广', potential: '疑似' });
  });

  it('bundles share the same shape', () => {
    expect(Object.keys(zh.pills)).toEqual(Object.keys(en.pills));
    expect(Object.keys(zh.popup)).toEqual(Object.keys(en.popup));
  });
});
