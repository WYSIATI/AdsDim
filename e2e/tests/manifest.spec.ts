import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { BUILT_MANIFEST, PRODUCTION_MANIFEST_STASH } from '../global-setup';

interface ManifestShape {
  content_scripts?: { matches?: string[] }[];
  description?: string;
  icons?: Record<string, string>;
  permissions?: string[];
}

const readManifest = (path: string): ManifestShape =>
  JSON.parse(readFileSync(path, 'utf8')) as ManifestShape;

test.describe('manifest match patterns', () => {
  test('production build matches x.com/twitter.com only — never localhost', () => {
    const manifest = readManifest(PRODUCTION_MANIFEST_STASH);

    expect(manifest.content_scripts).toHaveLength(1);
    expect([...(manifest.content_scripts?.[0]?.matches ?? [])].sort()).toEqual([
      '*://mobile.twitter.com/*',
      '*://twitter.com/*',
      '*://x.com/*',
    ]);
  });

  test('production build is store-ready: icons, storage-only permissions, short description', () => {
    const manifest = readManifest(PRODUCTION_MANIFEST_STASH);

    expect(manifest.icons).toEqual({
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      96: 'icon/96.png',
      128: 'icon/128.png',
    });
    expect(manifest.permissions).toEqual(['storage']);
    // Chrome Web Store rejects manifest descriptions longer than 132 chars.
    expect((manifest.description ?? '').length).toBeLessThanOrEqual(132);
  });

  test('E2E build adds localhost matches on top of production ones', () => {
    const manifest = readManifest(BUILT_MANIFEST);
    const matches = manifest.content_scripts?.[0]?.matches ?? [];

    expect(matches).toEqual(
      expect.arrayContaining([
        '*://x.com/*',
        '*://twitter.com/*',
        'http://localhost/*',
        'http://127.0.0.1/*',
      ]),
    );
  });
});
