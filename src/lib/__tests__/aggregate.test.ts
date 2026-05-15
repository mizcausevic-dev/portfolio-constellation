import { describe, expect, it } from "vitest";
import {
  clusterStats,
  languageStats,
  overview,
  verticalStats,
} from "../aggregate";
import type { Repo } from "../types";

function repo(over: Partial<Repo>): Repo {
  return {
    name: "x",
    description: "",
    url: "x",
    language: null,
    topics: [],
    pushed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    stars: 0,
    forks: 0,
    archived: false,
    fork: false,
    homepage: null,
    license: null,
    ...over,
  };
}

describe("languageStats", () => {
  it("returns repo counts by language, descending", () => {
    const repos = [
      repo({ name: "a", language: "Python" }),
      repo({ name: "b", language: "Python" }),
      repo({ name: "c", language: "Rust" }),
      repo({ name: "d", language: null }),
    ];
    const stats = languageStats(repos);
    expect(stats[0]).toEqual({ language: "Python", count: 2 });
    expect(stats[1]).toEqual({ language: "Rust", count: 1 });
    expect(stats.length).toBe(2);
  });

  it("returns empty for an empty input", () => {
    expect(languageStats([])).toEqual([]);
  });
});

describe("clusterStats", () => {
  it("buckets a known kg spec into kg-suite", () => {
    const stats = clusterStats([repo({ name: "aeo-protocol-spec" })]);
    expect(stats.find((c) => c.id === "kg-suite")?.repos.length).toBe(1);
  });

  it("multi-cluster repo appears in each cluster's bucket", () => {
    const stats = clusterStats([repo({ name: "audit-stream-py" })]);
    expect(stats.find((c) => c.id === "kg-implementation")?.repos.length).toBe(1);
    expect(stats.find((c) => c.id === "platform-reliability")?.repos.length).toBe(1);
  });
});

describe("verticalStats", () => {
  it("buckets edtech-tagged repos under edtech", () => {
    const stats = verticalStats([repo({ name: "x", topics: ["edtech"] })]);
    expect(stats[0]?.id).toBe("edtech");
  });
});

describe("overview", () => {
  it("counts total + languages + recently pushed buckets", () => {
    const now = Date.now();
    const old = new Date(now - 60 * 86_400_000).toISOString();
    const fresh = new Date(now - 3 * 3600_000).toISOString();
    const week_ish = new Date(now - 3 * 86_400_000).toISOString();

    const o = overview([
      repo({ name: "a", language: "Python", pushed_at: fresh }),
      repo({ name: "b", language: "Rust", pushed_at: week_ish }),
      repo({ name: "c", language: "TypeScript", pushed_at: old }),
    ]);

    expect(o.total).toBe(3);
    expect(o.languages).toBe(3);
    expect(o.recent_24h).toBe(1);
    expect(o.recent_7d).toBe(2);
  });
});
