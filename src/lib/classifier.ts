/**
 * Repo → cluster + vertical classification.
 *
 * Two-stage logic:
 *   1. NAMED_CLUSTERS — explicit repo-name allowlists for tightly-defined
 *      platforms (Kinetic Gain Suite, AEO Reference Stack, etc.). When a repo
 *      is in one of these lists, that's the authoritative assignment.
 *   2. TOPIC + NAME HEURISTICS — for the long tail (Codex-generated repos,
 *      portfolio shrapnel), we fall back to GitHub topic tags + name prefixes.
 *
 * Repos can belong to multiple clusters and multiple verticals. The "primary"
 * cluster used for grouping is the FIRST match — order matters in the tables
 * below.
 */
import type { Cluster, Repo, Vertical } from "./types";

/* --------------------------------------------------------------------------
 * Tight, named clusters — explicit allowlists.
 *
 * Strategy: name-based matches read like a curator's hand. We keep these
 * narrow on purpose; the topic-based fallback below covers the long tail.
 * ------------------------------------------------------------------------ */

const KG_SUITE_SPECS: ReadonlySet<string> = new Set([
  "kinetic-gain-protocol-suite",
  "aeo-protocol-spec",
  "agent-cards-spec",
  "prompt-provenance-spec",
  "ai-evidence-format-spec",
  "mcp-tool-card-spec",
  "ai-tutor-card-spec",
  "student-ai-disclosure-spec",
  "classroom-ai-aup-spec",
  "clinical-ai-disclosure-spec",
  "ai-incident-card-spec",
  "ai-procurement-decision-spec",
]);

const KG_IMPLEMENTATION: ReadonlySet<string> = new Set([
  "procurement-decision-api",
  "policy-as-code-engine",
  "data-contract-registry",
  "audit-stream-py",
  "audit-stream-prometheus",
  "aeo-validator-service",
  "aeo-graph-explorer-rs",
  "hash-attestation-rs",
  "incident-correlation-rs",
  "reliability-toolkit-rs",
  "feature-flag-rs",
  "request-shadow-rs",
  "csv-data-quality-rs",
  "slo-budget-tracker",
  "kg-governance-dashboard",
  "kg-hosted-validator",
  "kg-validate-action",
  "aeo-registry",
]);

const AEO_STACK: ReadonlySet<string> = new Set([
  "aeo-sdk-python",
  "aeo-sdk-typescript",
  "aeo-sdk-rust",
  "aeo-sdk-go",
  "aeo-sdk-swift",
  "aeo-cli",
  "aeo-crawler",
  "aeo-validator-service",
  "aeo-graph-explorer-rs",
  "aeo-linter",
  "aeo-registry",
  "aeo-visualizer",
  "mcp-aeo-server",
]);

const PLATFORM_RELIABILITY: ReadonlySet<string> = new Set([
  "reliability-toolkit-rs",
  "feature-flag-rs",
  "request-shadow-rs",
  "slo-budget-tracker",
  "audit-stream-py",
  "hash-attestation-rs",
  "mcp-reliability-toolkit",
  "rate-limit-shield",
  "error-budget-allocator",
  "reliability-policy-coordinator",
  "release-readiness-gatekeeper",
  "latency-budget-enforcer",
  "latency-distribution-analyzer",
  "grpc-mesh-shadow",
  "wasm-policy-gateway",
  "dependency-drift-watch",
  "support-escalation-router",
]);

const DECISION_INTELLIGENCE: ReadonlySet<string> = new Set([
  "procurement-decision-api",
  "policy-as-code-engine",
  "data-contract-registry",
  "incident-correlation-rs",
  "mcp-decision-intelligence",
  "decision-memory-engine",
  "policy-decision-simulator",
  "briefing-intelligence-engine",
  "executive-briefing-studio",
  "scenario-planning-atlas",
  "evidence-ranking-engine",
]);

const INDUSTRY_TELEMETRY: ReadonlySet<string> = new Set([
  "procurement-pulse-engine",
  "procurement-pulse-landing",
  "procurement-pulse-action",
  "ai-procurement-decision-spec",
  "well-known-probe-js",
  "vendor-ai-disclosure-inspector",
]);

