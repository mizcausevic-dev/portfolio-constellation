import { Archive, ExternalLink, GitFork, Star } from "lucide-react";
import { clustersFor, freshness, verticalsFor } from "../lib/classifier";
import { CLUSTERS, VERTICALS, type Repo } from "../lib/types";

interface Props {
  repo: Repo;
  featured?: boolean;
}

/**
 * Single repo tile. Shows name, language pill, primary cluster chip, vertical
 * chips, top topics, freshness dim, archived badge, license. Click anywhere
 * navigates to the GitHub URL.
 */
export function RepoCard({ repo, featured = false }: Props) {
  const fresh = freshness(repo);
  const clusters = clustersFor(repo).slice(0, 2);
  const verticals = verticalsFor(repo).slice(0, 3);
  const topics = repo.topics.slice(0, 4);

  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noreferrer"
      data-repo-card={featured ? "featured" : "grid"}
      className={`repo-card freshness-${fresh}${featured ? " repo-card-featured" : ""}`}
      title={`pushed ${relative(repo.pushed_at)}`}
      suppressHydrationWarning
    >
      <div className="repo-card-head">
        <span className="repo-card-name">{repo.name}</span>
        <ExternalLink className="repo-card-icon" />
      </div>
      {repo.description && <p className="repo-card-desc">{repo.description}</p>}

      <div className="repo-card-meta">
        {clusters.map((c) => {
          const meta = CLUSTERS[c];
          return (
            <span key={c} className="repo-card-cluster" style={{ background: alpha(meta.accent, 0.15), color: meta.accent, borderColor: alpha(meta.accent, 0.4) }}>
              {meta.label}
            </span>
          );
        })}
        {verticals.map((v) => (
          <span key={v} className="repo-card-vertical">{VERTICALS[v].label}</span>
        ))}
      </div>

      {topics.length > 0 && (
        <div className="repo-card-topics">
          {topics.map((t) => (
            <span key={t} className="repo-card-topic">#{t}</span>
          ))}
        </div>
      )}

      <div className="repo-card-foot">
        {repo.language && (
          <span className="repo-card-lang">
            <span className="repo-card-lang-dot" style={{ background: languageDot(repo.language) }} />
            {repo.language}
          </span>
        )}
        {repo.stars > 0 && (
          <span className="repo-card-num">
            <Star className="icon-xs" /> {repo.stars}
          </span>
        )}
        {repo.forks > 0 && (
          <span className="repo-card-num">
            <GitFork className="icon-xs" /> {repo.forks}
          </span>
        )}
        <span className="repo-card-when" suppressHydrationWarning>{relative(repo.pushed_at)}</span>
        {repo.archived && (
          <span className="repo-card-archived">
            <Archive className="icon-xs" /> archived
          </span>
        )}
      </div>
    </a>
  );
}

function relative(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  const delta = Date.now() - t;
  if (delta < 60_000) return "just now";
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)}h`;
  if (delta < 30 * 86_400_000) return `${Math.floor(delta / 86_400_000)}d`;
  if (delta < 365 * 86_400_000) return `${Math.floor(delta / (30 * 86_400_000))}mo`;
  return `${Math.floor(delta / (365 * 86_400_000))}y`;
}

function alpha(hex: string, a: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

const LANG_DOTS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  Python: "#3776ab",
  Rust: "#dea584",
  Go: "#00add8",
  Java: "#ed8b00",
  Swift: "#fa7343",
  Kotlin: "#7f52ff",
  HTML: "#e34c26",
  CSS: "#1572b6",
};

function languageDot(lang: string): string {
  return LANG_DOTS[lang] ?? "#94a3b8";
}
