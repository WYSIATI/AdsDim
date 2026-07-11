#!/usr/bin/env node
/* eslint-disable no-console */
/* globals console, process */

/**
 * Generates the AdsDim extension icon set (public/icon/{size}.png).
 *
 * The icon echoes the Glass Focus scheme: a deep-purple -> blue gradient
 * rounded square, a dimmed card in the back (the ad) and a frosted-glass
 * card in front (the real post). Rendered from a single SVG so the set is
 * fully reproducible: `node scripts/generate-icons.mjs`.
 */

import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/icon');
const SIZES = [16, 32, 48, 96, 128];

/**
 * Builds the icon SVG at a given pixel size. The artwork is authored on a
 * 128x128 grid and scaled by the SVG width/height attributes.
 */
function buildIconSvg(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4C1D95"/>
      <stop offset="1" stop-color="#2563EB"/>
    </linearGradient>
  </defs>
  <!-- Rounded-square gradient background -->
  <rect width="128" height="128" rx="28" fill="url(#bg)"/>
  <!-- Dimmed ad card behind (upper right, muted) -->
  <rect x="48" y="24" width="58" height="44" rx="10" fill="#FFFFFF" fill-opacity="0.14"/>
  <!-- Frosted-glass focus card in front (lower left) -->
  <rect x="22" y="52" width="72" height="52" rx="12" fill="#FFFFFF" fill-opacity="0.36"
        stroke="#FFFFFF" stroke-opacity="0.70" stroke-width="3"/>
  <!-- Text lines on the focus card -->
  <rect x="34" y="66" width="46" height="7" rx="3.5" fill="#FFFFFF" fill-opacity="0.85"/>
  <rect x="34" y="81" width="30" height="7" rx="3.5" fill="#FFFFFF" fill-opacity="0.55"/>
</svg>`;
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
