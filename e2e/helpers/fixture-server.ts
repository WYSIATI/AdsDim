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
 * Debounce (ms) for the fixture's X-like scroll-end refocus. Exported so
 * specs can wait just past it instead of hardcoding magic numbers.
 */
export const FIXTURE_SCROLL_REFOCUS_MS = 120;

/**
 * Delay (ms) between a hover event and the simulated React re-render commit
 * (X's commits are async: hover state renders on the next React flush).
 */
export const FIXTURE_WIPE_DELAY_MS = 50;

/**
 * How the fixture simulates X's React re-render wiping AdsDim's injected
 * state off the tweet `<article>` (whose className/attributes React owns):
 * - `none`  — no wipe (default; specs that predate the wipe realism).
 * - `class` — rewrite `article.className` wholesale from the VDOM, silently
 *   dropping every class React does not know about (React DOES do this).
 * - `attrs` — the `class` wipe PLUS removal of all `data-adsdim-*`
 *   attributes (worst case: a hostile or key-remounting re-render).
 */
export type WipeMode = 'none' | 'class' | 'attrs';

/**
 * Mimics X's dirty timeline behaviors so sticky-state bugs reproduce:
 *
 * - Virtualization: every article is wrapped in a `cellInnerDiv` cell that is
 *   absolutely positioned via `transform: translateY(...)`, like X's
 *   react-virtualized timeline. Runs synchronously before DOMContentLoaded so
 *   layout snapshots taken at DCL already see the virtualized geometry.
 * - Focus management: cells carry `tabindex="-1"` and articles `tabindex="0"`
 *   (as on x.com). Clicking anywhere inside a cell programmatically focuses
 *   the cell; after scrolling stops, the tweet article nearest the viewport
 *   top is programmatically focused (X's j/k keyboard-nav anchor does the
 *   same). Chrome applies `:focus-visible` to such programmatic focus
 *   whenever the session had no mousedown yet or the last input was a key.
 *
 * No template literals inside: this string is embedded in one.
 */
const X_BEHAVIOR_SCRIPT = `
(function () {
  var REFOCUS_IDLE_MS = ${FIXTURE_SCROLL_REFOCUS_MS};
  var timeline = document.querySelector('[data-fixture="timeline"]');
  if (!timeline) return;

  var articles = Array.prototype.slice.call(timeline.querySelectorAll('article'));
  var cells = articles.map(function (article) {
    var cell = document.createElement('div');
    cell.setAttribute('data-testid', 'cellInnerDiv');
    cell.setAttribute('tabindex', '-1');
    article.parentNode.insertBefore(cell, article);
    cell.appendChild(article);
    article.setAttribute('tabindex', '0');
    return cell;
  });

  // Read phase: measure while the cells are still in normal flow.
  var timelineTop = timeline.getBoundingClientRect().top;
  var offsets = cells.map(function (cell) {
    return cell.getBoundingClientRect().top - timelineTop;
  });
  var totalHeight = timeline.getBoundingClientRect().height;

  // Write phase: switch to X-style transform positioning.
  timeline.style.position = 'relative';
  timeline.style.height = totalHeight + 'px';
  cells.forEach(function (cell, index) {
    cell.style.position = 'absolute';
    cell.style.top = '0';
    cell.style.left = '0';
    cell.style.width = '100%';
    cell.style.transform = 'translateY(' + offsets[index] + 'px)';
  });

  // X focuses the clicked cell (it owns the keyboard-nav cursor).
  document.addEventListener('click', function (event) {
    var target = event.target;
    var cell = target && target.closest ? target.closest('[data-testid="cellInnerDiv"]') : null;
    if (cell) cell.focus({ preventScroll: true });
  });

  // After scrolling settles, X re-anchors keyboard nav on the tweet nearest
  // the viewport top. The focus target is the article (X's tweets are the
  // tabindex="0" focusable units announced to screen readers).
  var refocusTimer;
  window.addEventListener(
    'scroll',
    function () {
      clearTimeout(refocusTimer);
      refocusTimer = setTimeout(function () {
        var best = null;
        var bestDistance = Infinity;
        var current = Array.prototype.slice.call(timeline.querySelectorAll('article'));
        current.forEach(function (article) {
          var rect = article.getBoundingClientRect();
          if (rect.bottom <= 0) return;
          var distance = Math.abs(rect.top);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = article;
          }
        });
        if (best) best.focus({ preventScroll: true });
      }, REFOCUS_IDLE_MS);
    },
    { passive: true },
  );
})();
`;

