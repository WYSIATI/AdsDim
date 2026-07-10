import { defineConfig } from 'wxt';

/**
 * E2E-only escape hatch: `ADSDIM_E2E=1 wxt build` additionally matches the
 * Playwright fixture server on localhost. A normal `wxt build` (any value
 * other than exactly '1') ships x.com/twitter.com matches only — asserted
 * by e2e/tests/manifest.spec.ts.
 */
const E2E_EXTRA_MATCHES =
  process.env.ADSDIM_E2E === '1' ? ['http://localhost/*', 'http://127.0.0.1/*'] : [];

/**
 * AdsDim — marks ads on the x.com timeline, never hides posts.
 * See https://wxt.dev/api/config.html
 */
export default defineConfig({
  // Explicit imports only; keeps the code greppable and unit-testable.
  imports: false,
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'AdsDim',
    description:
      'Dim the ads, let real posts shine. Marks ads on the x.com timeline without ever hiding posts. 标记广告，从不隐藏帖子。',
    permissions: ['storage'],
  },
  hooks: {
    'build:manifestGenerated': (_wxt, manifest) => {
      if (E2E_EXTRA_MATCHES.length === 0) return;
      for (const script of manifest.content_scripts ?? []) {
        // WXT hands hooks the generated manifest for in-place amendment.
        script.matches = [...(script.matches ?? []), ...E2E_EXTRA_MATCHES];
      }
    },
  },
});
