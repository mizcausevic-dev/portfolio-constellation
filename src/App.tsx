import { useEffect, useMemo, useState } from "react";
import { ClusterShowcase } from "./components/ClusterShowcase";
import { Hero } from "./components/Hero";
import { IndustryAtlas } from "./components/IndustryAtlas";
import { LanguageAtlas } from "./components/LanguageAtlas";
import { RepoGrid } from "./components/RepoGrid";
import { StatusBar } from "./components/StatusBar";
import type { FilterState } from "./components/Filters";
import {
  clusterStats,
  languageStats,
  overview,
  signalStats,
  verticalStats,
} from "./lib/aggregate";
import { bakedSnapshot, fetchLiveSnapshot } from "./lib/data";
import type { Snapshot } from "./lib/types";

const INITIAL_FILTERS: FilterState = {
  query: "",
  cluster: "all",
  vertical: "all",
  language: "all",
  freshness: "all",
};

export default function App() {
  const [snapshot, setSnapshot] = useState<Snapshot>(() => bakedSnapshot());
  const [liveRefreshed, setLiveRefreshed] = useState(false);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // Fire a live re-fetch after first paint so the dashboard upgrades when
  // newer-than-snapshot data is reachable. Silent fail keeps the baked
  // snapshot in place when the API is unreachable.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fresh = await fetchLiveSnapshot(snapshot.user);
      if (!cancelled && fresh && fresh.repos.length >= snapshot.repos.length) {
        setSnapshot(fresh);
        setLiveRefreshed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // We only want this to fire once on mount with the original baked user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ov = useMemo(() => overview(snapshot.repos), [snapshot]);
  const langs = useMemo(() => languageStats(snapshot.repos), [snapshot]);
  const clusters = useMemo(() => clusterStats(snapshot.repos), [snapshot]);
  const verticals = useMemo(() => verticalStats(snapshot.repos), [snapshot]);
  const signals = useMemo(() => signalStats(snapshot.repos), [snapshot]);

  return (
    <div className="app-root">
      <Hero
        overview={ov}
        generatedAt={snapshot.generated_at}
        user={snapshot.user}
        liveRefreshed={liveRefreshed}
      />

      <main className="page">
        <ClusterShowcase
          clusters={clusters}
          onSelect={(cluster) => setFilters({ ...INITIAL_FILTERS, cluster })}
        />

        <div className="atlas-row">
          <LanguageAtlas
            stats={langs}
            onSelect={(language) => setFilters({ ...INITIAL_FILTERS, language })}
          />
          <IndustryAtlas
            verticals={verticals}
            signals={signals}
            onSelect={(vertical) => setFilters({ ...INITIAL_FILTERS, vertical })}
            onSignal={(query) => setFilters({ ...INITIAL_FILTERS, query })}
          />
        </div>

        <RepoGrid repos={snapshot.repos} filters={filters} onFilters={setFilters} />
      </main>

      <StatusBar total={snapshot.total} generatedAt={snapshot.generated_at} liveRefreshed={liveRefreshed} />
    </div>
  );
}
