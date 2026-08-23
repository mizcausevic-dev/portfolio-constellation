#!/usr/bin/env bash
#
# portfolio-constellation deploy escape-hatch: refresh -> build -> preflight
# -> tar-over-SSH upload -> verify. Host/key/user/REMOTE resolution is copied
# verbatim from the apex scripts/local-sftp-deploy.sh (the proven path that
# put 683 cards live at portfolio.kineticgain.com). When Hostinger rotates
# the IP, override via HOSTINGER_FTP_HOST -- same mechanism as the apex script.
#
# Gates (scripts/deploy_guard.py, repo-local copy of the estate's
# preflight-security guard):
#   --preflight dist   before upload, allowlists web-servable extensions
#   --verify <url>     after upload, probes the live host for source leaks
# Both exit non-zero on failure, so `set -e` below stops the pipeline.
#
# Usage:
#   bash scripts/deploy.sh                 # full deploy: fresh data + rebuild + ship
#   bash scripts/deploy.sh --skip-refresh   # code-only deploy: keep the last-committed
#                                           # src/data/repos.json, don't re-pull GitHub.
#                                           # Use this for a change scoped to one
#                                           # component/section so a deploy doesn't
#                                           # also shift every repo count on the page.
#
set -euo pipefail

SKIP_REFRESH=0
for arg in "$@"; do
  case "$arg" in
    --skip-refresh) SKIP_REFRESH=1 ;;
    *) echo "FAIL: unknown flag '$arg' (only --skip-refresh is supported)"; exit 1 ;;
  esac
done

SSH_KEY="${HOME}/.ssh/kineticgain_ed25519"
SSH_USER="${HOSTINGER_FTP_USER:-u815783393}"
SSH_HOST="${HOSTINGER_FTP_HOST:-82.25.89.47}"
SSH_PORT="${HOSTINGER_FTP_PORT:-65002}"
REMOTE="${HOSTINGER_REMOTE_BASE:-domains/kineticgain.com/public_html}/portfolio"
BASE_URL="https://portfolio.kineticgain.com"

PY="$(command -v python3 || command -v python || true)"
[ -n "$PY" ] || { echo "FAIL: no python3/python on PATH -- required for scripts/deploy_guard.py"; exit 2; }
[ -f "$SSH_KEY" ] || { echo "FAIL: SSH key not found at $SSH_KEY"; exit 2; }

if [ "$SKIP_REFRESH" -eq 1 ]; then
  echo "[1/4] skip refresh (--skip-refresh): keeping last-committed src/data/repos.json"
else
  # refresh leaves repos.json updated in-tree; commit it to record the snapshot, or discard - it regenerates.
  echo "[1/4] refresh snapshot (gh api -> src/data/repos.json)"
  npm run refresh
fi

echo "[2/4] build (tsc + vite + prerender + acceptance gate)"
npm run build

echo "[3/4] preflight guard (allowlist web-servable files in dist/)"
"$PY" scripts/deploy_guard.py --preflight dist

echo "[4/4] upload dist/ -> ${SSH_USER}@${SSH_HOST}:${REMOTE}/ (additive tar, preserves server-side CNAME)"
(
  cd dist
  tar --exclude='.DS_Store' -czf - . | ssh -i "$SSH_KEY" \
      -o StrictHostKeyChecking=accept-new \
      -o ConnectTimeout=30 \
      -o ServerAliveInterval=15 \
      -p "$SSH_PORT" \
      "${SSH_USER}@${SSH_HOST}" \
      "cd '${REMOTE}/' && tar -xzf - && echo DEPLOY_EXTRACTED && ls -la index.html | head -1"
)

echo "[verify] post-deploy guard (probe live host for source leaks)"
"$PY" scripts/deploy_guard.py --verify "$BASE_URL"

echo "OK: portfolio deploy complete"
