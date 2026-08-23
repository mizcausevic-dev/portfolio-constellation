/**
 * Pure polar-math + layout helpers for the radial constellation diagram
 * (components/PortfolioConstellation.tsx). Kept independent of React so
 * they're trivial to unit-test, same pattern as lib/aggregate.ts.
 *
 * Same hub/leaf/arc/spoke geometry as the kg-suite-web reference diagrams
 * (suite-constellation.js, specs-constellation.js, mcp-constellation.js) —
 * ported to TypeScript and split out as pure functions instead of imperative
 * DOM writes, since this repo renders the SVG declaratively via JSX.
 */

export interface Point {
  x: number;
  y: number;
}

/** Canvas center, in the SVG's own 1000x1000 viewBox units. */
export const CX = 500;
export const CY = 500;

/** Point at radius `r` from (cx, cy), at compass-style degrees (0 = up, clockwise). */
export function polar(cx: number, cy: number, r: number, deg: number): Point {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** SVG text-anchor for a label positioned left/right/on the vertical center line. */
export function textAnchor(px: number, cx: number = CX): "start" | "middle" | "end" {
  const dx = px - cx;
  if (Math.abs(dx) < 9) return "middle";
  return dx > 0 ? "start" : "end";
}

/** Hub circle radius, scaled from a real per-hub count (never invented). */
export function hubRadius(count: number, base = 13, perItem = 1.8, cap = 13): number {
  return base + Math.min(cap, Math.max(0, count) * perItem);
}

/**
 * Evenly fan `count` leaf angles across a hub's local arc, centered on the
 * hub's own angle. A single leaf points straight out from its hub.
 */
export function fanAngles(centerAngle: number, count: number, maxFan: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [centerAngle];
  const fan = Math.min(maxFan, (count - 1) * 12);
  const step = fan / (count - 1);
  return Array.from({ length: count }, (_, j) => centerAngle - fan / 2 + step * j);
}

export function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/**
 * Split a real, already-ordered item list into the leaves the diagram draws
 * ("shown", capped so ~14 hubs stay legible on one canvas) plus the real
 * remainder count for a "+N more" node. Never drops data from the page —
 * only from this one exploratory view; the full list stays in the grid below.
 */
export function splitLeaves<T>(items: readonly T[], cap: number): { shown: T[]; more: number } {
  if (items.length <= cap) return { shown: [...items], more: 0 };
  return { shown: items.slice(0, cap), more: items.length - cap };
}
