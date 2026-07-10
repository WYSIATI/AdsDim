import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const BUILT_MANIFEST = resolve(ROOT, '.output/chrome-mv3/manifest.json');
export const PRODUCTION_MANIFEST_STASH = resolve(ROOT, 'e2e/.artifacts/manifest.production.json');

function build(env: NodeJS.ProcessEnv): void {
  execFileSync('npx', ['wxt', 'build'], { cwd: ROOT, env, stdio: 'inherit' });
}

/**
 * 1. Production build (no ADSDIM_E2E): stash its manifest so a spec can
 *    assert the shipped match patterns never include localhost.
 * 2. E2E build (ADSDIM_E2E=1): the extension the browser tests load.
 */
export default function globalSetup(): void {
  const { ADSDIM_E2E: _ignored, ...cleanEnv } = process.env;

  build(cleanEnv);
  mkdirSync(dirname(PRODUCTION_MANIFEST_STASH), { recursive: true });
  copyFileSync(BUILT_MANIFEST, PRODUCTION_MANIFEST_STASH);

  build({ ...cleanEnv, ADSDIM_E2E: '1' });
}
