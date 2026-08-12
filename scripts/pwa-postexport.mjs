#!/usr/bin/env node
// Post-processes the Expo web export (`dist/`) into an installable PWA.
//
// The classic (non-expo-router) Metro web export generates a bare index.html
// with no PWA manifest link or iOS "add to home screen" meta tags, and does not
// always copy `public/`. This script is idempotent: run it after
// `expo export -p web` and before `eas deploy`.
//
//   npx expo export -p web && node scripts/pwa-postexport.mjs
//
// It (1) copies the manifest + icons from public/ into dist/, and (2) injects
// the PWA/iOS head tags into dist/index.html.

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const publicDir = path.join(root, "public");
const indexHtml = path.join(distDir, "index.html");

const ASSETS = [
  "manifest.webmanifest",
  "pwa-192.png",
  "pwa-512.png",
  "apple-touch-icon.png",
];

// Tags injected into <head>. Marked with a sentinel so re-runs don't duplicate.
const SENTINEL = "<!-- pwa-postexport -->";
const HEAD_TAGS = `${SENTINEL}
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="theme-color" content="#2F80ED" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="ByggExp" />
    <style>
      /* PWA safety net: native RN screens are sized in device px; on a narrow
         mobile browser a fixed-width element can push content past the viewport
         edge ("off screen"). Clamp width + hide horizontal overflow so nothing
         drifts sideways. Vertical scrolling inside ScrollViews is unaffected. */
      html, body { overflow-x: hidden !important; max-width: 100%; }
      #root { max-width: 100vw; overflow-x: hidden; }
    </style>`;

// The viewport meta Expo generates lacks viewport-fit=cover, so on mobile the
// app is inset below the status bar and the page background shows as a strip
// above each screen. Replace it (don't add a second — two viewport metas made
// the layout drift sideways) so screens bleed edge-to-edge under the status bar.
const VIEWPORT_META =
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />';

async function main() {
  try {
    await fs.access(indexHtml);
  } catch {
    console.error(
      "[pwa-postexport] dist/index.html not found. Run `npx expo export -p web` first.",
    );
    process.exit(1);
  }

  // 1. Copy PWA assets into dist/.
  for (const asset of ASSETS) {
    await fs.copyFile(
      path.join(publicDir, asset),
      path.join(distDir, asset),
    );
  }

  // 2. Rewrite the viewport meta for viewport-fit=cover + inject head tags.
  let html = await fs.readFile(indexHtml, "utf8");
  let changed = false;

  if (!html.includes("viewport-fit=cover")) {
    html = html.replace(/<meta\s+name="viewport"[^>]*>/i, VIEWPORT_META);
    changed = true;
  }

  if (!html.includes(SENTINEL)) {
    html = html.replace(/<\/head>/i, `    ${HEAD_TAGS}\n  </head>`);
    changed = true;
  }

  if (changed) {
    await fs.writeFile(indexHtml, html, "utf8");
  }

  console.log(`[pwa-postexport] Patched ${ASSETS.length} assets + index.html.`);
}

main();
