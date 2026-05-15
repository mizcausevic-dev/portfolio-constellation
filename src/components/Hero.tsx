import { motion } from "motion/react";
import { ExternalLink, Globe, Sparkles } from "lucide-react";
import type { PortfolioOverview } from "../lib/aggregate";

interface Props {
  overview: PortfolioOverview;
  generatedAt: string;
  user: string;
  liveRefreshed: boolean;
}

/**
 * Hero band — portfolio-wide stats at a glance. Big numbers, serif italic
 * accents, glassmorphic stat cards. Sets the tone for the whole page.
 */
export function Hero({ overview, generatedAt, user, liveRefreshed }: Props) {
  return (
    <section className="hero">
      <div className="hero-inner">
        <motion.div
          className="hero-headline"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="hero-eyebrow">
            <Sparkles className="hero-eyebrow-icon" />
            <span>Portfolio Constellation</span>
            <span className="hero-eyebrow-sep">·</span>
            <span>{liveRefreshed ? "live (just refreshed)" : `snapshot ${shortDate(generatedAt)}`}</span>
          </div>
          <h1>
            One engineer.
            <br />
            <em>{overview.total}</em> public repos.
            <br />
            <em>{overview.languages}</em> languages.
            <em className="hero-accent">{overview.cluster_count}</em> named platforms.
          </h1>
          <p className="hero-lede">
            A live map of every public project at{" "}
            <a href={`https://github.com/${user}`} target="_blank" rel="noreferrer">
              github.com/{user}
            </a>
            , classified into the named platforms that organise the work and the industry
            verticals it covers. Auto-refreshed from GitHub every six hours so new pushes
            surface here without manual intervention.
          </p>
          <div className="hero-actions">
            <a
              className="hero-cta"
              href={`https://github.com/${user}`}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="hero-cta-icon" /> github.com/{user}
            </a>
            <a className="hero-cta hero-cta-ghost" href="https://kineticgain.com" target="_blank" rel="noreferrer">
              <Globe className="hero-cta-icon" /> kineticgain.com
            </a>
          </div>
        </motion.div>

        <div className="hero-stats">
          {[
            { label: "Total repos", value: overview.total },
            { label: "Languages", value: overview.languages },
            { label: "Pushed in 24h", value: overview.recent_24h, tone: "tone-ok" },
            { label: "Pushed in 7d", value: overview.recent_7d, tone: "tone-ok" },
            { label: "Platforms", value: overview.cluster_count, tone: "tone-info" },
            { label: "Verticals", value: overview.vertical_count, tone: "tone-info" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className={`hero-stat ${stat.tone ?? ""}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.3 }}
            >
              <span className="hero-stat-value">{stat.value.toLocaleString()}</span>
              <span className="hero-stat-label">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
