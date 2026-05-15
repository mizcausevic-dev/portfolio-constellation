#!/usr/bin/env node
/**
 * Refresh the portfolio snapshot.
 *
 * Pages through `gh api users/<username>/repos`, normalises each repo into the
 * compact shape the dashboard renders, and writes `src/data/repos.json`.
 *
 * This script is invoked manually (`npm run refresh`) and from a scheduled
 * GitHub Action (every 6 hours) so new repos that Codex / Claude / you push
 * surface on the dashboard without anyone editing data files by hand.
 */

import { execSync } from "node:child_process";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const OUT_DIR = join(REPO_ROOT, "src", "data");
const OUT_FILE = join(OUT_DIR, "repos.json");
const USER = process.env.GH_USER ?? "mizcausevic-dev";

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

console.error(`refreshing snapshot for ${USER}…`);

// Use `gh api --paginate` so we get all pages in one buffer.
const raw = execSync(
  `gh api "users/${USER}/repos?type=public&per_page=100&sort=updated" --paginate`,
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
);

const repos = JSON.parse(raw);
if (!Array.isArray(repos)) {
  console.error("expected array, got", typeof repos);
  process.exit(1);
}

// Compact projection. We drop ~90% of GitHub's bloat (URLs, permissions,
// owner sub-object, etc.) so the bundled snapshot stays trim.
const compact = repos
  .filter((r) => !r.private)
  .map((r) => ({
    name: r.name,
    description: r.description ?? "",
    url: r.html_url,
    language: r.language ?? null,
    topics: Array.isArray(r.topics) ? r.topics : [],
    pushed_at: r.pushed_at,
    updated_at: r.updated_at,
    created_at: r.created_at,
    stars: r.stargazers_count ?? 0,
    forks: r.forks_count ?? 0,
    archived: r.archived === true,
    fork: r.fork === true,
    homepage: r.homepage ?? null,
    license: r.license?.spdx_id ?? null,
  }))
  // Sort by most recently pushed first — the dashboard re-sorts anyway, but
  // the snapshot reads better in diffs.
  .sort((a, b) => (a.pushed_at < b.pushed_at ? 1 : -1));

const snapshot = {
  user: USER,
  generated_at: new Date().toISOString(),
  total: compact.length,
  repos: compact,
};

writeFileSync(OUT_FILE, JSON.stringify(snapshot, null, 2) + "\n", "utf8");

// Diff-friendly summary.
let prevTotal = 0;
try {
  if (existsSync(OUT_FILE)) {
    const prev = JSON.parse(readFileSync(OUT_FILE, "utf8"));
    prevTotal = prev.total ?? 0;
  }
} catch {
  /* fresh file */
}

console.error(`✓ wrote ${OUT_FILE}`);
console.error(`  total repos: ${snapshot.total}${prevTotal && prevTotal !== snapshot.total ? ` (was ${prevTotal})` : ""}`);

const langs = new Map();
for (const r of compact) {
  if (!r.language) continue;
  langs.set(r.language, (langs.get(r.language) ?? 0) + 1);
}
const ordered = [...langs.entries()].sort((a, b) => b[1] - a[1]);
console.error(`  languages: ${ordered.length} — ${ordered.slice(0, 5).map(([l, n]) => `${l}(${n})`).join(", ")}…`);
