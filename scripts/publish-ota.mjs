import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd, args, options = {}) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8', ...options });
const message = process.argv.slice(2).join(' ').trim();
if (!message) throw Error('Usage: npm run release:ota -- "Describe the UI update"');
if (run('git', ['branch', '--show-current']).trim() !== 'main' || run('git', ['status', '--porcelain']).trim()) throw Error('Publish OTA from clean main after PR checks pass.');
run('git', ['fetch', 'origin', 'main']);
const sha = run('git', ['rev-parse', 'HEAD']).trim();
if (sha !== run('git', ['rev-parse', 'origin/main']).trim()) throw Error('Pull latest main before publishing.');
const runs = JSON.parse(run('gh', ['run', 'list', '--workflow', 'ci.yml', '--branch', 'main', '--commit', sha, '--json', 'conclusion,event', '--limit', '10']));
if (!runs.some(r => r.event === 'push' && r.conclusion === 'success')) throw Error('Protected main Pilot CI must pass first.');
const config = JSON.parse(fs.readFileSync(path.join(root, 'apps/mobile/app.json'), 'utf8')).expo;
const response = await fetch(`https://github.com/prakhar-goel/duit-cards-2025/releases/download/v${config.version}-staging/android-build.json`);
if (!response.ok) throw Error('Publish the compatible signed APK first.');
const baseline = await response.json();
if (baseline.otaEnabled !== true || baseline.otaRuntimeVersion !== config.runtimeVersion || baseline.otaChannel !== 'staging') throw Error('APK OTA runtime/channel does not match.');
const nativePaths = ['apps/mobile/android', 'apps/mobile/app.json', 'apps/mobile/package.json', 'package.json', 'package-lock.json'];
if (run('git', ['diff', baseline.sourceCommit, 'HEAD', '--', ...nativePaths]).trim()) throw Error('Native/config/dependency changes since this APK: release a new APK/runtime instead of OTA.');
run('eas', ['update', '--channel', 'staging', '--platform', 'android', '--message', message, '--non-interactive'], {
 cwd: path.join(root, 'apps/mobile'), stdio: 'inherit',
 env: { ...process.env, EXPO_NO_DOTENV: '1', EXPO_PUBLIC_API_URL: baseline.initialApiUrl, EXPO_PUBLIC_DEMO_EMAIL: '', EXPO_PUBLIC_DEMO_PASSWORD: '' },
});
