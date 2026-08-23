import { useEffect, useMemo, useState } from "react";
import { ClusterShowcase } from "./components/ClusterShowcase";
import { FeaturedTier } from "./components/FeaturedTier";
import { Hero } from "./components/Hero";
import { IndustryAtlas } from "./components/IndustryAtlas";
import { JsonLd } from "./components/JsonLd";
import { LanguageAtlas } from "./components/LanguageAtlas";
import { PortfolioConstellation } from "./components/PortfolioConstellation";
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
import { isFeatured } from "./lib/classifier";
import { cleanedRepos } from "./lib/curate";
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
  // newer-than-snapshot data is reachable. Skipped during SSR (no effects), so
  // the prerender captures the baked snapshot. Silent fail keeps the baked data.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ONE cleaned set (lib/curate: !fork && !archived && substance) drives every
  // count and the whole render, so hero == featured + grid == cleaned can't drift.
  const cleaned = useMemo(() => cleanedRepos(snapshot.repos), [snapshot]);
  const featured = useMemo(() => cleaned.filter(isFeatured), [cleaned]);
  const gridRepos = useMemo(() => cleaned.filter((r) => !isFeatured(r)), [cleaned]);

  const ov = useMemo(() => overview(cleaned), [cleaned]);
  const langs = useMemo(() => languageStats(cleaned), [cleaned]);
  const clusters = useMemo(() => clusterStats(cleaned), [cleaned]);
  const verticals = useMemo(() => verticalStats(cleaned), [cleaned]);
  const signals = useMemo(() => signalStats(cleaned), [cleaned]);

  return (
    <div className="app-root">
      <JsonLd repos={cleaned} />
      <Hero
        overview={ov}
        tracked={snapshot.repos.length}
        generatedAt={snapshot.generated_at}
        user={snapshot.user}
        liveRefreshed={liveRefreshed}
      />

      <main className="page">
        <FeaturedTier repos={featured} />

        <PortfolioConstellation
          clusters={clusters}
          totalRepos={ov.total}
          onSelect={(cluster) => setFilters({ ...INITIAL_FILTERS, cluster })}
        />

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

        <RepoGrid repos={gridRepos} filters={filters} onFilters={setFilters} />
      </main>

      <StatusBar total={snapshot.repos.length} generatedAt={snapshot.generated_at} liveRefreshed={liveRefreshed} />
    </div>
  );
}
