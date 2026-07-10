import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import { SETTINGS_STORAGE_KEY } from '../../src/storage/schema';
import { logger } from '../../src/utils/logger';

const SETTINGS_CHANGED_MESSAGE = 'adsdim:settings-changed';
const CLASSIFY_LLM_MESSAGE = 'adsdim:classify-llm';

interface RuntimeMessage {
  readonly type?: string;
}

export default defineBackground(() => {
  // Broadcast settings changes to open tabs. Content scripts also watch
  // storage directly; this message is a fast-path nudge.
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync' || !changes[SETTINGS_STORAGE_KEY]) return;
    void broadcastSettingsChanged();
  });

  // Phase 2 placeholder: optional LLM-assisted classification will be
  // routed through the background service worker. Phase 1 is 100% local
  // and performs zero network calls.
  browser.runtime.onMessage.addListener((message: RuntimeMessage) => {
    if (message?.type === CLASSIFY_LLM_MESSAGE) {
      return Promise.resolve({ supported: false, reason: 'phase-2-placeholder' });
    }
    return undefined;
  });
});

async function broadcastSettingsChanged(): Promise<void> {
  try {
    const tabs = await browser.tabs.query({});
    await Promise.all(
      tabs
        .filter((tab) => tab.id !== undefined)
        .map((tab) =>
          browser.tabs
            .sendMessage(tab.id as number, { type: SETTINGS_CHANGED_MESSAGE })
            .catch(() => undefined),
        ),
    );
  } catch (error) {
    logger.debug('Settings broadcast skipped', error);
  }
}
