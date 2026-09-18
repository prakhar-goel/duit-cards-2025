import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = 'prakhar-goel/duit-cards-2025';
const origin = 'https://duit-cards-staging.onrender.com';
const channel = 'staging-latest';
const args = new Set(process.argv.slice(2));
if ([...args].some(arg => !['--existing', '--dry-run'].includes(arg))) {
  throw new Error('Usage: npm run release:apk -- [--existing] [--dry-run]');
}
const run = (command, argv, options = {}) => execFileSync(command, argv, {
  cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], ...options,
});
const gh = (...argv) => run('gh', [...argv, '--repo', repo]);
if (!args.has('--dry-run') && run('git', ['status', '--porcelain']).trim()) {
  throw new Error('Commit and merge source changes before publishing an APK.');
}
if (!args.has('--dry-run') && run('git', ['branch', '--show-current']).trim() !== 'main') {
  throw new Error('Publish from main after the pull request checks pass.');
}
run('gh', ['auth', 'status'], { stdio: 'ignore' });
const prefill = process.env.DUIT_DEMO_PREFILL !== 'false';
if (!args.has('--existing')) {
  run(process.execPath, ['scripts/build-pilot-android.mjs'], {
    stdio: 'inherit',
    env: { ...process.env, DUIT_DEMO_PREFILL: String(prefill), EXPO_PUBLIC_API_URL: `${origin}/api/v1` },
  });
}
const artifacts = path.join(root, 'artifacts');
const apk = path.join(artifacts, prefill ? 'DUIT-2026-Private.apk' : 'DUIT-2026-Pilot.apk');
const metadata = JSON.parse(fs.readFileSync(path.join(artifacts, prefill ? 'android-build-private.json' : 'android-build.json'), 'utf8'));
const digest = crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex');
if (digest !== metadata.sha256 || fs.statSync(apk).size !== metadata.bytes) throw new Error('APK does not match verified build metadata.');
if (metadata.initialApiUrl !== `${origin}/api/v1`) throw new Error('Only the isolated staging server can be published here.');
if (metadata.prefilledLogin !== prefill) throw new Error('APK login mode does not match requested release mode.');
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || path.join(os.homedir(), 'Library/Android/sdk');
const tools = fs.readdirSync(path.join(sdk, 'build-tools')).filter(v => /^\d/.test(v)).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];
const tool = name => path.join(sdk, 'build-tools', tools, name);
const java = process.env.JAVA_HOME || '/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home';
run(tool('apksigner'), ['verify', apk], { env: { ...process.env, JAVA_HOME: java } });
const info = run(tool('aapt'), ['dump', 'badging', apk]);
const packageName = info.match(/^package: name='([^']+)'/m)?.[1];
const version = info.match(/versionName='([^']+)'/)?.[1];
const code = info.match(/versionCode='([^']+)'/)?.[1];
const expectedVersion = JSON.parse(fs.readFileSync(path.join(root, 'apps/mobile/app.json'), 'utf8')).expo.version;
if (packageName !== 'io.duit.ecards.pilot' || !/^\d+\.\d+\.\d+$/.test(version || '') || version !== expectedVersion) {
  throw new Error('APK package/version does not match this checkout.');
}
const tag = `v${version}-staging`;
const url = `https://github.com/${repo}/releases/download/${tag}/DUIT-2026-Pilot.apk`;
console.log(`Verified DUIT ${version} (${code}), SHA-256 ${digest}. Prefilled Maya login: ${prefill}.`);
if (args.has('--dry-run')) {
  console.log(`Would publish ${tag} and update ${channel}. No remote changes made.`);
  process.exit(0);
}
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'duit-apk-release-'));
try {
  const upload = path.join(temp, 'DUIT-2026-Pilot.apk');
  fs.copyFileSync(apk, upload);
  const releaseMetadata = { ...metadata, version, versionCode: Number(code), url };
  const manifest = path.join(temp, 'android-build.json');
  fs.writeFileSync(manifest, JSON.stringify(releaseMetadata, null, 2) + '\n');
  const notes = path.join(temp, 'notes.md');
  fs.writeFileSync(notes, `DUIT Android ${version}. Install over the existing app to preserve your saved server and session.\n\n${prefill ? 'Includes the shared Maya staging login for one-tap entry. This account is accessible to anyone who downloads the APK. Owner credentials and the legacy archive are excluded.' : 'Sign in with your tester account.'}\n\nStable download page: ${origin}/download\n\nSHA-256: ${digest}\n`);
  const releases = JSON.parse(run('gh', ['api', `repos/${repo}/releases?per_page=100`]));
  const existing = releases.find(release => release.tag_name === tag);
  if (existing) {
    const asset = existing.assets.find(item => item.name === 'DUIT-2026-Pilot.apk');
    if (asset?.digest !== `sha256:${digest}`) throw new Error(`${tag} already exists with a different or unverified APK. Bump the app version; released builds are immutable.`);
    if (existing.draft) gh('release', 'edit', tag, '--draft=false');
  } else {
    gh('release', 'create', tag, upload, manifest, '--target', run('git', ['rev-parse', 'HEAD']).trim(), '--title', `DUIT ${version}`, '--notes-file', notes, '--prerelease', '--draft');
    gh('release', 'edit', tag, '--draft=false');
  }
  // Publish the immutable version first; update the permanent channel only after it succeeds.
  const current = releases.find(release => release.tag_name === channel);
  if (current) {
    gh('release', 'upload', channel, upload, manifest, '--clobber');
    gh('release', 'edit', channel, '--title', `DUIT for Android · ${version}`, '--notes-file', notes);
  } else {
    gh('release', 'create', channel, upload, manifest, '--target', run('git', ['rev-parse', 'HEAD']).trim(), '--title', `DUIT for Android · ${version}`, '--notes-file', notes, '--prerelease');
  }
  const channelInfo = JSON.parse(gh('release', 'view', channel, '--json', 'assets'));
  const channelAsset = channelInfo.assets.find(item => item.name === 'DUIT-2026-Pilot.apk');
  if (channelAsset?.digest !== `sha256:${digest}`) throw new Error('Channel upload verification failed. Retry with --existing.');
  console.log(`\nPublished and verified ${version}.\nDownload: ${origin}/download\nVersioned APK: ${url}`);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
