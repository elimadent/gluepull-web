#!/bin/bash
set -euo pipefail

# Only run in the remote Claude Code on the web environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install npm dependencies. Using `npm install` (not `npm ci`) so the cached
# container state can be reused across sessions and the step is idempotent.
npm install
