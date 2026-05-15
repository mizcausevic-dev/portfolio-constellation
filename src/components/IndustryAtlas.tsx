import { motion } from "motion/react";
import type { VerticalStat } from "../lib/aggregate";
import type { Vertical } from "../lib/types";

interface Props {
  verticals: VerticalStat[];
  onSelect: (vertical: Vertical) => void;
}

/**
 * Industry-vertical coverage atlas. Renders one chip per vertical the
 * portfolio touches, sized by repo count so coverage is immediately legible.
 * Click filters the grid below.
 */
export function IndustryAtlas({ verticals, onSelect }: Props) {
  const max = verticals.reduce((m, v) => Math.max(m, v.count), 1);
  return (
    <motion.section
      className="atlas-panel"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <header className="atlas-head">
        <div>
          <h2>Industry atlas</h2>
          <p>
            Verticals represented across the portfolio. Bubble size is repo count. Click any
            chip to filter the grid below to only that vertical.
          </p>
        </div>
        <span className="atlas-pill">{verticals.length} verticals</span>
      </header>
      <div className="industry-grid">
        {verticals.map((v) => {
          const weight = v.count / max;
          return (
            <button
              key={v.id}
              type="button"
              className="industry-chip"
              onClick={() => onSelect(v.id)}
              style={{ ["--w" as never]: weight as never }}
            >
              <span className="industry-chip-label">{v.label}</span>
              <span className="industry-chip-count">{v.count}</span>
            </button>
          );
        })}
      </div>
    </motion.section>
  );
}
