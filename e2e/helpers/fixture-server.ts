import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE_PATH = resolve(ROOT, 'tests/fixtures/timeline.html');

export interface FixtureServer {
  /** e.g. `http://127.0.0.1:49152` */
  readonly baseUrl: string;
  close(): Promise<void>;
}

/**
 * Wraps the shared timeline fragment (also used by the vitest integration
 * suite) in a minimal X-like page. `?theme=light` serves a white background
 * so the content script's luminance-based theme detection picks `light`;
 * the default is lights-out black (`dark`).
 *
 * System fonts only: no webfont loading can shift layout between the
 * pre-mark and post-mark measurements in the layout-shift spec.
 */
function renderTimelinePage(theme: 'dark' | 'light'): string {
  const fragment = readFileSync(FIXTURE_PATH, 'utf8');
  const palette =
    theme === 'light'
      ? 'body { background: #ffffff; color: #0f1419; } article { border-bottom: 1px solid #eff3f4; }'
      : 'body { background: #000000; color: #e7e9ea; } article { border-bottom: 1px solid #2f3336; }';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>AdsDim E2E timeline (${theme})</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: 15px;
        line-height: 20px;
      }
      main { max-width: 600px; margin: 0 auto; }
      article { display: block; padding: 12px 16px; }
      article a { color: #1d9bf0; text-decoration: none; }
      [data-testid='User-Name'] { margin-bottom: 4px; }
      [data-testid='User-Name'] span:first-child { font-weight: 700; }
      ${palette}
    </style>
  </head>
  <body>
    <main>${fragment}</main>
  </body>
</html>`;
}

/** Starts a throwaway static server on an ephemeral localhost port. */
export function startFixtureServer(): Promise<FixtureServer> {
  const server: Server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname !== '/timeline.html') {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not found');
      return;
    }
    const theme = url.searchParams.get('theme') === 'light' ? 'light' : 'dark';
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(renderTimelinePage(theme));
  });

  return new Promise((resolvePromise, rejectPromise) => {
    server.once('error', rejectPromise);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      resolvePromise({
        baseUrl: `http://127.0.0.1:${port}`,
        close: () =>
          new Promise<void>((done, fail) =>
            server.close((error) => (error ? fail(error) : done())),
          ),
      });
    });
  });
}
