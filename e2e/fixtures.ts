import { chromium, test as base, type BrowserContext, type Worker } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Settings } from '../src/storage/schema';
import { startFixtureServer, type FixtureServer } from './helpers/fixture-server';

const EXTENSION_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../.output/chrome-mv3');
const SETTINGS_KEY = 'adsdim:settings';

/** Structural view of the MV3 storage API available in the service worker. */
interface ChromeStorageGlobal {
  chrome: {
    storage: { sync: { set(items: Record<string, unknown>): Promise<void> } };
  };
}

export interface ExtensionFixtures {
  context: BrowserContext;
  background: Worker;
  extensionId: string;
  /** Writes settings to chrome.storage.sync from the extension context. */
  setSettings(settings: Partial<Settings>): Promise<void>;
}

export interface ServerFixtures {
  server: FixtureServer;
  /** Timeline fixture URL; pass `light` for the white-background variant. */
  timelineUrl(theme?: 'dark' | 'light'): string;
}

export const test = base.extend<ExtensionFixtures, ServerFixtures>({
  server: [
    // eslint-disable-next-line no-empty-pattern -- Playwright fixture API requires the pattern
    async ({}, use) => {
      const server = await startFixtureServer();
      await use(server);
      await server.close();
    },
    { scope: 'worker' },
  ],

  timelineUrl: [
    async ({ server }, use) => {
      await use((theme = 'dark') => `${server.baseUrl}/timeline.html?theme=${theme}`);
    },
    { scope: 'worker' },
  ],

  // Each test gets a fresh persistent context (and thus fresh storage), so
  // settings written by one test can never leak into another.
  // eslint-disable-next-line no-empty-pattern -- Playwright fixture API requires the pattern
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
      viewport: { width: 1280, height: 2000 },
    });
    await use(context);
    await context.close();
  },

  background: async ({ context }, use) => {
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    await use(worker);
  },

  extensionId: async ({ background }, use) => {
    await use(new URL(background.url()).host);
  },

  setSettings: async ({ background }, use) => {
    await use(async (settings) => {
      await background.evaluate(
        ({ key, value }) =>
          (globalThis as unknown as ChromeStorageGlobal).chrome.storage.sync.set({
            [key]: value,
          }),
        { key: SETTINGS_KEY, value: settings },
      );
    });
  },
});

export const expect = test.expect;
