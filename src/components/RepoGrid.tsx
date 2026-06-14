import { useEffect, useMemo, useRef } from "react";
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
 * The full filterable grid. Filters at the top; grid below.
 *
 * Hide-not-remove: EVERY repo is always rendered into the DOM (so the
 * prerendered static HTML contains all of them for crawlers); a non-matching
 * repo gets `.repo-card-hidden` (display:none) rather than being dropped from
 * the render. The count reflects how many are currently visible.
 */
export function RepoGrid({ repos, filters, onFilters }: Props) {
  const langs = useMemo(() => languageStats(repos).map((l) => l.language), [repos]);
  const decided = useMemo(
    () => repos.map((r) => ({ repo: r, visible: matches(r, filters) })),
    [repos, filters],
  );
  const visibleCount = decided.reduce((n, d) => n + (d.visible ? 1 : 0), 0);

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
          Filterable atlas of every substantive public repo in the live GitHub snapshot. Search by
          name / description / topic, or drill into a platform, vertical, language, or freshness
          window. All repos stay in the page source for crawlers; filters only hide.
        </p>
      </div>
      <Filters
        state={filters}
        onChange={onFilters}
        languages={langs}
        filteredCount={visibleCount}
        totalCount={repos.length}
      />
      {visibleCount === 0 && (
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
      )}
      <div className="repo-grid">
        {decided.map(({ repo, visible }) => (
          <div
            key={repo.name}
            className={visible ? "repo-grid-item" : "repo-grid-item repo-card-hidden"}
            aria-hidden={visible ? undefined : true}
          >
            <RepoCard repo={repo} />
          </div>
        ))}
      </div>
    </section>
  );
}

function matches(r: Repo, f: FilterState): boolean {
  const q = f.query.trim().toLowerCase();
  if (q) {
    const blob = (
      r.name + " " + r.description + " " + r.topics.join(" ") + " " + (r.language ?? "")
    ).toLowerCase();
    if (!blob.includes(q)) return false;
  }
  if (f.cluster !== "all" && !clustersFor(r).includes(f.cluster)) return false;
  if (f.vertical !== "all" && !verticalsFor(r).includes(f.vertical)) return false;
  if (f.language !== "all" && r.language !== f.language) return false;
  if (f.freshness !== "all") {
    const fr = freshness(r);
    if (f.freshness === "live" && fr !== "live") return false;
    if (f.freshness === "active" && fr !== "live" && fr !== "active") return false;
  }
  return true;
}
