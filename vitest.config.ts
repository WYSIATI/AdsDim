import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'entrypoints/content/**/*.ts'],
      exclude: [
        // Type-only module, no runtime code.
        'src/types/**',
        // Thin wiring around extension APIs; exercised only inside a browser.
        'src/storage/browser-area.ts',
        // Content-script bootstrap; exercised only inside a browser.
        'entrypoints/content/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 75,
      },
    },
  },
});
