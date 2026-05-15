import { motion } from "motion/react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LanguageStat } from "../lib/aggregate";

interface Props {
  stats: LanguageStat[];
  /** Selecting a bar filters the repo grid below. */
  onSelect: (language: string) => void;
}

/**
 * Repo-count-by-language horizontal bar chart. One bar per language present
 * in the portfolio, descending. Each language gets a deterministic accent
 * color derived from its name so the chart reads the same across refreshes.
 */
export function LanguageAtlas({ stats, onSelect }: Props) {
  return (
    <motion.section
      className="atlas-panel"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <header className="atlas-head">
        <div>
          <h2>Language atlas</h2>
          <p>{stats.length} languages across the public portfolio. Click a bar to filter.</p>
        </div>
        <span className="atlas-pill">repos by primary language</span>
      </header>
      <div className="atlas-chart">
        <ResponsiveContainer width="100%" height={Math.max(280, stats.length * 22 + 40)}>
          <BarChart
            data={stats}
            layout="vertical"
            margin={{ left: 6, right: 24, top: 8, bottom: 8 }}
          >
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "rgba(255,255,255,0.45)",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 11,
              }}
            />
            <YAxis
              type="category"
              dataKey="language"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "rgba(255,255,255,0.7)",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 11,
              }}
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.92)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 11,
                color: "#fff",
              }}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <Bar
              dataKey="count"
              radius={[0, 4, 4, 0]}
              onClick={(payload: unknown) => {
                const p = payload as { language?: string } | undefined;
                if (p?.language) onSelect(p.language);
              }}
              cursor="pointer"
            >
              {stats.map((s) => (
                <Cell key={s.language} fill={languageColor(s.language)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}

/** Stable, well-known colors for the languages with strong identities;
 * deterministic hash for everything else. */
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  Python: "#3776ab",
  Rust: "#dea584",
  Go: "#00add8",
  Java: "#ed8b00",
  Kotlin: "#7f52ff",
  Swift: "#fa7343",
  "C#": "#9b4f96",
  Scala: "#dc322f",
  Haskell: "#5e5086",
  Elixir: "#4b275f",
  Ruby: "#cc342d",
  PHP: "#777bb4",
  Julia: "#9558b2",
  Dart: "#0175c2",
  Zig: "#f7a41d",
  R: "#198ce7",
  HTML: "#e34c26",
  CSS: "#1572b6",
  HCL: "#5c4ee5",
  PLpgSQL: "#336791",
  Jupyter: "#da5b0b",
  "Jupyter Notebook": "#da5b0b",
  OCaml: "#3be133",
  Shell: "#89e051",
};

function languageColor(name: string): string {
  if (LANGUAGE_COLORS[name]) return LANGUAGE_COLORS[name];
  // Deterministic hash → hue.
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  const hue = h % 360;
  return `hsl(${hue} 60% 55%)`;
}