/**
 * Simulated React re-render commit, FIXTURE_WIPE_DELAY_MS after every
 * article mouseenter/mouseleave — X's hover-triggered re-renders commit
 * asynchronously and rewrite the article's className wholesale from the VDOM,
 * erasing any class a content script sneaked in. No childList mutation fires.
 * In `attrs` mode the commit also strips all `data-adsdim-*` attributes.
 *
 * No template literals inside: this string is embedded in one.
 */
function renderWipeScript(mode: WipeMode): string {
  if (mode === 'none') return '';
  return `
(function () {
  var WIPE_DELAY_MS = ${FIXTURE_WIPE_DELAY_MS};
  var stripDataAttributes = ${mode === 'attrs' ? 'true' : 'false'};

  var commit = function (article) {
    // React rewrites className from its own props: unknown classes vanish.
    article.className = article.className
      .split(' ')
      .filter(function (name) {
        return name.indexOf('adsdim') !== 0;
      })
      .join(' ');
    if (stripDataAttributes) {
      Array.prototype.slice.call(article.attributes).forEach(function (attribute) {
        if (attribute.name.indexOf('data-adsdim-') === 0) {
          article.removeAttribute(attribute.name);
        }
      });
    }
  };

  var scheduleCommit = function (event) {
    var article = event.currentTarget;
    setTimeout(function () {
      commit(article);
    }, WIPE_DELAY_MS);
  };

  Array.prototype.slice.call(document.querySelectorAll('article')).forEach(function (article) {
    article.addEventListener('mouseenter', scheduleCommit);
    article.addEventListener('mouseleave', scheduleCommit);
  });
})();
`;
}

/**
 * Wraps the shared timeline fragment (also used by the vitest integration
 * suite) in an X-like page. `?theme=light` serves a white background so the
 * content script's luminance-based theme detection picks `light`; the
 * default is lights-out black (`dark`).
 *
 * Dirty-realism notes:
 * - Articles carry a subtle stripe pattern (stand-in for media/avatars that
 *   sit behind the glass overlay on x.com) so backdrop blur is measurable in
 *   pixels, not just in computed style.
 * - Cells get X's hover background; articles suppress the focus outline the
 *   way x.com does.
 *
 * System fonts only: no webfont loading can shift layout between the
 * pre-mark and post-mark measurements in the layout-shift spec.
 */
function renderTimelinePage(theme: 'dark' | 'light', wipe: WipeMode): string {
  const fragment = readFileSync(FIXTURE_PATH, 'utf8');
  const palette =
    theme === 'light'
      ? `body { background: #ffffff; color: #0f1419; }
      article { border-bottom: 1px solid #eff3f4; }
      article { background-image: repeating-linear-gradient(0deg, transparent 0 6px, rgba(15, 20, 25, 0.10) 6px 8px); }
      [data-testid='cellInnerDiv']:hover { background-color: rgba(15, 20, 25, 0.03); }`
      : `body { background: #000000; color: #e7e9ea; }
      article { border-bottom: 1px solid #2f3336; }
      article { background-image: repeating-linear-gradient(0deg, transparent 0 6px, rgba(255, 255, 255, 0.10) 6px 8px); }
      [data-testid='cellInnerDiv']:hover { background-color: rgba(255, 255, 255, 0.03); }`;

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
      /* x.com suppresses focus outlines on tweets and cells. */
      article, [data-testid='cellInnerDiv'] { outline: none; }
      [data-testid='User-Name'] { margin-bottom: 4px; }
      [data-testid='User-Name'] span:first-child { font-weight: 700; }
      ${palette}
    </style>
  </head>
  <body>
    <main>${fragment}</main>
    <script>${X_BEHAVIOR_SCRIPT}${renderWipeScript(wipe)}</script>
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
    const wipeParam = url.searchParams.get('wipe');
    const wipe: WipeMode = wipeParam === 'class' || wipeParam === 'attrs' ? wipeParam : 'none';
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(renderTimelinePage(theme, wipe));
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
