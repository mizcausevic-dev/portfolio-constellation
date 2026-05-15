import { motion } from "motion/react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { freshness } from "../lib/classifier";
import type { ClusterStat } from "../lib/aggregate";
import type { Cluster } from "../lib/types";

interface Props {
  clusters: ClusterStat[];
  /** Selecting a cluster scrolls / filters the repo grid below. */
  onSelect: (cluster: Cluster) => void;
}

/**
 * Featured cluster band. One card per named platform with: count, blurb,
 * top-5 repos pulled by recency, accent stripe in the cluster's colour.
 */
export function ClusterShowcase({ clusters, onSelect }: Props) {
  return (
    <section className="cluster-showcase">
      <div className="section-head">
        <h2>Named platforms</h2>
        <p>
          The repos grouped into the platforms that organise the work. Order is by where the
          named cluster sits in the architecture, not by repo count.
        </p>
      </div>
      <div className="cluster-grid">
        {clusters.map((c, i) => (
          <motion.article
            key={c.id}
            className="cluster-card"
            style={{ borderTopColor: c.accent }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35 }}
          >
            <header className="cluster-card-head">
              <h3>{c.label}</h3>
              <span className="cluster-card-count" style={{ color: c.accent }}>
                {c.repos.length}
              </span>
            </header>
            <p className="cluster-card-blurb">{c.blurb}</p>
            <ul className="cluster-card-repos">
              {c.repos.slice(0, 5).map((r) => {
                const f = freshness(r);
                return (
                  <li key={r.name} className={`cluster-card-repo freshness-${f}`}>
                    <a href={r.url} target="_blank" rel="noreferrer">
                      <span className="cluster-card-repo-name">{r.name}</span>
                      <ExternalLink className="cluster-card-repo-icon" />
                    </a>
                  </li>
                );
              })}
              {c.repos.length > 5 && (
                <li className="cluster-card-repos-more">+ {c.repos.length - 5} more</li>
              )}
            </ul>
            <footer className="cluster-card-foot">
              <button type="button" className="cluster-card-cta" onClick={() => onSelect(c.id)}>
                Filter all <ArrowRight className="cluster-card-cta-icon" />
              </button>
            </footer>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
