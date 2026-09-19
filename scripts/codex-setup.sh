#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
[[ "$(uname -s)" == Linux ]] || { echo 'Codex setup targets Linux, not the existing Mac environment.' >&2; exit 1; }
node -e 'const [major,minor]=process.versions.node.split(".").map(Number); if(major<22 || (major===22 && minor<12)) throw Error("Select Node 22.12+ in Codex environment settings")'
if ! command -v pg_config >/dev/null || [[ ! -x "$(pg_config --bindir)/initdb" ]]; then
  if [[ "$(id -u)" == 0 ]]; then
    apt-get update -qq
    DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-client
  else
    sudo apt-get update -qq
    sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-client
  fi
fi
npm ci --no-audit --no-fund
bash scripts/codex-maintenance.sh
