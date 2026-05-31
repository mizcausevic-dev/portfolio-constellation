/**
 * Compact repo shape as stored in `src/data/repos.json` and consumed by the
 * dashboard. Mirrors the projection emitted by `scripts/refresh-snapshot.mjs`.
 */
export interface Repo {
  name: string;
  description: string;
  url: string;
  language: string | null;
  topics: string[];
  pushed_at: string;
  updated_at: string;
  created_at: string;
  stars: number;
  forks: number;
  archived: boolean;
  fork: boolean;
  homepage: string | null;
  license: string | null;
}

export interface Snapshot {
  user: string;
  generated_at: string;
  total: number;
  repos: Repo[];
}

/** All the named "platforms" the classifier can tag a repo with. */
export type Cluster =
  | "kg-suite"
  | "kg-implementation"
  | "aeo-stack"
  | "agent-ops"
  | "platform-reliability"
  | "decision-intelligence"
  | "industry-telemetry"
  | "healthtech-stack"
  | "growth-ops"
  | "sales-enablement"
  | "executive-intelligence"
  | "mcp-family"
  | "landing"
  | "frontend-showcase";

/** Industry verticals the classifier recognises. */
export type Vertical =
  | "edtech"
  | "healthtech"
  | "biotech-diagnostics"
  | "fintech"
  | "insurance-insurtech"
  | "nonprofit-foundation"
  | "hr-tech-employment-ai"
  | "govtech-public-sector-ai"
  | "real-estate"
  | "aerospace"
  | "robotics"
  | "iam-security"
  | "platform-engineering"
  | "data-engineering"
  | "ai-platform"
  | "compliance-governance"
  | "revenue-ops";

export interface ClusterMeta {
  id: Cluster;
  label: string;
  blurb: string;
  /** Hex accent for cards / chips. */
  accent: string;
}

export interface VerticalMeta {
  id: Vertical;
  label: string;
}

