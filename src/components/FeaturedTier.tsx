import { RepoCard } from "./RepoCard";
import type { Repo } from "../lib/types";

interface Props {
  repos: readonly Repo[];
}

/**
 * Featured tier: the four JSON-Schema governance specs + the public repos
 * backing the kineticgain verifiable-live surface. Always rendered (never
 * filtered), above the searchable grid. Each card reuses RepoCard with
 * `featured`, so it carries `data-repo-card="featured"` and counts toward the
 * hero total exactly like a grid card.
 */
export function FeaturedTier({ repos }: Props) {
  if (repos.length === 0) return null;
  return (
    <section className="featured-tier">
      <div className="section-head">
        <h2>Verifiable-live &amp; schema-backed</h2>
        <p>
          The proof spine: four JSON-Schema governance specs and the public repos behind the
          cryptographically verifiable kineticgain surface. Every card links to a public repo you
          can inspect and validate yourself.
        </p>
      </div>
      <div className="featured-grid">
        {repos.map((r) => (
          <RepoCard key={r.name} repo={r} featured />
        ))}
      </div>
    </section>
  );
}
