import { useCallback, useEffect, useMemo, useState } from 'react';
import { syncStorageArea } from '../../src/storage/browser-area';
import type { Settings } from '../../src/storage/schema';
import { createSettingsStore } from '../../src/storage/settings-store';
import { logger } from '../../src/utils/logger';

export interface UseSettingsResult {
  readonly settings: Settings | null;
  readonly update: (patch: Partial<Settings>) => void;
}

/** Loads settings on mount and persists patches optimistically. */
export function useSettings(): UseSettingsResult {
  const store = useMemo(() => createSettingsStore(syncStorageArea), []);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    let cancelled = false;
    store
      .load()
      .then((loaded) => {
        if (!cancelled) setSettings(loaded);
      })
      .catch((error) => logger.error('Popup failed to load settings', error));
    return () => {
      cancelled = true;
    };
  }, [store]);

  const update = useCallback(
    (patch: Partial<Settings>): void => {
      setSettings((previous) => (previous === null ? previous : { ...previous, ...patch }));
      store.update(patch).catch((error) => logger.error('Failed to save settings', error));
    },
    [store],
  );

  return { settings, update };
}
