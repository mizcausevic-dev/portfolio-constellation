import { describe, expect, it } from "vitest";
import { clustersFor, freshness, verticalsFor } from "../classifier";
import type { Repo } from "../types";

function repo(over: Partial<Repo>): Repo {
  return {
    name: "x",
    description: "",
    url: "https://github.com/mizcausevic-dev/x",
    language: null,
    topics: [],
    pushed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    stars: 0,
    forks: 0,
    archived: false,
    fork: false,
    homepage: null,
    license: null,
    ...over,
  };
}

describe("clustersFor", () => {
  it("classifies a Kinetic Gain spec repo into kg-suite", () => {
    expect(clustersFor(repo({ name: "aeo-protocol-spec" }))).toContain("kg-suite");
  });

  it("classifies an implementation repo into kg-implementation", () => {
    expect(clustersFor(repo({ name: "policy-as-code-engine" }))).toContain("kg-implementation");
  });

  it("classifies an aeo-sdk-* repo into aeo-stack", () => {
    expect(clustersFor(repo({ name: "aeo-sdk-rust" }))).toContain("aeo-stack");
  });

  it("classifies an agent-* repo into agent-ops", () => {
    expect(clustersFor(repo({ name: "agent-router" }))).toContain("agent-ops");
  });

  it("classifies reliability primitives into platform-reliability", () => {
    expect(clustersFor(repo({ name: "reliability-toolkit-rs" }))).toContain("platform-reliability");
  });

  it("classifies decision-intelligence repos correctly", () => {
    expect(clustersFor(repo({ name: "procurement-decision-api" }))).toContain("decision-intelligence");
  });

  it("classifies Pulse engine into industry-telemetry", () => {
    expect(clustersFor(repo({ name: "procurement-pulse-engine" }))).toContain("industry-telemetry");
  });

  it("cross-lists ai-procurement-decision-spec into kg-suite + industry-telemetry", () => {
    const out = clustersFor(repo({ name: "ai-procurement-decision-spec" }));
    expect(out).toContain("kg-suite");
    expect(out).toContain("industry-telemetry");
  });

  it("classifies clinical operator surfaces into healthtech-stack", () => {
    expect(clustersFor(repo({ name: "gxp-change-control-board" }))).toContain("healthtech-stack");
    expect(clustersFor(repo({ name: "fda-samd-classification-board" }))).toContain("healthtech-stack");
    expect(clustersFor(repo({ name: "patient-consent-audit-stream" }))).toContain("healthtech-stack");
  });

  it("classifies Klaviyo / VWO / attribution repos into growth-ops", () => {
    expect(clustersFor(repo({ name: "klaviyo-flow-consent-audit" }))).toContain("growth-ops");
    expect(clustersFor(repo({ name: "vwo-experiment-governance-mirror" }))).toContain("growth-ops");
    expect(clustersFor(repo({ name: "kg-utm-attribution" }))).toContain("growth-ops");
    expect(clustersFor(repo({ name: "growth-systems-control-room" }))).toContain("growth-ops");
  });

  it("classifies buyer-diligence-response repos into sales-enablement", () => {
    expect(clustersFor(repo({ name: "vendor-proof-gap-monitor" }))).toContain("sales-enablement");
    expect(clustersFor(repo({ name: "trust-center-evidence-room" }))).toContain("sales-enablement");
    expect(clustersFor(repo({ name: "security-questionnaire-answer-studio" }))).toContain("sales-enablement");
    expect(clustersFor(repo({ name: "rfp-response-assembler" }))).toContain("sales-enablement");
  });

  it("falls back to mcp-family for unknown mcp-prefixed repos by topic", () => {
    const r = repo({ name: "mcp-some-new-thing", topics: ["mcp"] });
    expect(clustersFor(r)).toContain("mcp-family");
  });

  it("falls back to frontend-showcase for orphan TypeScript dashboards", () => {
    const r = repo({
      name: "some-internal-control-room",
      language: "TypeScript",
      topics: ["control-plane", "frontend"],
    });
    expect(clustersFor(r)).toContain("frontend-showcase");
  });

  it("returns empty for a generic repo with no matches", () => {
    expect(clustersFor(repo({ name: "totally-random-name", topics: [] }))).toEqual([]);
  });

  it("repos can belong to multiple clusters", () => {
    // audit-stream-py is both kg-implementation and platform-reliability.
    const out = clustersFor(repo({ name: "audit-stream-py" }));
    expect(out).toContain("kg-implementation");
    expect(out).toContain("platform-reliability");
  });
});

describe("verticalsFor", () => {
  it("classifies edtech repos by topic", () => {
    expect(verticalsFor(repo({ name: "x", topics: ["edtech"] }))).toContain("edtech");
  });
  it("classifies fintech repos by topic", () => {
    expect(verticalsFor(repo({ name: "x", topics: ["payments"] }))).toContain("fintech");
  });
  it("classifies real-estate repos by name when topics are sparse", () => {
    expect(verticalsFor(repo({ name: "showing-followup-orchestrator" }))).toContain("real-estate");
  });
  it("classifies bodyforge into robotics by name", () => {
    expect(verticalsFor(repo({ name: "bodyforge" }))).toContain("robotics");
  });
  it("classifies skyforge into aerospace by name", () => {
    expect(verticalsFor(repo({ name: "skyforge" }))).toContain("aerospace");
  });
  it("classifies biotech diagnostics repos by name when topics are sparse", () => {
    expect(verticalsFor(repo({ name: "specimen-chain-of-custody-console" }))).toContain("biotech-diagnostics");
  });
  it("classifies nonprofit ops repos by name when topics are sparse", () => {
    expect(verticalsFor(repo({ name: "grant-compliance-evidence-desk" }))).toContain("nonprofit-foundation");
  });
  it("classifies hr-tech repos by name when topics are sparse", () => {
    expect(verticalsFor(repo({ name: "ukg-workforce-disclosure-mirror" }))).toContain("hr-tech-employment-ai");
  });
  it("classifies public-sector repos by name when topics are sparse", () => {
    expect(verticalsFor(repo({ name: "gov-comment-ingestor" }))).toContain("govtech-public-sector-ai");
  });
});

describe("freshness", () => {
  const now = Date.parse("2026-05-15T20:00:00Z");

  it("returns live for repos pushed in the last 24h", () => {
    const pushed = new Date(now - 3600_000).toISOString();
    expect(freshness(repo({ pushed_at: pushed }), now)).toBe("live");
  });

  it("returns active for repos pushed in the last 7d", () => {
    const pushed = new Date(now - 5 * 86_400_000).toISOString();
    expect(freshness(repo({ pushed_at: pushed }), now)).toBe("active");
  });

  it("returns recent for repos pushed in the last 30d", () => {
    const pushed = new Date(now - 20 * 86_400_000).toISOString();
    expect(freshness(repo({ pushed_at: pushed }), now)).toBe("recent");
  });

  it("returns dormant for older repos", () => {
    const pushed = new Date(now - 90 * 86_400_000).toISOString();
    expect(freshness(repo({ pushed_at: pushed }), now)).toBe("dormant");
  });

  it("returns archived when archived=true regardless of pushed date", () => {
    const pushed = new Date(now - 3600_000).toISOString();
    expect(freshness(repo({ pushed_at: pushed, archived: true }), now)).toBe("archived");
  });
});
