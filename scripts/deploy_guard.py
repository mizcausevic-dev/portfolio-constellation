#!/usr/bin/env python3
"""deploy_guard.py - refuse to publish source, and prove it after the fact.

Repo-local copy of the estate's preflight-security guard (canonical source:
~/.claude/skills/preflight-security/scripts/deploy_guard.py), so this repo's
deploy path is self-contained and doesn't depend on a machine-local Claude
Code skill directory being present. MUST_404 below is trimmed to this repo's
own files instead of the apex's. Re-sync from the canonical copy if its
detection logic changes.

WHY THIS EXISTS
===============
On 2026-08-21 the kineticgain.com apex was found serving its own deploy
scripts, CI workflow and generate.py at HTTP 200. Three things were true at
once, and this file closes all three:

1. THE OLD EXCLUDE LIST WAS A DENYLIST (scripts/deploy.sh's tar --exclude).
   A denylist is only as good as the last person's imagination; the thing
   that gets published is the thing nobody thought to name.
   -> --preflight uses an ALLOWLIST of extensions that belong on a web
      server. Anything else stops the deploy before upload.

2. THIS REPO'S DEPLOY IS ADDITIVE AND NEVER DELETES (see deploy.sh comment:
   "additive tar, preserves server-side CNAME"). One bad upload is
   permanent; nothing self-heals.
   -> --verify probes the LIVE site for paths that must not resolve, so a
      historical mistake is caught on the next deploy instead of never.

3. EVERY OTHER CHECK IN THIS REPO (typecheck, lint, vitest, the prerender
   acceptance gate in verify-build.mjs) asks "does the right thing work?"
   None of them can ask whether something that should not exist is
   reachable, because none of them requests a URL nothing links to.

USAGE
=====
    python scripts/deploy_guard.py --preflight dist        # before upload
    python scripts/deploy_guard.py --verify https://host   # after upload

Both exit non-zero on failure so `set -e` in deploy.sh stops the pipeline.

--allow-source exists for the rare case of deliberately publishing a source
file. It requires naming each path, so the exception is explicit.
"""
import argparse
import concurrent.futures
import json
import pathlib
import re
import sys
import urllib.error
import urllib.request

# Extensions a web server has a reason to hand a visitor. Everything else is
# refused. Adding to this list should feel like a decision.
WEB_EXT = {
    ".html", ".htm", ".css", ".js", ".mjs", ".json", ".jsonld", ".xml", ".txt",
    ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico", ".bmp",
    ".woff", ".woff2", ".ttf", ".otf", ".eot",
    ".pdf", ".mp4", ".webm", ".mp3", ".wav", ".ogg", ".vtt",
    ".webmanifest", ".map", ".php", ".md",
}
# Files with no extension that are legitimately served.
WEB_NAMES = {".htaccess", "robots.txt", "sitemap.xml", "CNAME", "LICENSE",
             "humans.txt", "llms.txt", "security.txt", "ads.txt"}

# Directories that must never reach a web root, whatever they contain.
FORBIDDEN_DIRS = {"scripts", ".github", ".git", "node_modules", "generated",
                  "staging-root", "tests", "test", "__pycache__", ".venv",
                  "venv", ".idea", ".vscode", ".ssr"}

# Paths that must NOT resolve on portfolio.kineticgain.com. Extend as the
# repo's scripts/ and root-level tooling files change.
MUST_404 = [
    "/scripts/deploy.sh",
    "/scripts/deploy_guard.py",
    "/scripts/refresh-snapshot.mjs",
    "/scripts/prerender.mjs",
    "/scripts/verify-build.mjs",
    "/.github/workflows/deploy.yml",
    "/.github/workflows/ci.yml",
    "/.github/workflows/refresh-snapshot.yml",
    "/README.md",
    "/package.json",
    "/package-lock.json",
    "/tsconfig.json",
    "/vite.config.ts",
    "/.env",
    "/.git/config",
    "/.git/HEAD",
]
# Content that must never appear in a served response, whatever the path.
# Catches the case where a file is renamed or served through a rewrite.
SECRET_PATTERNS = [
    (r"BEGIN [A-Z ]*PRIVATE KEY", "private key material"),
    (r"gh[pousr]_[A-Za-z0-9]{20,}", "GitHub token"),
    (r"AKIA[0-9A-Z]{16}", "AWS access key id"),
    (r"sk-[A-Za-z0-9]{20,}", "API secret key"),
]
UA = "kg-deploy-guard/1.0"


# ---------------------------------------------------------------- preflight

