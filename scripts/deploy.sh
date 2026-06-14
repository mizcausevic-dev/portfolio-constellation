#!/usr/bin/env bash
#
# portfolio-constellation deploy escape-hatch. Ships FRESH data every deploy:
# refresh -> build -> tar-over-SSH upload. Host/key/user/REMOTE resolution is
# copied verbatim from the apex scripts/local-sftp-deploy.sh (the proven path
# that put 683 cards live at portfolio.kineticgain.com). When Hostinger rotates
# the IP, override via HOSTINGER_FTP_HOST -- same mechanism as the apex script.
#
set -euo pipefail

SSH_KEY="${HOME}/.ssh/kineticgain_ed25519"
SSH_USER="${HOSTINGER_FTP_USER:-u815783393}"
SSH_HOST="${HOSTINGER_FTP_HOST:-82.25.89.47}"
SSH_PORT="${HOSTINGER_FTP_PORT:-65002}"
REMOTE="${HOSTINGER_REMOTE_BASE:-domains/kineticgain.com/public_html}/portfolio"

[ -f "$SSH_KEY" ] || { echo "FAIL: SSH key not found at $SSH_KEY"; exit 2; }

# refresh leaves repos.json updated in-tree; commit it to record the snapshot, or discard - it regenerates.
echo "[1/3] refresh snapshot (gh api -> src/data/repos.json)"
npm run refresh

echo "[2/3] build (tsc + vite + prerender + acceptance gate)"
npm run build

echo "[3/3] upload dist/ -> ${SSH_USER}@${SSH_HOST}:${REMOTE}/ (additive tar, preserves server-side CNAME)"
cd dist
tar --exclude='.DS_Store' -czf - . | ssh -i "$SSH_KEY" \
    -o StrictHostKeyChecking=accept-new \
    -o ConnectTimeout=30 \
    -o ServerAliveInterval=15 \
    -p "$SSH_PORT" \
    "${SSH_USER}@${SSH_HOST}" \
    "cd '${REMOTE}/' && tar -xzf - && echo DEPLOY_EXTRACTED && ls -la index.html | head -1"
echo "OK: portfolio deploy complete"