const HEALTHTECH_STACK: ReadonlySet<string> = new Set([
  "clinical-ai-disclosure-spec",
  "clinical-event-narrative-review-board",
  "gxp-change-control-board",
  "specimen-chain-of-custody-console",
  "batch-deviation-capa-ledger",
  "lab-instrument-change-audit",
  "assay-release-readiness-board",
  "diagnostic-qc-evidence-router",
  "trial-protocol-deviation-monitor",
  "prior-authorization-evidence-router",
  "patient-consent-audit-stream",
  "fhir-resource-access-audit",
  "fhir-resource-access-audit-reference",
  "fda-samd-classification-board",
  "clinical-bias-cohort-coverage-lab",
  "medical-adverse-event-incident-card",
  "hipaa-readiness-evidence-bundle",
  "phi-vault-contract-profile",
]);

const GROWTH_OPS: ReadonlySet<string> = new Set([
  "growth-systems-control-room",
  "klaviyo-flow-consent-audit",
  "vwo-experiment-governance-mirror",
  "martech-experiment-evidence-stack",
  "wordpress-member-journey-consent-kit",
  "kg-skyyflow-klaviyo-bridge",
  "skyyflow-klaviyo-bridge-console",
  "kg-utm-attribution",
  "conversion-funnel-intelligence-hub",
  "kafka-real-time-attribution",
  "attribution-warehouse-lab",
  "revenue-cohort-modeler",
  "attribution-intelligence-studio",
  "identity-lifecycle-workbench",
  "ab-testing-command-center",
  "pricing-experiment-studio",
  "experimentation_insights_kpi",
  "customer-health-churn-api",
  "tableau-permission-audit-lab",
  "campaign-taxonomy-governor",
]);

const SALES_ENABLEMENT: ReadonlySet<string> = new Set([
  "vendor-proof-gap-monitor",
  "trust-center-evidence-room",
  "security-questionnaire-answer-studio",
  "rfp-response-assembler",
]);

const AGENT_OPS: ReadonlySet<string> = new Set([
  "agent-router",
  "agent-canary",
  "agent-eval-arena",
  "agent-codex",
  "agentobserve",
  "agentobserve-dashboard",
  "ai-finops-radar",
  "ai-operations-console",
  "ai-governance-review-studio",
  "model-registry-pro",
  "model-risk-oversight-hub",
  "llm-redaction-gateway",
  "rag-sentinel",
  "rag-sentinel-dashboard",
  "mcp-sentinel",
  "mcp-sentinel-dashboard",
  "identity-mesh",
  "shadow-ai-detector",
  "prompt-injection-bench",
  "prompt-injection-bench-web",
  "embedding-drift-graph",
  "zig-agent-graph-db",
  "kinetic-flightdeck",
]);

/* --------------------------------------------------------------------------
 * Topic-based heuristics — for everything else.
 * ------------------------------------------------------------------------ */

const TOPIC_HINTS: Array<{ cluster: Cluster; topics: ReadonlySet<string>; namePrefix?: string[] }> = [
  {
    cluster: "mcp-family",
    topics: new Set(["mcp", "model-context-protocol"]),
    namePrefix: ["mcp-"],
  },
  {
    cluster: "landing",
    topics: new Set([]),
    // Landing-style repos: small static sites + "-landing" suffix.
    namePrefix: ["-landing"],
  },
];