def preflight(root: pathlib.Path, allow: set) -> int:
    if not root.is_dir():
        print(f"GUARD FAIL: {root} is not a directory")
        return 2

    bad = []
    n = 0
    for p in sorted(root.rglob("*")):
        if not p.is_file():
            continue
        n += 1
        rel = p.relative_to(root).as_posix()
        if rel in allow:
            continue
        parts = set(p.relative_to(root).parts[:-1])
        hit = parts & FORBIDDEN_DIRS
        if hit:
            bad.append((rel, f"inside forbidden directory '{sorted(hit)[0]}/'"))
            continue
        if p.name in WEB_NAMES:
            continue
        if p.suffix.lower() not in WEB_EXT:
            bad.append((rel, f"extension '{p.suffix or '(none)'}' is not web-servable"))

    print(f"[guard] preflight: {n} file(s) staged in {root}")
    if not bad:
        print("[guard] preflight OK: nothing outside the web-servable allowlist")
        return 0

    print(f"\nGUARD FAIL: {len(bad)} file(s) must not be published:\n")
    for rel, why in bad[:40]:
        print(f"  {rel}")
        print(f"      {why}")
    if len(bad) > 40:
        print(f"  ... and {len(bad) - 40} more")
    print("\nThe deploy was stopped BEFORE upload. Nothing was published.")
    print("Stage only the files you intend to serve, or if one of these really")
    print("belongs on the web, name it explicitly:")
    print("  --allow-source path/one path/two")
    return 1


# ------------------------------------------------------------------- verify

def probe(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, r.read(65536).decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception:
        return 0, ""


def verify(base: str, out_json=None) -> int:
    base = base.rstrip("/")
    print(f"[guard] verify: probing {len(MUST_404)} must-not-exist paths on {base}")

    # Baseline. A single-page app rewrites every unmatched path to index.html
    # and answers 200, so status code alone reports the entire must-404 list
    # as exposed. Compare response bodies before calling anything exposed.
    _, baseline = probe(base + "/")
    baseline_head = baseline[:2000]

    results = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
        futs = {ex.submit(probe, base + p): p for p in MUST_404}
        for f in concurrent.futures.as_completed(futs):
            results[futs[f]] = f.result()

    def is_fallback(body: str) -> bool:
        if not body:
            return False
        if baseline_head and body[:2000] == baseline_head:
            return True
        return body.lstrip()[:200].lower().startswith(("<!doctype html", "<html"))

    fallbacks = {p for p, (c, body) in results.items() if c == 200 and is_fallback(body)}
    exposed = {p: (c, body) for p, (c, body) in results.items()
               if c == 200 and p not in fallbacks}
    if fallbacks:
        print(f"[guard] {len(fallbacks)} path(s) answered 200 with the site's own "
              f"HTML shell: SPA/rewrite fallback, not exposure")

    leaks = []
    for p, (c, body) in exposed.items():
        for pat, label in SECRET_PATTERNS:
            if re.search(pat, body):
                leaks.append((p, label))

    if not exposed:
        print(f"[guard] verify OK: all {len(MUST_404)} paths correctly absent")
        if out_json:
            pathlib.Path(out_json).write_text(json.dumps(
                {"base": base, "exposed": [], "checked": len(MUST_404)}, indent=1),
                encoding="utf-8")
        return 0

    print(f"\nGUARD FAIL: {len(exposed)} path(s) are PUBLICLY READABLE on {base}:\n")
    for p in sorted(exposed):
        print(f"  200  {base}{p}")
    if leaks:
        print("\n  *** SECRET MATERIAL IN RESPONSE BODY ***")
        for p, label in leaks:
            print(f"  {p}: {label}")
        print("  Rotate the affected credential before anything else.")
    print("\nThese are already live. Blocking them is a server-side fix:")
    print("  add a 404 rule to .htaccess, then re-run --verify.")
    if out_json:
        pathlib.Path(out_json).write_text(json.dumps(
            {"base": base, "exposed": sorted(exposed),
             "secret_hits": leaks, "checked": len(MUST_404)}, indent=1), encoding="utf-8")
    return 1


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--preflight", metavar="DIR")
    ap.add_argument("--verify", metavar="BASE_URL")
    ap.add_argument("--allow-source", nargs="*", default=[],
                    help="paths, relative to DIR, that may be published despite "
                         "not being web-servable. Each must be named.")
    ap.add_argument("--json")
    args = ap.parse_args()

    if not args.preflight and not args.verify:
        ap.error("give --preflight DIR and/or --verify BASE_URL")

    rc = 0
    if args.preflight:
        rc |= preflight(pathlib.Path(args.preflight), set(args.allow_source))
    if args.verify:
        rc |= verify(args.verify, args.json)
    return rc


if __name__ == "__main__":
    sys.exit(main())
