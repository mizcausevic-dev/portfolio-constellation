/**
 * The cleaned, active, substantive repo set the whole dashboard renders from.
 *
 * This is a DERIVED rule, not a hand-maintained list — the drift/maintenance
 * trap we explicitly rejected. A repo counts as real owned work when it is not
 * a fork, not archived, and shows at least one sign of substance: a
 * description, topics, a star, or a homepage. New repos auto-qualify the moment
 * they gain a description; nothing here needs touching as the estate grows.
 *
 * Hero count, atlas counts, the featured tier, the grid, and the JSON-LD all
 * consume `cleanedRepos()` so the numbers cannot drift apart.
 */
import type { Repo } from "./types";

/** At least one sign of substance. */
export function hasSubstance(r: Repo): boolean {
  return Boolean(
    (r.description ?? "").trim() ||
      r.topics.length > 0 ||
      r.stars > 0 ||
      r.homepage,
  );
}

/**
 * Tiny escape hatch for "clears the bar but shouldn't show" edges. Keep this to
 * 2-3 entries max and comment each one. The fix for most unwanted repos is to
 * remove their description, not to list them here. There is deliberately NO
 * FORCE_INCLUDE counterpart: to surface a repo, give it a description.
 */
export const FORCE_EXCLUDE: ReadonlySet<string> = new Set<string>([
  // (none currently)
]);

/** Cleaned = not fork, not archived, has substance, not force-excluded. */
export function cleanedRepos(repos: readonly Repo[]): Repo[] {
  return repos.filter(
    (r) => !r.fork && !r.archived && hasSubstance(r) && !FORCE_EXCLUDE.has(r.name),
  );
}
