#!/usr/bin/env node
/**
 * Acceptance test for the prerendered build. Greps dist/index.html and asserts:
 *   1. repo cards present in static source (root not empty)
 *   2. ItemList + per-repo SoftwareSourceCode JSON-LD present
 *   3. hero count == counted cards
 *   4. shared data-repo-card on BOTH tiers: featured(7) + grid == total == hero
 *   5. all 7 featured links are the verified PUBLIC URLs; zero apex/private link
 * Exits non-zero on any failure so it can gate the build. ASCII + utf-8.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, "..", "dist", "index.html"), "utf8");

const EXPECTED_FEATURED = [
  "core-governance-spec", "cloud-identity-spec", "attestation-spec", "trust-boundary-spec",
  "audit-stream-py", "kg-token-validator", "kinetic-gain-embedded",
].map((n) => "https://github.com/mizcausevic-dev/" + n);
const APEX = "github.com/mizcausevic-dev/kineticgain-com-apex";

const count = (re) => (html.match(re) || []).length;
const totalCards = count(/data-repo-card=/g);
const featuredCards = count(/data-repo-card="featured"/g);
const gridCards = count(/data-repo-card="grid"/g);
const heroMatch = html.match(/data-cleaned-count="(\d+)"/);
const heroCount = heroMatch ? Number(heroMatch[1]) : NaN;
const rootEmpty = html.includes('<div id="root"></div>');
const allFeaturedPresent = EXPECTED_FEATURED.every((u) => html.includes(u));
const apexAbsent = !html.includes(APEX);

const checks = [
  ["1 cards in static source (root not empty)", totalCards > 0 && !rootEmpty,
    `totalCards=${totalCards} rootEmpty=${rootEmpty}`],
  ["2 ItemList + SoftwareSourceCode JSON-LD present",
    html.includes('"@type":"ItemList"') && html.includes('"SoftwareSourceCode"'),
    `ItemList=${html.includes('"@type":"ItemList"')} SWSC=${html.includes('"SoftwareSourceCode"')}`],
  ["3 hero count == counted cards", Number.isFinite(heroCount) && heroCount === totalCards,
    `hero=${heroCount} cards=${totalCards}`],
  ["4 featured(7)+grid == total == hero", featuredCards === 7 && featuredCards + gridCards === totalCards && totalCards === heroCount,
    `featured=${featuredCards} grid=${gridCards} total=${totalCards} hero=${heroCount}`],
  ["5 all 7 featured links public, zero apex/private", allFeaturedPresent && apexAbsent,
    `allPublicPresent=${allFeaturedPresent} apexAbsent=${apexAbsent}`],
];

let failed = 0;
for (const [name, pass, detail] of checks) {
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}  [${detail}]`);
  if (!pass) failed++;
}
console.log(failed === 0 ? "\nACCEPTANCE: ALL PASS" : `\nACCEPTANCE: ${failed} CHECK(S) FAILED`);
process.exit(failed === 0 ? 0 : 1);