export const CLUSTERS: Record<Cluster, ClusterMeta> = {
  "kg-suite": {
    id: "kg-suite",
    label: "Kinetic Gain Protocol Suite",
    blurb:
      "Eleven open JSON specs for the answer-engine and agent era. Spec text + JSON Schema + canonical examples per repo.",
    accent: "#10b981",
  },
  "kg-implementation": {
    id: "kg-implementation",
    label: "Kinetic Gain Implementation Stack",
    blurb:
      "Software that consumes the Suite specs: drafters, validators, policy engines, registries, attestation, audit-stream, MCP servers.",
    accent: "#34d399",
  },
  "aeo-stack": {
    id: "aeo-stack",
    label: "AEO Reference Stack",
    blurb:
      "Five-layer reference implementation for the AEO Protocol: SDKs across five languages, a CLI, a BFS crawler, an always-on validator service, and an HTTP graph-query service.",
    accent: "#22d3ee",
  },
  "agent-ops": {
    id: "agent-ops",
    label: "Agent Operations Suite",
    blurb:
      "Production primitives for AI agent fleets: routing, eval gates, canary rollout, governance-as-code, observability, identity, redaction.",
    accent: "#818cf8",
  },
  "platform-reliability": {
    id: "platform-reliability",
    label: "Platform Reliability Stack",
    blurb:
      "Async reliability primitives + SRE math: rate limiter, circuit breaker, retry, bulkhead, SLO + error-budget tracker, request shadowing.",
    accent: "#fbbf24",
  },
  "decision-intelligence": {
    id: "decision-intelligence",
    label: "Decision Intelligence",
    blurb:
      "Buyer-side governance: Decision Cards → PolicyBundles → live request enforcement → contract ownership → incident remediation graphs.",
    accent: "#f472b6",
  },
  "industry-telemetry": {
    id: "industry-telemetry",
    label: "AI Procurement Pulse",
    blurb:
      "Industry telemetry — a quarterly, ed25519-signed measurement product. Crawls a 1,400+ domain universe across 38 verticals to score AI-procurement disclosure depth and publishes the deltas as public Issues.",
    accent: "#14b8a6",
  },
  "healthtech-stack": {
    id: "healthtech-stack",
    label: "HealthTech / Clinical Stack",
    blurb:
      "Clinical + GxP-territory depth: FDA SaMD, HIPAA-readiness, FHIR access audits, CAPA + batch deviation, specimen chain-of-custody, trial-protocol drift, and adverse-event incident cards.",
    accent: "#84cc16",
  },
  "growth-ops": {
    id: "growth-ops",
    label: "Growth & Consent Operations",
    blurb:
      "Marketing, consent, and attribution governance at growth.kineticgain.com: Klaviyo consent audits, VWO experiment governance, martech evidence stacks, tokenized PII bridges, UTM attribution, and identity-lifecycle workbenches.",
    accent: "#f97316",
  },
  "sales-enablement": {
    id: "sales-enablement",
    label: "Sales Enablement Stack",
    blurb:
      "Buyer-diligence-response surfaces — the seller-side counterpart to the buyer-trust tooling at /trust/. Vendor proof-gap monitoring, trust-center evidence rooms, security-questionnaire answer studios, RFP response assembly. Readiness/posture framed, never certified.",
    accent: "#ec4899",
  },
  "executive-intelligence": {
    id: "executive-intelligence",
    label: "Executive Intelligence Stack",
    blurb:
      "Board-prep + investor-facing operator surfaces — Boardroom Sparring Partner (Q&A rehearsal), Category Thesis Builder (investor narrative), Exit Room (diligence gaps), Brand Governance Styleguide (CSS-first brand approvals), Release Readiness Shell Kit (launch + freeze posture). Survivors of the exec-family expansion triage; 4 overlapping siblings were archived.",
    accent: "#a3e635",
  },
  "mcp-family": {
    id: "mcp-family",
    label: "MCP Servers",
    blurb:
      "Model Context Protocol servers exposing portfolio capabilities as Claude-callable tools. One config entry per server.",
    accent: "#a78bfa",
  },
  landing: {
    id: "landing",
    label: "Landing Sites",
    blurb:
      "Per-spec landing pages, gallery / directory / hub sites — the public face of the suite at *.kineticgain.com.",
    accent: "#fb7185",
  },
  "frontend-showcase": {
    id: "frontend-showcase",
    label: "Frontend Showcase",
    blurb:
      "Standalone React / Vue / TypeScript apps demonstrating dashboards, control rooms, command centers, and operator surfaces.",
    accent: "#60a5fa",
  },
};

export const VERTICALS: Record<Vertical, VerticalMeta> = {
  edtech: { id: "edtech", label: "EdTech" },
  healthtech: { id: "healthtech", label: "HealthTech" },
  "biotech-diagnostics": { id: "biotech-diagnostics", label: "Biotech / Diagnostics" },
  fintech: { id: "fintech", label: "FinTech" },
  "insurance-insurtech": { id: "insurance-insurtech", label: "Insurance / InsurTech" },
  "nonprofit-foundation": { id: "nonprofit-foundation", label: "Nonprofit / Foundation Ops" },
  "hr-tech-employment-ai": { id: "hr-tech-employment-ai", label: "HR Tech / Employment AI" },
  "govtech-public-sector-ai": { id: "govtech-public-sector-ai", label: "GovTech / Public Sector AI" },
  "real-estate": { id: "real-estate", label: "PropTech / Real Estate" },
  aerospace: { id: "aerospace", label: "Aerospace / Drones" },
  robotics: { id: "robotics", label: "Robotics" },
  "iam-security": { id: "iam-security", label: "IAM / Security" },
  "platform-engineering": { id: "platform-engineering", label: "Platform Engineering" },
  "data-engineering": { id: "data-engineering", label: "Data Engineering" },
  "ai-platform": { id: "ai-platform", label: "AI Platform" },
  "compliance-governance": { id: "compliance-governance", label: "Compliance / Governance" },
  "revenue-ops": { id: "revenue-ops", label: "Revenue Operations" },
};
