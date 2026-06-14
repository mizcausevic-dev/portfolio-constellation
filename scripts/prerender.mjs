#!/usr/bin/env node
/**
 * Postbuild prerender: render the existing React tree to a string and inject it
 * into the empty <div id="root"> of dist/index.html, so every repo card and the
 * JSON-LD ship in the static source for crawlers. The client hydrates on load.
 *
 * Reuses react-dom/server (already a dependency) + the SSR bundle Vite emits to
 * dist/.ssr. No new runtime dependencies, no framework swap. utf-8 throughout.
 */
import { readFileSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");
const HTML = join(DIST, "index.html");
const SSR_DIR = join(DIST, ".ssr");

// Find the SSR entry Vite emitted. Vite nests it under assets/ with a content
// hash, so walk the tree rather than assuming dist/.ssr/entry-server.js.
function findJs(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...findJs(p));
    else if (e.name.endsWith(".js")) out.push(p);
  }
  return out;
}
const jsFiles = findJs(SSR_DIR);
const entryPath = jsFiles.find((f) => /entry-server/.test(f)) ?? jsFiles[0];
if (!entryPath) {
  console.error("prerender: no SSR bundle (.js) found under dist/.ssr");
  process.exit(1);
}

const { render } = await import(pathToFileURL(entryPath).href);
const appHtml = render();

let html = readFileSync(HTML, "utf8");
const MOUNT = '<div id="root"></div>';
if (!html.includes(MOUNT)) {
  console.error('prerender: empty <div id="root"></div> not found in dist/index.html');
  process.exit(1);
}
html = html.replace(MOUNT, '<div id="root">' + appHtml + "</div>");
writeFileSync(HTML, html, { encoding: "utf8" });

// Clean up the throwaway SSR bundle so it never ships.
rmSync(SSR_DIR, { recursive: true, force: true });

const cards = (html.match(/data-repo-card=/g) || []).length;
console.error(`prerender: injected ${appHtml.length} bytes, ${cards} cards into dist/index.html`);
