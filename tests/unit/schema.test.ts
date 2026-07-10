import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  parseSettings,
  SETTINGS_STORAGE_KEY,
  settingsSchema,
} from '../../src/storage/schema';

describe('settings schema', () => {
  it('defaults to enabled, glass scheme, strong contrast, all tiers on', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      enabled: true,
      scheme: 'glass',
      contrast: 'strong',
      tiers: { hard: true, soft: true, potential: true },
      sensitivity: 0.5,
      keywords: [],
      whitelist: [],
    });
  });

  it('parses undefined/null/garbage into defaults', () => {
    expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('not-an-object')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(42)).toEqual(DEFAULT_SETTINGS);
  });

  it('fills missing fields with defaults on partial input', () => {
    const parsed = parseSettings({ scheme: 'theater' });
    expect(parsed.scheme).toBe('theater');
    expect(parsed.contrast).toBe('strong');
    expect(parsed.tiers).toEqual({ hard: true, soft: true, potential: true });
  });

  it('rejects invalid enum values by falling back to defaults', () => {
    expect(parseSettings({ scheme: 'neon' })).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings({ contrast: 'extreme' })).toEqual(DEFAULT_SETTINGS);
  });

  it('rejects out-of-range sensitivity', () => {
    expect(parseSettings({ sensitivity: 2 })).toEqual(DEFAULT_SETTINGS);
    expect(() => settingsSchema.parse({ sensitivity: -0.1 })).toThrow();
  });

  it('accepts a full valid settings object', () => {
    const input = {
      enabled: false,
      scheme: 'glow',
      contrast: 'normal',
      tiers: { hard: true, soft: false, potential: false },
      sensitivity: 0.8,
      keywords: ['团购'],
      whitelist: ['@friend'],
    };
    expect(parseSettings(input)).toEqual(input);
  });

  it('uses a namespaced storage key', () => {
    expect(SETTINGS_STORAGE_KEY).toBe('adsdim:settings');
  });
});
