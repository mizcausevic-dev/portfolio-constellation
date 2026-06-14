interface Props {
  total: number;
  generatedAt: string;
  liveRefreshed: boolean;
}

/** Bottom mono status strip with dataset metadata + source link. */
export function StatusBar({ total, generatedAt, liveRefreshed }: Props) {
  return (
    <footer className="status-bar">
      <div className="status-bar-left">
        <span className={`status-pulse ${liveRefreshed ? "status-pulse-live" : "status-pulse-snap"}`} />
        <span>data_source: github.com/mizcausevic-dev</span>
        <span className="status-sep">·</span>
        <span>snapshot: {shortDate(generatedAt)}</span>
        <span className="status-sep">·</span>
        <span>tracked: {total.toLocaleString()}</span>
      </div>
      <div className="status-bar-right">
        <a href="https://github.com/mizcausevic-dev/" target="_blank" rel="noreferrer">
          github
        </a>
        <span className="status-sep">·</span>
        <a href="https://www.linkedin.com/in/mirzacausevic/" target="_blank" rel="noreferrer">
          linkedin
        </a>
        <span className="status-sep">·</span>
        <a href="https://kineticgain.com" target="_blank" rel="noreferrer">
          kineticgain.com
        </a>
        <span className="status-sep">·</span>
        <a href="https://github.com/mizcausevic-dev/portfolio-constellation" target="_blank" rel="noreferrer">
          source
        </a>
        <span className="status-sep">·</span>
        <span className="status-ver">v0.1.0</span>
      </div>
    </footer>
  );
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}
