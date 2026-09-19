import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { parseEnv } from 'node:util';
const config = parseEnv(fs.readFileSync(new URL('../.local/codex-test.env', import.meta.url), 'utf8'));
if (config.TEST_DATABASE_URL !== 'postgresql://postgres@127.0.0.1:55432/duit_2026_pilot_test') {
  throw new Error('Cloud verification requires the dedicated local disposable database. Run the cloud maintenance script.');
}
const result = spawnSync('npm', ['run', 'ci:verify'], {
  cwd: new URL('..', import.meta.url), stdio: 'inherit',
  env: { ...process.env, TEST_DATABASE_URL: config.TEST_DATABASE_URL, EXPO_NO_TELEMETRY: '1', CI: 'true', DUIT_AI_ENABLED: 'false' },
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
