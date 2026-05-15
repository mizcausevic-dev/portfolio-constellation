/**
 * Pure aggregation helpers used by the visualisations. Kept independent of
 * React so they're trivial to unit-test.
 */
import { clustersFor, freshness, verticalsFor } from "./classifier";
import { CLUSTERS, type Cluster, type Repo, type Vertical, VERTICALS } from "./types";

export interface LanguageStat {
  language: string;
  count: number;
}

export function languageStats(repos: readonly Repo[]): LanguageStat[] {
  const counts = new Map<string, number>();
  for (const r of repos) {
    if (!r.language) continue;
    counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count);
}

export interface ClusterStat {
  id: Cluster;
  label: string;
  blurb: string;
  accent: string;
  repos: Repo[];
}

export function clusterStats(repos: readonly Repo[]): ClusterStat[] {
  const buckets = new Map<Cluster, Repo[]>();
  for (const r of repos) {
    for (const c of clustersFor(r)) {
      if (!buckets.has(c)) buckets.set(c, []);
      buckets.get(c)!.push(r);
    }
  }
  // Stable order: present clusters in the order they're declared in CLUSTERS.
  const out: ClusterStat[] = [];
  for (const id of Object.keys(CLUSTERS) as Cluster[]) {
    const repos = buckets.get(id);
    if (!repos || repos.length === 0) continue;
    const meta = CLUSTERS[id];
    out.push({
      id,
      label: meta.label,
      blurb: meta.blurb,
      accent: meta.accent,
      repos: [...repos].sort((a, b) => (a.pushed_at < b.pushed_at ? 1 : -1)),
    });
  }
  return out;
}

export interface VerticalStat {
  id: Vertical;
  label: string;
  count: number;
  repos: Repo[];
}

export function verticalStats(repos: readonly Repo[]): VerticalStat[] {
  const buckets = new Map<Vertical, Repo[]>();
  for (const r of repos) {
    for (const v of verticalsFor(r)) {
      if (!buckets.has(v)) buckets.set(v, []);
      buckets.get(v)!.push(r);
    }
  }
  const out: VerticalStat[] = [];
  for (const id of Object.keys(VERTICALS) as Vertical[]) {
    const repos = buckets.get(id);
    if (!repos || repos.length === 0) continue;
    out.push({
      id,
      label: VERTICALS[id].label,
      count: repos.length,
      repos: [...repos].sort((a, b) => (a.pushed_at < b.pushed_at ? 1 : -1)),
    });
  }
  out.sort((a, b) => b.count - a.count);
  return out;
}

export interface PortfolioOverview {
  total: number;
  languages: number;
  recent_24h: number;
  recent_7d: number;
  recent_30d: number;
  cluster_count: number;
  vertical_count: number;
}

export function overview(repos: readonly Repo[]): PortfolioOverview {
  const now = Date.now();
  let r24 = 0;
  let r7 = 0;
  let r30 = 0;
  const langs = new Set<string>();
  const clusters = new Set<Cluster>();
  const verticals = new Set<Vertical>();

  for (const r of repos) {
    if (r.language) langs.add(r.language);
    const f = freshness(r, now);
    if (f === "live") r24++;
    if (f === "live" || f === "active") r7++;
    if (f === "live" || f === "active" || f === "recent") r30++;
    for (const c of clustersFor(r)) clusters.add(c);
    for (const v of verticalsFor(r)) verticals.add(v);
  }

  return {
    total: repos.length,
    languages: langs.size,
    recent_24h: r24,
    recent_7d: r7,
    recent_30d: r30,
    cluster_count: clusters.size,
    vertical_count: verticals.size,
  };
}
