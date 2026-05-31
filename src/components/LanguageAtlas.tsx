import { motion } from "motion/react";
import type { LanguageStat } from "../lib/aggregate";

interface Props {
  stats: LanguageStat[];
  onSelect: (language: string) => void;
}

export function LanguageAtlas({ stats, onSelect }: Props) {
  const top = stats.slice(0, 18);

  return (
    <motion.section
      className="atlas-panel atlas-panel-compact"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <header className="atlas-head">
        <div>
          <h2>Language atlas</h2>
          <p>{stats.length} primary languages across the public portfolio. Click a chip to filter.</p>
        </div>
        <span className="atlas-pill">primary language map</span>
      </header>

      <div className="language-chip-grid">
        {top.map((stat) => (
          <button
            key={stat.language}
            type="button"
            className="language-chip"
            onClick={() => onSelect(stat.language)}
          >
            <span className="language-chip-key">
              <span
                className="language-chip-dot"
                style={{ backgroundColor: languageColor(stat.language) }}
                aria-hidden="true"
              />
              <span className="language-chip-label">{stat.language}</span>
            </span>
            <span className="language-chip-count">{stat.count}</span>
          </button>
        ))}
      </div>

      {stats.length > top.length ? (
        <p className="atlas-note">
          Showing the top {top.length} languages by primary-repo count. The repo grid still lets
          you filter the full snapshot below.
        </p>
      ) : (
        <p className="atlas-note">
          Colors are language-specific, and the same snapshot powers the counts, chips, and repo
          grid below.
        </p>
      )}
    </motion.section>
  );
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#5fa2ff",
  JavaScript: "#f7df1e",
  Python: "#4fa3ff",
  HTML: "#ff5ea8",
  Rust: "#dea584",
  CSS: "#22b8ff",
  Go: "#56c8f5",
  PHP: "#d7b089",
  Java: "#ff8f5d",
  "C#": "#c57dff",
  Julia: "#9d6bff",
  Kotlin: "#8a5cff",
  R: "#4aa8ff",
  "Shell / Bash": "#74e35d",
  Shell: "#74e35d",
  Dart: "#2aa7ff",
  Swift: "#ffd447",
  Elixir: "#ff7bc1",
  Haskell: "#54d9bf",
  HCL: "#6b68ff",
  Zig: "#ffbe3d",
  PLpgSQL: "#8c7dff",
  "Jupyter Notebook": "#ff9f45",
};

function languageColor(name: string): string {
  if (LANGUAGE_COLORS[name]) return LANGUAGE_COLORS[name];
  let hash = 0;
  for (let index = 0; index < name.length; index++) {
    hash = (hash * 33 + name.charCodeAt(index)) >>> 0;
  }
  return `hsl(${hash % 360} 74% 62%)`;
}
