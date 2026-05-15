# portfolio-constellation

> Live constellation map of one engineer's polyglot public portfolio.

[![CI](https://github.com/mizcausevic-dev/portfolio-constellation/actions/workflows/ci.yml/badge.svg)](https://github.com/mizcausevic-dev/portfolio-constellation/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

**Live at:** [portfolio.kineticgain.com](https://portfolio.kineticgain.com)

## What it does

A scrolling visual atlas of every public repo at
[github.com/mizcausevic-dev](https://github.com/mizcausevic-dev) — 190+ of them
across 20+ languages — classified into the **named platforms** that organise
the work and the **industry verticals** it touches.

Five things the page answers in one scroll:

1. **What's the scale?** Hero band: total repos, languages, named platforms,
   verticals, freshness counts.
2. **What are the platforms?** Cluster cards for the Kinetic Gain Protocol
   Suite, Kinetic Gain Implementation Stack, AEO Reference Stack, Agent
   Operations Suite, Platform Reliability Stack, Decision Intelligence, MCP
   family, Landing sites, Frontend showcase.
3. **What's the language footprint?** Recharts bar chart, one bar per
   language, sorted descending, well-known language colours.
4. **What industries does it cover?** Vertical chips sized by repo count:
   EdTech, HealthTech, FinTech, Real Estate, Aerospace, Robotics, IAM /
   Security, Platform Engineering, Data Engineering, AI Platform, Compliance
   / Governance, Revenue Operations.
5. **What's the full atlas?** A filterable grid of every single repo, with
   search + cluster + vertical + language + freshness filters. Click a
   cluster card / language bar / vertical chip to drive the grid filter.

## Data flow

```
gh api → src/data/repos.json → bundled at build → React renders
                                                       │
                                                       ▼ (after first paint)
                                            GitHub API live refresh
                                            (silent upgrade if newer)
```

The snapshot file is the source of truth at build time so the dashboard paints
instantly and works offline. A scheduled GitHub Action runs every six hours
(see `.github/workflows/refresh-snapshot.yml`) and commits a fresh
`src/data/repos.json` when the public repo list has changed — which then
triggers `deploy.yml` automatically.

On top of the bundled snapshot, the dashboard fires one live GitHub API call
after first paint to upgrade in-place when something has been pushed since the
last snapshot.

## Develop locally

```bash
npm install
npm run dev        # vite dev server on http://localhost:5173
npm run refresh    # re-snapshot repos.json from gh api (needs `gh` cli + auth)
npm run test       # vitest
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run build      # production build into dist/
```

## Deploy

`.github/workflows/deploy.yml` builds + FTPs `dist/` to `/portfolio/` on every
push to `main`. Configure repo secrets `FTP_HOST`, `FTP_USER`, `FTP_PASS`.

Same Hostinger-FTP pattern as the rest of the `*.kineticgain.com` properties.

## Classifier

The interesting bit is `src/lib/classifier.ts`. It assigns each repo to zero
or more named clusters and zero or more industry verticals based on:

- **Named allowlists** for tight platforms (the 11 Kinetic Gain Suite specs,
  the 15-ish KG implementation stack repos, the 5 AEO SDKs + CLI + crawler +
  validator + explorer + registry, the agent-ops family, etc.).
- **Topic-tag heuristics** for the long tail (Codex-generated repos, portfolio
  experiments).
- **Name-prefix heuristics** as a fallback (`mcp-*` → MCP family, `-spec` →
  spec, etc.).

Adding a new repo to a cluster usually means adding its name to one of the
`Set<string>` allowlists in that file. Cheap to maintain, easy to audit.

## License

Apache-2.0. See [LICENSE](LICENSE).
