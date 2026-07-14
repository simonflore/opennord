#!/bin/bash
# OpenNord SessionStart hook for Claude Code on the web.
# Installs npm dependencies so typecheck, tests, and the build are ready to run.
set -euo pipefail

# Only run in the remote (Claude Code on the web) environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# npm install (not ci) so the cached container state can be reused across sessions.
npm install --no-audit --no-fund
