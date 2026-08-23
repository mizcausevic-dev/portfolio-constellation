import { useState } from "react";
import { motion } from "motion/react";
import { freshness } from "../lib/classifier";
import type { ClusterStat } from "../lib/aggregate";
import {
  CX,
  CY,
  fanAngles,
  hubRadius,
  polar,
  splitLeaves,
  textAnchor,
  truncate,
} from "../lib/constellationLayout";
import type { Cluster, Repo } from "../lib/types";
import { SendToLlm } from "./SendToLlm";

interface Props {
  clusters: ClusterStat[];
  totalRepos: number;
  onSelect: (cluster: Cluster) => void;
}

const HUB_R = 300;
const LEAF_R = 420;
const ARC_R = 460;
const CENTER_R = 50;
/** Real repos shown as leaves per hub before folding the rest into "+N more".
 * Caps the canvas at roughly (hubs x 4) nodes so ~11-14 real named platforms
 * stay legible on one SVG; the full list is never dropped, only the map.
 * Matches kg-suite-web's suite-constellation.js reference density (3 leaves
 * per hub) — the earlier cap of 4 left too little angular room between
 * neighboring hubs' label clusters at N=9+ hubs and their text overlapped. */
const LEAF_CAP = 3;

interface DossierField {
  label: string;
  value: string;
}

interface DossierState {
  badge: string;
  title: string;
  desc: string;
  fields: DossierField[];
  linkLabel: string;
  linkHref?: string;
  linkExternal?: boolean;
  onLinkClick?: () => void;
}

/**
 * Radial hub/leaf map of the same named platforms as the ClusterShowcase
 * cards below — same real `clusters` prop, so the two views can't drift.
 * Additive, not a replacement: the card grid stays the default, zero-click
 * reference surface; this is a second, exploratory way to reach the same
 * data (same pattern as the kg-suite-web /specs/ and /mcp/ diagrams).
 *
 * Hub radius encodes each platform's real repo count; every count is also
 * printed as literal SVG text next to the node, so nothing depends on size
 * or color alone. All hub/leaf nodes are real tabbable, labeled controls —
 * see the per-node aria-label below.
 */
