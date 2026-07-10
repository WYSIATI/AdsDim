import { defineConfig } from '@playwright/test';

/**
 * Playwright E2E config for AdsDim. Kept fully separate from vitest:
 * run with `npm run test:e2e` (or `npx playwright test -c e2e`).
 *
 * globalSetup builds the extension twice: a production build whose manifest
 * is stashed for the match-pattern regression spec, then an ADSDIM_E2E=1
 * build (adds localhost content-script matches) that the specs load.
 */
export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  outputDir: './.artifacts/test-results',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Each test launches its own persistent context; keep parallelism modest.
  workers: 2,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    trace: 'retain-on-failure',
  },
});
