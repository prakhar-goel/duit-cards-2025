#!/usr/bin/env bash
# Dedicated disposable PostgreSQL instance. Never connects to hosted DUIT data.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "$(uname -s)" != Linux ]]; then
  echo 'This script is for the Linux cloud environment. On the Mac use npm run setup:pilot.' >&2
  exit 1
fi
pg_bin="$(pg_config --bindir)"
for tool in initdb pg_ctl createdb psql; do
  [[ -x "$pg_bin/$tool" ]] || { echo "Missing PostgreSQL server binary: $tool" >&2; exit 1; }
done
cloud_pg_dir="/tmp/duit-codex-postgres-$(id -u)"
cloud_pg_port=55432
pg_run=()
if [[ "$(id -u)" == 0 ]]; then
  install -d -m 700 -o postgres -g postgres "$cloud_pg_dir"
  pg_run=(runuser -u postgres --)
else
  mkdir -p "$cloud_pg_dir"
  chmod 700 "$cloud_pg_dir"
fi
if [[ ! -f "$cloud_pg_dir/data/PG_VERSION" ]]; then
  "${pg_run[@]}" "$pg_bin/initdb" -D "$cloud_pg_dir/data" -U postgres --auth-local=trust --auth-host=trust >/dev/null
fi
if ! "${pg_run[@]}" "$pg_bin/pg_ctl" -D "$cloud_pg_dir/data" status >/dev/null 2>&1; then
  "${pg_run[@]}" "$pg_bin/pg_ctl" -D "$cloud_pg_dir/data" -l "$cloud_pg_dir/postgres.log" \
    -o "-h 127.0.0.1 -p $cloud_pg_port -k $cloud_pg_dir" -w start
fi
# Verify this port belongs to the disposable instance, rather than another server.
actual_dir="$("$pg_bin/psql" -X -h 127.0.0.1 -p "$cloud_pg_port" -U postgres -d postgres -Atc 'SHOW data_directory')"
[[ "$actual_dir" == "$cloud_pg_dir/data" ]] || { echo 'Port belongs to a different PostgreSQL instance; refusing changes.' >&2; exit 1; }
if [[ "$("$pg_bin/psql" -X -h 127.0.0.1 -p "$cloud_pg_port" -U postgres -d postgres -Atc "SELECT 1 FROM pg_database WHERE datname='duit_2026_pilot_test'")" != 1 ]]; then
  "$pg_bin/createdb" -h 127.0.0.1 -p "$cloud_pg_port" -U postgres duit_2026_pilot_test
fi
mkdir -p .local
(umask 077; printf '%s\n' 'TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:55432/duit_2026_pilot_test' > .local/codex-test.env)
echo 'Disposable cloud test database ready. Run npm run verify:cloud.'
