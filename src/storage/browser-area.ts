import { browser } from 'wxt/browser';
import type { Settings } from './schema';
import { parseSettings, SETTINGS_STORAGE_KEY } from './schema';
import type { StorageAreaLike } from './settings-store';

/** `browser.storage.sync` adapted to the injectable StorageAreaLike shape. */
export const syncStorageArea: StorageAreaLike = {
  get: (key) => browser.storage.sync.get(key),
  set: (items) => browser.storage.sync.set(items),
};

/** Invokes `callback` with validated settings whenever they change. */
export function watchSettings(callback: (settings: Settings) => void): void {
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync') return;
    const change = changes[SETTINGS_STORAGE_KEY];
    if (!change) return;
    callback(parseSettings(change.newValue));
  });
}
