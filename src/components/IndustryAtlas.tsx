import { motion } from "motion/react";
import type { VerticalStat } from "../lib/aggregate";
import type { Vertical } from "../lib/types";

interface PlatformSignal {
  label: string;
  count: number;
  query: string;
}

interface Props {
  verticals: VerticalStat[];
  signals: PlatformSignal[];
  onSelect: (vertical: Vertical) => void;
  onSignal: (query: string) => void;
}

export function IndustryAtlas({ verticals, signals, onSelect, onSignal }: Props) {
  return (
    <motion.section
      className="atlas-panel atlas-panel-compact"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <header className="atlas-head">
        <div>
          <h2>Industry atlas</h2>
          <p>Verticals and company-tag traces across the current public portfolio. Click to filter.</p>
        </div>
        <span className="atlas-pill">{verticals.length} verticals</span>
      </header>

      <div className="industry-grid industry-grid-compact">
        {verticals.map((vertical) => (
          <button
            key={vertical.id}
            type="button"
            className="industry-chip"
            onClick={() => onSelect(vertical.id)}
          >
            <span className="industry-chip-label">{vertical.label}</span>
            <span className="industry-chip-count">{vertical.count}</span>
          </button>
        ))}
      </div>

      <div className="atlas-signal-block">
        <div className="atlas-signal-head">Platform and company signals</div>
        <div className="atlas-signal-grid">
          {signals.map((signal) => (
            <button
              key={signal.label}
              type="button"
              className="atlas-signal-chip"
              onClick={() => onSignal(signal.query)}
            >
              <span>{signal.label}</span>
              <span className="atlas-signal-count">{signal.count}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
