import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '../../src/storage/schema';
import type { StorageAreaLike } from '../../src/storage/settings-store';
import { createSettingsStore } from '../../src/storage/settings-store';

/** In-memory StorageArea double. */
function createFakeArea(initial: Record<string, unknown> = {}): {
  area: StorageAreaLike;
  data: Record<string, unknown>;
} {
  let data: Record<string, unknown> = { ...initial };
  const area: StorageAreaLike = {
    get: (key) => Promise.resolve(key in data ? { [key]: data[key] } : {}),
    set: (items) => {
      data = { ...data, ...items };
      return Promise.resolve();
    },
  };
  return {
    area,
    get data() {
      return data;
    },
  };
}

describe('createSettingsStore', () => {
  it('loads defaults from empty storage', async () => {
    const { area } = createFakeArea();
    await expect(createSettingsStore(area).load()).resolves.toEqual(DEFAULT_SETTINGS);
  });

  it('loads defaults from corrupt storage', async () => {
    const { area } = createFakeArea({ [SETTINGS_STORAGE_KEY]: { scheme: 'bogus' } });
    await expect(createSettingsStore(area).load()).resolves.toEqual(DEFAULT_SETTINGS);
  });

  it('falls back to defaults when the storage backend throws', async () => {
    const area: StorageAreaLike = {
      get: () => Promise.reject(new Error('boom')),
      set: () => Promise.resolve(),
    };
    await expect(createSettingsStore(area).load()).resolves.toEqual(DEFAULT_SETTINGS);
  });

  it('round-trips save and load', async () => {
    const fake = createFakeArea();
    const store = createSettingsStore(fake.area);
    const custom = { ...DEFAULT_SETTINGS, scheme: 'theater' as const, enabled: false };
    await store.save(custom);
    await expect(store.load()).resolves.toEqual(custom);
  });

  it('update merges a patch immutably and persists it', async () => {
    const fake = createFakeArea();
    const store = createSettingsStore(fake.area);
    const before = await store.load();

    const next = await store.update({ contrast: 'normal' });

    expect(next.contrast).toBe('normal');
    expect(next).not.toBe(before);
    expect(before.contrast).toBe('strong'); // original untouched
    await expect(store.load()).resolves.toEqual(next);
  });

  it('surfaces save failures as descriptive errors', async () => {
    const area: StorageAreaLike = {
      get: () => Promise.resolve({}),
      set: () => Promise.reject(new Error('quota')),
    };
    await expect(createSettingsStore(area).save(DEFAULT_SETTINGS)).rejects.toThrow(
      'AdsDim could not persist settings',
    );
  });
});
