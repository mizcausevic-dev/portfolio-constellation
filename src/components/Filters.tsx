import { Search, X } from "lucide-react";
import { CLUSTERS, VERTICALS, type Cluster, type Vertical } from "../lib/types";

export interface FilterState {
  query: string;
  cluster: Cluster | "all";
  vertical: Vertical | "all";
  language: string | "all";
  freshness: "all" | "active" | "live";
}

interface Props {
  state: FilterState;
  onChange: (next: FilterState) => void;
  /** Distinct languages in the current dataset, sorted by repo count. */
  languages: string[];
  filteredCount: number;
  totalCount: number;
}

const CLUSTER_IDS = Object.keys(CLUSTERS) as Cluster[];
const VERTICAL_IDS = Object.keys(VERTICALS) as Vertical[];

/**
 * Sticky filter bar: search + language/freshness selects + category CHIP rows
 * for platforms and verticals. All filters compose (AND). Clicking an active
 * chip clears it back to "all".
 */
export function Filters({ state, onChange, languages, filteredCount, totalCount }: Props) {
  function patch(p: Partial<FilterState>) {
    onChange({ ...state, ...p });
  }
  const active =
    state.query.length > 0 ||
    state.cluster !== "all" ||
    state.vertical !== "all" ||
    state.language !== "all" ||
    state.freshness !== "all";

  return (
    <div className="filters">
      <div className="filters-row">
        <div className="filters-search">
          <Search className="filters-search-icon" />
          <input
            type="search"
            value={state.query}
            placeholder="search repos by name, description, topic..."
            onChange={(e) => patch({ query: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Escape") patch({ query: "" });
            }}
          />
        </div>
        <select value={state.language} onChange={(e) => patch({ language: e.target.value })}>
          <option value="all">all languages</option>
          {languages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={state.freshness}
          onChange={(e) => patch({ freshness: e.target.value as FilterState["freshness"] })}
        >
          <option value="all">any freshness</option>
          <option value="active">{"pushed <= 7d"}</option>
          <option value="live">{"pushed <= 24h"}</option>
        </select>
        {active && (
          <button
            type="button"
            className="filters-clear"
            onClick={() =>
              onChange({ query: "", cluster: "all", vertical: "all", language: "all", freshness: "all" })
            }
          >
            <X className="icon-xs" /> clear
          </button>
        )}
      </div>

      <div className="filters-chip-group">
        <div className="filters-chip-group-label">Platforms</div>
        <div className="filters-chip-row">
          <button
            type="button"
            className="filters-chip"
            aria-pressed={state.cluster === "all"}
            onClick={() => patch({ cluster: "all" })}
          >
            all
          </button>
          {CLUSTER_IDS.map((c) => (
            <button
              key={c}
              type="button"
              className="filters-chip"
              aria-pressed={state.cluster === c}
              onClick={() => patch({ cluster: state.cluster === c ? "all" : c })}
            >
              {CLUSTERS[c].label}
            </button>
          ))}
        </div>
      </div>

      <div className="filters-chip-group">
        <div className="filters-chip-group-label">Verticals</div>
        <div className="filters-chip-row">
          <button
            type="button"
            className="filters-chip"
            aria-pressed={state.vertical === "all"}
            onClick={() => patch({ vertical: "all" })}
          >
            all
          </button>
          {VERTICAL_IDS.map((v) => (
            <button
              key={v}
              type="button"
              className="filters-chip"
              aria-pressed={state.vertical === v}
              onClick={() => patch({ vertical: state.vertical === v ? "all" : v })}
            >
              {VERTICALS[v].label}
            </button>
          ))}
        </div>
      </div>

      <div className="filters-summary">
        showing <strong>{filteredCount}</strong> of {totalCount} repos
      </div>
    </div>
  );
}
