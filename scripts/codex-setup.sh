#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
[[ "$(uname -s)" == Linux ]] || { echo 'Codex setup targets Linux, not the existing Mac environment.' >&2; exit 1; }
node -e 'const [major,minor]=process.versions.node.split(".").map(Number); if(major<22 || (major===22 && minor<12)) throw Error("Select Node 22.12+ in Codex environment settings")'
if ! command -v pg_config >/dev/null || [[ ! -x "$(pg_config --bindir)/initdb" ]]; then
  apt_runner=()
  [[ "$(id -u)" == 0 ]] || apt_runner=(sudo)
  apt_options=(-o Acquire::Retries=1 -o Acquire::https::Timeout=30)
  # Codex's Ubuntu snapshot already includes PostgreSQL. Refreshing unrelated
  # third-party repositories (notably LLVM) can fail before it is installed.
  # Keep the image's original snapshot and signature-verification settings.
  if [[ -f /etc/apt/sources.list.d/caas-snapshot.list ]]; then
    apt_options+=(-o Dir::Etc::sourcelist=/etc/apt/sources.list.d/caas-snapshot.list -o Dir::Etc::sourceparts=-)
  fi
  echo 'Installing disposable-test PostgreSQL from the configured Ubuntu sources...'
  timeout --kill-after=10s 120s "${apt_runner[@]}" apt-get "${apt_options[@]}" update -qq
  timeout --kill-after=10s 180s "${apt_runner[@]}" env DEBIAN_FRONTEND=noninteractive apt-get "${apt_options[@]}" install -y postgresql postgresql-client
fi
echo 'Installing locked npm dependencies (five-minute limit)...'
timeout --kill-after=15s 300s npm ci --no-audit --no-fund --foreground-scripts --fetch-retries=1 --fetch-timeout=60000
bash scripts/codex-maintenance.sh
