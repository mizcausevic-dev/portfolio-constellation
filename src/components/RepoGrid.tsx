import { useMemo, useRef } from "react";
import { useEffect } from "react";
import { motion } from "motion/react";
import { Filters, type FilterState } from "./Filters";
import { RepoCard } from "./RepoCard";
import { clustersFor, freshness, verticalsFor } from "../lib/classifier";
import { languageStats } from "../lib/aggregate";
import type { Repo } from "../lib/types";

interface Props {
  repos: readonly Repo[];
  filters: FilterState;
  onFilters: (next: FilterState) => void;
}

/**
 * The full filterable grid. Filters at the top, virtualised-friendly grid
 * below. Externalises filter state so other components (cluster cards,
 * language atlas bars, vertical chips) can drive it.
 *
 * When filters change, scrolls the grid into view so the user understands
 * a filter took effect even when the trigger was far up the page.
 */
export function RepoGrid({ repos, filters, onFilters }: Props) {
  const langs = useMemo(() => languageStats(repos).map((l) => l.language), [repos]);
  const filtered = useMemo(() => applyFilters(repos, filters), [repos, filters]);

  const anchorRef = useRef<HTMLDivElement | null>(null);
  const lastFilterRef = useRef<FilterState>(filters);
  useEffect(() => {
    const prev = lastFilterRef.current;
    if (
      prev.cluster !== filters.cluster ||
      prev.vertical !== filters.vertical ||
      prev.language !== filters.language ||
      prev.freshness !== filters.freshness
    ) {
      anchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    lastFilterRef.current = filters;
  }, [filters]);

  return (
    <section className="repo-grid-section" ref={anchorRef}>
      <div className="section-head">
        <h2>Every repo</h2>
        <p>
          Filterable atlas of every public repo in the live GitHub snapshot. Search by name / description / topic, or
          drill into a single platform, vertical, language, or freshness window.
        </p>
      </div>
      <Filters
        state={filters}
        onChange={onFilters}
        languages={langs}
        filteredCount={filtered.length}
        totalCount={repos.length}
      />
      <motion.div
        className="repo-grid"
        layout
        transition={{ layout: { duration: 0.25 } }}
      >
        {filtered.length === 0 ? (
          <div className="repo-grid-empty">
            No repos match the current filters. Try{" "}
            <button
              type="button"
              className="filters-clear filters-clear-inline"
              onClick={() =>
                onFilters({ query: "", cluster: "all", vertical: "all", language: "all", freshness: "all" })
              }
            >
              clearing
            </button>
            .
          </div>
        ) : (
          filtered.map((repo) => (
            <motion.div
              key={repo.name}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <RepoCard repo={repo} />
            </motion.div>
          ))
        )}
      </motion.div>
    </section>
  );
}

function applyFilters(repos: readonly Repo[], f: FilterState): Repo[] {
  const q = f.query.trim().toLowerCase();
  const out: Repo[] = [];
  for (const r of repos) {
    if (q) {
      const blob = (
        r.name +
        " " +
        r.description +
        " " +
        r.topics.join(" ") +
        " " +
        (r.language ?? "")
      ).toLowerCase();
      if (!blob.includes(q)) continue;
    }
    if (f.cluster !== "all") {
      if (!clustersFor(r).includes(f.cluster)) continue;
    }
    if (f.vertical !== "all") {
      if (!verticalsFor(r).includes(f.vertical)) continue;
    }
    if (f.language !== "all") {
      if (r.language !== f.language) continue;
    }
    if (f.freshness !== "all") {
      const fr = freshness(r);
      if (f.freshness === "live" && fr !== "live") continue;
      if (f.freshness === "active" && fr !== "live" && fr !== "active") continue;
    }
    out.push(r);
  }
  return out;
}