const VERTICAL_HINTS: Array<{ vertical: Vertical; topics: string[] }> = [
  {
    vertical: "edtech",
    topics: ["edtech", "education", "ferpa", "coppa", "higher-education", "advising", "student-success", "curriculum"],
  },
  {
    vertical: "healthtech",
    topics: ["healthtech", "hipaa", "fda", "samd", "fhir", "clinical-ai", "patient-flow", "population-health"],
  },
  {
    vertical: "biotech-diagnostics",
    topics: [
      "biotech",
      "diagnostics",
      "laboratory-operations",
      "gxp",
      "gmp",
      "glp",
      "gcp",
      "capa",
      "chain-of-custody",
      "pharmacovigilance",
      "meddra",
      "clinical-trials",
      "quality-control",
      "batch-release",
    ],
  },
  {
    vertical: "fintech",
    topics: ["fintech", "payments", "pci-dss", "billing", "finops", "fraud"],
  },
  {
    vertical: "insurance-insurtech",
    topics: ["insurance", "insurtech", "claims", "underwriting", "policy-admin", "loss-ratio", "naic"],
  },
  {
    vertical: "nonprofit-foundation",
    topics: ["nonprofit", "foundation-ops", "grant-compliance", "fundraising", "donor-ops", "program-outcomes"],
  },
  {
    vertical: "hr-tech-employment-ai",
    topics: ["hr-tech", "workforce-ops", "employee-comms", "employment-ai", "ukg", "human-capital"],
  },
  {
    vertical: "govtech-public-sector-ai",
    topics: ["govtech", "public-sector-ai", "government-ops", "state-disclosure", "federal-ai", "civic-tech"],
  },
  {
    vertical: "real-estate",
    topics: ["real-estate", "proptech", "brokerage"],
  },
  {
    vertical: "aerospace",
    topics: ["aerospace", "drone-delivery", "urban-air-mobility", "space-operations", "autonomous-systems"],
  },
  {
    vertical: "robotics",
    topics: ["robotics", "industrial-ai", "human-robot-interaction"],
  },
  {
    vertical: "iam-security",
    topics: [
      "iam",
      "identity-governance",
      "cyberark",
      "spiffe",
      "workload-identity",
      "zero-trust",
      "security-operations",
      "ai-security",
      "cybersecurity",
      "data-loss-prevention",
      "pii-redaction",
    ],
  },
  {
    vertical: "platform-engineering",
    topics: [
      "platform-engineering",
      "sre",
      "reliability",
      "reliability-engineering",
      "observability",
      "release-engineering",
      "sla",
      "slo",
      "rate-limiter",
      "circuit-breaker",
    ],
  },
  {
    vertical: "data-engineering",
    topics: [
      "data-engineering",
      "data-quality",
      "data-governance",
      "data-contract",
      "data-warehouse",
      "analytics-engineering",
      "data-catalog",
      "dbt",
      "data-modeling",
    ],
  },
  {
    vertical: "ai-platform",
    topics: [
      "ai-platform",
      "ai-governance",
      "ai-safety",
      "ai-agents",
      "ml-ops",
      "mlops",
      "llm-monitoring",
      "rag",
      "agent-observability",
      "vector-database",
      "decision-intelligence",
    ],
  },
  {
    vertical: "compliance-governance",
    topics: [
      "compliance",
      "audit",
      "audit-trail",
      "audit-log",
      "tamper-evident",
      "governance",
      "policy-as-code",
      "policy-engine",
      "evidence",
    ],
  },
  {
    vertical: "revenue-ops",
    topics: [
      "revenue-operations",
      "revops",
      "saas",
      "growth-analytics",
      "growth-operations",
      "attribution",
      "experimentation",
      "ab-testing",
      "kpi",
      "monetization",
      "forecasting",
      "channel-sales",
    ],
  },
];

/* --------------------------------------------------------------------------
 * Public API
 * ------------------------------------------------------------------------ */

