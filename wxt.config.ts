import { defineConfig } from 'wxt';

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
});
