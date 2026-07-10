#!/usr/bin/env node
/* eslint-disable no-console */
/* globals URL, console, process */

import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE_PATH = resolve(ROOT, 'tests/fixtures/timeline.html');

/**
 * Debounce (ms) for the fixture's X-like scroll-end refocus.
 * Source of truth: e2e/helpers/fixture-server.ts FIXTURE_SCROLL_REFOCUS_MS
 */
const FIXTURE_SCROLL_REFOCUS_MS = 120;

/**
 * Mimics X's dirty timeline behaviors so sticky-state bugs reproduce.
 * Inlined from e2e/helpers/fixture-server.ts for standalone .mjs execution.
 * Source of truth: e2e/helpers/fixture-server.ts X_BEHAVIOR_SCRIPT
 *
 * Changes:
 * - Debounce value substituted inline
 * - No template literals (kept as original for parity)
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
 * Renders the timeline page with X-like styling.
 * Inlined from e2e/helpers/fixture-server.ts renderTimelinePage()
 * Source of truth: e2e/helpers/fixture-server.ts
 */
function renderTimelinePage(theme) {
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
    <title>AdsDim playground (${theme})</title>
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
    <script>${X_BEHAVIOR_SCRIPT}</script>
  </body>
</html>`;
}

/**
 * Start the playground server.
 * Inlined from e2e/helpers/fixture-server.ts startFixtureServer()
 * Source of truth: e2e/helpers/fixture-server.ts
 */
async function startPlayground() {
  const PORT = 4873;

  const server = createServer((req, res) => {
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

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ port, server });
    });
  });
}

async function main() {
  try {
    const { port, server } = await startPlayground();
    const darkUrl = `http://127.0.0.1:${port}/timeline.html`;
    const lightUrl = `http://127.0.0.1:${port}/timeline.html?theme=light`;

    console.log('\n🎪 AdsDim Playground started\n');
    console.log(`Dark theme:  ${darkUrl}`);
    console.log(`Light theme: ${lightUrl}\n`);
    console.log('Setup instructions:');
    console.log('  1. npm run build:e2e');
    console.log('  2. Open chrome://extensions (Developer mode on)');
    console.log('  3. Load unpacked: .output/chrome-mv3');
    console.log('  4. Open one of the URLs above in your browser\n');
    console.log('Press Ctrl+C to stop.\n');

    process.on('SIGINT', () => {
      console.log('\nShutting down...');
      server.close(() => {
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start playground:', error);
    process.exit(1);
  }
}

main();