export function clustersFor(repo: Repo): Cluster[] {
  const tags = new Set<Cluster>();
  if (KG_SUITE_SPECS.has(repo.name)) tags.add("kg-suite");
  if (KG_IMPLEMENTATION.has(repo.name)) tags.add("kg-implementation");
  if (AEO_STACK.has(repo.name)) tags.add("aeo-stack");
  if (AGENT_OPS.has(repo.name)) tags.add("agent-ops");
  if (PLATFORM_RELIABILITY.has(repo.name)) tags.add("platform-reliability");
  if (DECISION_INTELLIGENCE.has(repo.name)) tags.add("decision-intelligence");
  if (INDUSTRY_TELEMETRY.has(repo.name)) tags.add("industry-telemetry");
  if (HEALTHTECH_STACK.has(repo.name)) tags.add("healthtech-stack");
  if (GROWTH_OPS.has(repo.name)) tags.add("growth-ops");
  if (SALES_ENABLEMENT.has(repo.name)) tags.add("sales-enablement");

  for (const hint of TOPIC_HINTS) {
    if (matchTopics(repo, hint.topics)) {
      tags.add(hint.cluster);
      continue;
    }
    if (hint.namePrefix) {
      for (const prefix of hint.namePrefix) {
        if (prefix.startsWith("-") ? repo.name.endsWith(prefix.slice(1)) : repo.name.startsWith(prefix)) {
          tags.add(hint.cluster);
          break;
        }
      }
    }
  }

  // Frontend-showcase fallback: standalone React / TypeScript dashboards
  // that don't belong to any of the tighter platforms.
  if (
    tags.size === 0 &&
    repo.language === "TypeScript" &&
    (repo.topics.includes("react") || repo.topics.includes("frontend") || repo.topics.includes("dashboard") || repo.topics.includes("control-plane") || repo.topics.includes("command-center"))
  ) {
    tags.add("frontend-showcase");
  }

  return [...tags];
}

export function verticalsFor(repo: Repo): Vertical[] {
  const out = new Set<Vertical>();
  const topics = new Set(repo.topics.map((t) => t.toLowerCase()));
  for (const hint of VERTICAL_HINTS) {
    for (const t of hint.topics) {
      if (topics.has(t)) {
        out.add(hint.vertical);
        break;
      }
    }
  }
  // Name-only heuristics for repos with stub topics.
  const n = repo.name.toLowerCase();
  if (/\bcyberark|identity|access|tenant|secret\b/.test(n)) out.add("iam-security");
  if (/\b(ukg|employee|workforce|employment)\b/.test(n)) out.add("hr-tech-employment-ai");
  if (/\b(grant|donor|stewardship|appeal|outcome)\b/.test(n)) out.add("nonprofit-foundation");
  if (/\b(claim|underwriting|policyholder|insur|loss|reserve)\b/.test(n)) out.add("insurance-insurtech");
  if (/\b(government|gov-comment|public-sector|citizen|state-|omb|procurement-pulse)\b/.test(n)) out.add("govtech-public-sector-ai");
  if (/\bclinical|patient|care-pathway|learner\b/.test(n)) {
    if (/\blearner\b/.test(n)) out.add("edtech");
    else out.add("healthtech");
  }
  if (/\b(assay|diagnostic|specimen|capa|gxp|pharmacovigilance|narrative|lab-instrument|trial-protocol|batch-deviation)\b/.test(n)) {
    out.add("biotech-diagnostics");
  }
  if (/\b(showing|lead-routing|property)\b/.test(n) && !/\bsearch\b/.test(n)) out.add("real-estate");
  if (/\b(skyforge|orbitforge)\b/.test(n)) out.add("aerospace");
  if (/\b(bodyforge|robot|sensor-health|override)\b/.test(n)) out.add("robotics");
  return [...out];
}

function matchTopics(repo: Repo, topics: ReadonlySet<string>): boolean {
  if (topics.size === 0) return false;
  for (const t of repo.topics) {
    if (topics.has(t)) return true;
  }
  return false;
}

/**
 * "How long since the last push" — in milliseconds. Used to dim stale repos
 * and surface fresh ones at the top.
 */
export function ageMs(repo: Repo, now: number = Date.now()): number {
  const t = Date.parse(repo.pushed_at);
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : now - t;
}

export type Freshness = "live" | "active" | "recent" | "dormant" | "archived";

export function freshness(repo: Repo, now: number = Date.now()): Freshness {
  if (repo.archived) return "archived";
  const age = ageMs(repo, now);
  if (age < 24 * 3600 * 1000) return "live";
  if (age < 7 * 24 * 3600 * 1000) return "active";
  if (age < 30 * 24 * 3600 * 1000) return "recent";
  return "dormant";
}