export function PortfolioConstellation({ clusters, totalRepos, onSelect }: Props) {
  const [pinned, setPinned] = useState<Cluster | null>(null);
  const [hovered, setHovered] = useState<Cluster | null>(null);
  const [dossier, setDossier] = useState<DossierState | null>(null);

  const N = clusters.length;
  const active = pinned ?? hovered;

  if (N === 0) return null;

  function hubDossier(c: ClusterStat): DossierState {
    return {
      badge: "Named platform",
      title: c.label,
      desc: c.blurb,
      fields: [{ label: "Repos", value: String(c.repos.length) }],
      linkLabel: "Filter the grid ↓",
      onLinkClick: () => onSelect(c.id),
    };
  }

  function leafDossier(c: ClusterStat, r: Repo): DossierState {
    return {
      badge: c.label,
      title: r.name,
      desc: r.description || "No description on the repo yet.",
      fields: [
        { label: "Language", value: r.language ?? "—" },
        { label: "Freshness", value: freshness(r) },
      ],
      linkLabel: "Open repo →",
      linkHref: r.url,
      linkExternal: true,
    };
  }

  function moreDossier(c: ClusterStat, extra: number): DossierState {
    return {
      badge: c.label,
      title: `+ ${extra} more repo${extra === 1 ? "" : "s"}`,
      desc: `${c.repos.length} repos total in ${c.label}. The map shows the ${Math.min(
        LEAF_CAP,
        c.repos.length,
      )} most recently pushed; the rest are one filter click away.`,
      fields: [],
      linkLabel: "Filter the grid ↓",
      onLinkClick: () => onSelect(c.id),
    };
  }

  function togglePin(id: Cluster) {
    setPinned((p) => (p === id ? null : id));
  }

  return (
    <motion.section
      className="constellation"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="section-head">
        <h2>Constellation map</h2>
        <p>
          The same named platforms as the cards below, laid out as a radial map. Hub size is each
          platform&rsquo;s real repo count. Hover or tab through a hub to preview its most recent
          repos; click a hub to filter the grid.
        </p>
        <SendToLlm />
      </div>

      <div className="constellation-pillbar" role="group" aria-label="Filter by named platform">
        <button
          type="button"
          className={pinned === null ? "constellation-pill active" : "constellation-pill"}
          onClick={() => setPinned(null)}
        >
          All {N}
        </button>
        {clusters.map((c) => (
          <button
            key={c.id}
            type="button"
            className={pinned === c.id ? "constellation-pill active" : "constellation-pill"}
            style={
              pinned === c.id
                ? { background: c.accent, borderColor: c.accent, color: "#020617" }
                : { borderColor: c.accent }
            }
            onClick={() => {
              togglePin(c.id);
              setDossier(hubDossier(c));
            }}
          >
            {c.label} &middot; {c.repos.length}
          </button>
        ))}
      </div>

      <div className="constellation-stage">
        <div className="constellation-sweep" aria-hidden="true" />
        <svg
          viewBox={`0 0 ${CX * 2} ${CY * 2}`}
          role="group"
          aria-label={`Radial map of ${N} named platforms across ${totalRepos} total repos`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPinned(null);
          }}
        >
          {clusters.map((c, i) => {
            const angle = (360 / N) * i;
            const hubPos = polar(CX, CY, HUB_R, angle);
            const col = c.accent;
            const dim = active !== null && active !== c.id;

            const arcSpan = (360 / N) * 0.74;
            const a0 = angle - arcSpan / 2;
            const a1 = angle + arcSpan / 2;
            const p0 = polar(CX, CY, ARC_R, a0);
            const p1 = polar(CX, CY, ARC_R, a1);
            const largeArc = arcSpan > 180 ? 1 : 0;
            const arcPath = `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} A ${ARC_R} ${ARC_R} 0 ${largeArc} 1 ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;

            const spokeStart = polar(CX, CY, CENTER_R, angle);
            const hubR = hubRadius(c.repos.length);
            const lblPos = polar(CX, CY, HUB_R + hubR + 12, angle);
            const hubAnchor = textAnchor(lblPos.x);

            const { shown, more } = splitLeaves(c.repos, LEAF_CAP);
            const leafSlots = shown.length + (more > 0 ? 1 : 0);
            // Tight cap (same order as kg-suite-web's suite-constellation.js) so a
            // hub's leaf fan never encroaches on its neighbors' label space —
            // the prior 0.85-of-slot fan left near-zero gap between hubs.
            const fan = Math.min(16, (360 / N) * 0.55);
            const angles = fanAngles(angle, leafSlots, fan);

            return (
              <g key={c.id} className={dim ? "constellation-group dim" : "constellation-group"}>
                <path className="arc" d={arcPath} stroke={col} />
                <line
                  className="spoke"
                  x1={spokeStart.x}
                  y1={spokeStart.y}
                  x2={hubPos.x}
                  y2={hubPos.y}
                  stroke={col}
                />

                {shown.map((r, j) => {
                  const leafAngle = angles[j];
                  const leafPos = polar(CX, CY, LEAF_R, leafAngle);
                  // Step the label's radius (not the node's) by slot index so no two
                  // leaves in a tight fan ever print on the same band — worst near the
                  // top/bottom of the circle, where a fan's angular spread is nearly all
                  // horizontal and same-radius labels sit side by side with no gap.
                  const lp = polar(CX, CY, LEAF_R + 13 + j * 9, leafAngle);
                  const leafAnchor = textAnchor(lp.x);
                  const f = freshness(r);
                  return (
                    <g key={r.name}>
                      <path
                        className="branch"
                        stroke={col}
                        d={`M ${hubPos.x.toFixed(1)} ${hubPos.y.toFixed(1)} L ${leafPos.x.toFixed(1)} ${leafPos.y.toFixed(1)}`}
                      />
                      <g
                        className="node-leaf hoverable"
                        tabIndex={0}
                        role="button"
                        aria-label={`${r.name}, repo in ${c.label}, ${f}. Activate for details and a link to the repo.`}
                        onMouseEnter={() => setDossier(leafDossier(c, r))}
                        onFocus={() => setDossier(leafDossier(c, r))}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDossier(leafDossier(c, r));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setDossier(leafDossier(c, r));
                          }
                        }}
                      >
                        <circle cx={leafPos.x} cy={leafPos.y} r={5.5} fill="var(--slate-950)" stroke={col} />
                        <circle className={`beacon freshness-${f}`} cx={leafPos.x} cy={leafPos.y} r={2} fill={col} />
                      </g>
                      <text
                        className="lbl-leaf"
                        x={lp.x}
                        y={lp.y}
                        fill="var(--slate-400)"
                        textAnchor={leafAnchor}
                      >
                        {truncate(r.name, 16)}
                      </text>
                    </g>
                  );
                })}

                {more > 0 &&
                  (() => {
                    const leafAngle = angles[shown.length];
                    const leafPos = polar(CX, CY, LEAF_R, leafAngle);
                    const lp = polar(CX, CY, LEAF_R + 13 + shown.length * 9, leafAngle);
                    const leafAnchor = textAnchor(lp.x);
                    return (
                      <g key="more">
                        <path
                          className="branch branch-more"
                          stroke={col}
                          d={`M ${hubPos.x.toFixed(1)} ${hubPos.y.toFixed(1)} L ${leafPos.x.toFixed(1)} ${leafPos.y.toFixed(1)}`}
                        />
                        <g
                          className="node-leaf node-more hoverable"
                          tabIndex={0}
                          role="button"
                          aria-label={`${more} more repos in ${c.label}. Activate to filter the grid and see all ${c.repos.length}.`}
                          onMouseEnter={() => setDossier(moreDossier(c, more))}
                          onFocus={() => setDossier(moreDossier(c, more))}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(c.id);
                            setDossier(moreDossier(c, more));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onSelect(c.id);
                              setDossier(moreDossier(c, more));
                            }
                          }}
                        >
                          <circle cx={leafPos.x} cy={leafPos.y} r={6} fill="var(--slate-950)" stroke={col} strokeDasharray="2 2" />
                        </g>
                        <text
                          className="lbl-leaf lbl-more"
                          x={lp.x}
                          y={lp.y}
                          fill={col}
                          textAnchor={leafAnchor}
                        >
                          +{more} more
                        </text>
                      </g>
                    );
                  })()}

                <g
                  className="node-hub hoverable"
                  tabIndex={0}
                  role="button"
                  aria-label={`${c.label}, named platform, ${c.repos.length} repo${c.repos.length === 1 ? "" : "s"}. Activate to see details and filter the grid.`}
                  onMouseEnter={() => {
                    setHovered(c.id);
                    setDossier(hubDossier(c));
                  }}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => {
                    setHovered(c.id);
                    setDossier(hubDossier(c));
                  }}
                  onBlur={() => setHovered(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(c.id);
                    setDossier(hubDossier(c));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      togglePin(c.id);
                      setDossier(hubDossier(c));
                    }
                  }}
                >
                  <circle className="ring" cx={hubPos.x} cy={hubPos.y} r={hubR + 6} stroke={col} />
                  <circle className="core" cx={hubPos.x} cy={hubPos.y} r={hubR} fill="var(--slate-950)" stroke={col} />
                  <circle cx={hubPos.x} cy={hubPos.y} r={3.2} fill={col} />
                </g>
                <text className="lbl-hub" x={lblPos.x} y={lblPos.y} fill={col} textAnchor={hubAnchor}>
                  {c.code} &middot; {c.repos.length}
                </text>
              </g>
            );
          })}

          <circle className="center-ring" cx={CX} cy={CY} r={70} />
          <circle className="center-core" cx={CX} cy={CY} r={CENTER_R} />
          <text className="center-lbl" x={CX} y={CY - 6} textAnchor="middle">
            PORTFOLIO
          </text>
          <text className="center-sub" x={CX} y={CY + 10} textAnchor="middle">
            {totalRepos} REPOS
          </text>
          <text className="center-sub" x={CX} y={CY + 22} textAnchor="middle">
            {N} PLATFORMS
          </text>
        </svg>
      </div>

      <div className={dossier ? "constellation-dossier show" : "constellation-dossier"}>
        {dossier && (
          <>
            <button
              type="button"
              className="constellation-dossier-close"
              aria-label="Close details"
              onClick={() => setDossier(null)}
            >
              &times;
            </button>
            <div className="constellation-dossier-kind">{dossier.badge}</div>
            <h3>{dossier.title}</h3>
            <p>{dossier.desc}</p>
            {dossier.fields.length > 0 && (
              <div className="constellation-dossier-fields">
                {dossier.fields.map((f) => (
                  <div className="field" key={f.label}>
                    <span>{f.label}</span>
                    <strong>{f.value}</strong>
                  </div>
                ))}
              </div>
            )}
            {dossier.onLinkClick ? (
              <button type="button" className="constellation-dossier-link" onClick={dossier.onLinkClick}>
                {dossier.linkLabel}
              </button>
            ) : (
              <a
                className="constellation-dossier-link"
                href={dossier.linkHref}
                target={dossier.linkExternal ? "_blank" : undefined}
                rel={dossier.linkExternal ? "noreferrer" : undefined}
              >
                {dossier.linkLabel}
              </a>
            )}
          </>
        )}
      </div>
    </motion.section>
  );
}
