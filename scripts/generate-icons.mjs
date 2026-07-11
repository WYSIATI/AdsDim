#!/usr/bin/env node
/* eslint-disable no-console */
/* globals console, process */

/**
 * Generates the AdsDim extension icon set (public/icon/{size}.png).
 *
 * "Dimmed Feed" concept: a deep-purple -> blue gradient rounded square
 * carrying three horizontal rounded bars (timeline posts). The middle bar
 * is bright glassy white (the real post in focus); the top and bottom bars
 * are dimmed dark (ads), and the top bar carries a small darker chip at its
 * right end (the AD tag). The 16px output uses a simplified variant (three
 * thicker bars, no chip) so it stays legible at favicon scale. Rendered
 * from SVG so the set is fully reproducible: `node scripts/generate-icons.mjs`.
 */

import { Buffer } from 'node:buffer';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/icon');
const SIZES = [16, 32, 48, 96, 128];

/** Shared SVG header: rounded-square deep-purple -> blue gradient background. */
const SVG_BACKGROUND = `  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5B3FD4"/>
      <stop offset="1" stop-color="#2D7FF9"/>
    </linearGradient>
  </defs>
  <!-- Rounded-square gradient background -->
  <rect width="128" height="128" rx="28" fill="url(#bg)"/>`;

/**
 * Full "Dimmed Feed" artwork (32px and up): three timeline bars where the
 * dimmed top bar carries the small AD-tag chip at its right end.
 */
function buildFullIconSvg(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
${SVG_BACKGROUND}
  <!-- Dimmed ad post (top) with AD-tag chip at its right end -->
  <rect x="24" y="26" width="80" height="18" rx="9" fill="#0E0B1E" fill-opacity="0.35"/>
  <rect x="82" y="31" width="16" height="8" rx="3" fill="#0E0B1E" fill-opacity="0.60"/>
  <!-- Real post in focus (middle): bright glassy white -->
  <rect x="24" y="55" width="80" height="18" rx="9" fill="#FFFFFF" fill-opacity="0.85"
        stroke="#FFFFFF" stroke-opacity="0.95" stroke-width="2"/>
  <!-- Dimmed ad post (bottom) -->
  <rect x="24" y="84" width="80" height="18" rx="9" fill="#0E0B1E" fill-opacity="0.35"/>
</svg>`;
}

/**
 * Simplified 16px variant: three thicker bars and no chip so the motif
 * stays legible at favicon scale.
 */
function buildSmallIconSvg(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
${SVG_BACKGROUND}
  <!-- Dimmed ad post (top) -->
  <rect x="22" y="20" width="84" height="24" rx="12" fill="#0E0B1E" fill-opacity="0.35"/>
  <!-- Real post in focus (middle): bright glassy white -->
  <rect x="22" y="52" width="84" height="24" rx="12" fill="#FFFFFF" fill-opacity="0.85"
        stroke="#FFFFFF" stroke-opacity="0.95" stroke-width="3"/>
  <!-- Dimmed ad post (bottom) -->
  <rect x="22" y="84" width="84" height="24" rx="12" fill="#0E0B1E" fill-opacity="0.35"/>
</svg>`;
}

/**
 * Builds the icon SVG at a given pixel size. The artwork is authored on a
 * 128x128 grid and scaled by the SVG width/height attributes. Sizes of
 * 16px and below get the simplified variant.
 */
function buildIconSvg(size) {
  return size <= 16 ? buildSmallIconSvg(size) : buildFullIconSvg(size);
}

/** Renders one size and verifies the output dimensions. */
async function renderIcon(size) {
  const outPath = resolve(OUT_DIR, `${size}.png`);
  await sharp(Buffer.from(buildIconSvg(size)), { density: 300 })
    .resize(size, size)
    .png()
    .toFile(outPath);

  const meta = await sharp(outPath).metadata();
  if (meta.width !== size || meta.height !== size) {
    throw new Error(`Icon ${outPath} rendered as ${meta.width}x${meta.height}, expected ${size}`);
  }
  return outPath;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const paths = await Promise.all(SIZES.map(renderIcon));
  for (const path of paths) {
    console.log(`generated ${path}`);
  }
}

main().catch((error) => {
  console.error('Icon generation failed:', error);
  process.exitCode = 1;
});
