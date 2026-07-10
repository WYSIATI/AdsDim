import type { Settings } from './schema';
import { DEFAULT_SETTINGS, parseSettings, SETTINGS_STORAGE_KEY } from './schema';
import { logger } from '../utils/logger';

/** Narrow view of a WebExtension StorageArea, injectable for tests. */
export interface StorageAreaLike {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

export interface SettingsStore {
  load(): Promise<Settings>;
  save(settings: Settings): Promise<void>;
  update(patch: Partial<Settings>): Promise<Settings>;
}

/**
 * Creates a settings store on top of any StorageArea-like backend.
 * All reads are validated through the Zod schema; writes never mutate input.
 */
export function createSettingsStore(area: StorageAreaLike): SettingsStore {
  const load = async (): Promise<Settings> => {
    try {
      const raw = await area.get(SETTINGS_STORAGE_KEY);
      return parseSettings(raw[SETTINGS_STORAGE_KEY]);
    } catch (error) {
      logger.error('Failed to load settings, using defaults', error);
      return DEFAULT_SETTINGS;
    }
  };

  const save = async (settings: Settings): Promise<void> => {
    try {
      await area.set({ [SETTINGS_STORAGE_KEY]: parseSettings(settings) });
    } catch (error) {
      logger.error('Failed to save settings', error);
      throw new Error('AdsDim could not persist settings');
    }
  };

  const update = async (patch: Partial<Settings>): Promise<Settings> => {
    const current = await load();
    const next = parseSettings({ ...current, ...patch });
    await save(next);
    return next;
  };

  return { load, save, update };
}
