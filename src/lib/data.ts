/**
 * Data ingestion entry point.
 *
 * The dashboard renders from the static `src/data/repos.json` snapshot baked
 * into the build at compile time (Vite's `import` of JSON inlines it). A
 * scheduled GitHub Action refreshes that snapshot every six hours so new
 * Codex / Claude pushes appear without manual intervention.
 *
 * Optionally — at runtime — we can re-fetch the live GitHub API to surface
 * even fresher data than the snapshot. We do this lazily after first render
 * so the page paints instantly from the baked snapshot, then upgrades.
 */
import snapshot from "../data/repos.json";
import type { Repo, Snapshot } from "./types";

const TYPED_SNAPSHOT = snapshot as unknown as Snapshot;
const CACHE_KEY = "portfolio-constellation:cache:v1";
const CACHE_TTL_MS = 6 * 3600 * 1000; // 6 hours

export function bakedSnapshot(): Snapshot {
  return TYPED_SNAPSHOT;
}

interface CachedShape {
  saved_at: number;
  snapshot: Snapshot;
}

/**
 * Attempt to fetch a fresher repo list from the GitHub API. On any failure
 * (rate limit, offline, parse error) returns `null` so the caller can keep
 * showing the baked snapshot.
 */
export async function fetchLiveSnapshot(
  user: string = TYPED_SNAPSHOT.user,
): Promise<Snapshot | null> {
  // Honour a recent cached fetch so we don't beat on the API across renders.
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw) as CachedShape;
      if (cached.snapshot.user === user && Date.now() - cached.saved_at < CACHE_TTL_MS) {
        return cached.snapshot;
      }
    }
  } catch {
    /* localStorage may be unavailable / quota exceeded */
  }

  const repos: Repo[] = [];
  for (let page = 1; page <= 5; page++) {
    const url = `https://api.github.com/users/${encodeURIComponent(user)}/repos?type=public&per_page=100&sort=updated&page=${page}`;
    try {
      const resp = await fetch(url, { headers: { accept: "application/vnd.github+json" } });
      if (!resp.ok) return null;
      const body = (await resp.json()) as Array<Record<string, unknown>>;
      if (!Array.isArray(body) || body.length === 0) break;
      for (const r of body) {
        if (r.private === true) continue;
        repos.push({
          name: String(r.name ?? ""),
          description: String(r.description ?? "") || "",
          url: String(r.html_url ?? ""),
          language: (r.language as string | null) ?? null,
          topics: Array.isArray(r.topics) ? (r.topics as string[]) : [],
          pushed_at: String(r.pushed_at ?? ""),
          updated_at: String(r.updated_at ?? ""),
          created_at: String(r.created_at ?? ""),
          stars: Number(r.stargazers_count ?? 0),
          forks: Number(r.forks_count ?? 0),
          archived: r.archived === true,
          fork: r.fork === true,
          homepage: (r.homepage as string | null) ?? null,
          license:
            r.license && typeof r.license === "object"
              ? ((r.license as Record<string, unknown>).spdx_id as string | null) ?? null
              : null,
        });
      }
      if (body.length < 100) break;
    } catch {
      return null;
    }
  }
  if (repos.length === 0) return null;

  repos.sort((a, b) => (a.pushed_at < b.pushed_at ? 1 : -1));
  const fresh: Snapshot = {
    user,
    generated_at: new Date().toISOString(),
    total: repos.length,
    repos,
  };

  try {
    const cache: CachedShape = { saved_at: Date.now(), snapshot: fresh };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* swallow */
  }

  return fresh;
}
