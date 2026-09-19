// Recover a partial publication using immutable, already signed release assets.
// This job never receives a signing key and never rebuilds an APK.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const repo = 'prakhar-goel/duit-cards-2025';
export function verifyRecovery({ release, manifest, apkSha, manifestSha, version, versionCode, certificate, current }) {
  const fileName = `DUIT-2026-${version}.apk`;
  const asset = release.assets?.find(item => item.name === fileName);
  const manifestAsset = release.assets?.find(item => item.name === 'android-build.json');
  if (release.draft || release.tag_name !== `v${version}-staging` || !release.published_at ||
      !/^[a-f0-9]{64}$/.test(apkSha) || asset?.digest !== `sha256:${apkSha}` ||
      manifestAsset?.digest !== `sha256:${manifestSha}` || manifest.sha256 !== apkSha ||
      manifest.bytes !== asset.size || manifest.version !== version || manifest.versionCode !== versionCode ||
      manifest.package !== 'io.duit.ecards.pilot' || manifest.initialApiUrl !== 'https://duit-cards-staging.onrender.com/api/v1' ||
      !/^[a-f0-9]{64}$/i.test(certificate || '') || manifest.signingCertificateSha256?.toLowerCase() !== certificate.toLowerCase() ||
      !/^[a-f0-9]{40}$/.test(manifest.sourceCommit || '') || manifest.sourceDirty !== false ||
      manifest.fileName !== fileName || manifest.url !== `https://github.com/${repo}/releases/download/v${version}-staging/${fileName}` ||
      Date.parse(manifest.releasedAt) !== Date.parse(release.published_at)) {
    throw Error('Recovery assets do not match the verified signed release.');
  }
  if (current && (!Number.isSafeInteger(current.versionCode) || current.versionCode > versionCode ||
      (current.versionCode === versionCode && current.sha256 !== apkSha))) {
    throw Error('Refusing to roll back or replace the current staging APK.');
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--dry-run')) throw Error('Usage: node scripts/sync-staging-channel.mjs [--dry-run]');
  const config = JSON.parse(fs.readFileSync('apps/mobile/app.json', 'utf8')).expo;
  const version = config.version;
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw Error('Invalid release version.');
  const tag = `v${version}-staging`, fileName = `DUIT-2026-${version}.apk`;
  const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  const api = async (tag, optional = false) => {
    const response = await fetch(`https://api.github.com/repos/${repo}/releases/tags/${tag}`, {
      headers: { Authorization: `Bearer ${process.env.GH_TOKEN}` }, signal: AbortSignal.timeout(30000),
    });
    if (optional && response.status === 404) return null;
    if (!response.ok) throw Error(`Release lookup failed: HTTP ${response.status}.`);
    return response.json();
  };
  const release = await api(tag);
  const channel = await api('staging-latest', true);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'duit-channel-recovery-'));
  try {
    gh('release', 'download', tag, '--repo', repo, '--pattern', fileName, '--pattern', 'android-build.json', '--dir', temp);
    const apk = path.join(temp, fileName), manifestPath = path.join(temp, 'android-build.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    let current;
    if (channel?.assets?.some(asset => asset.name === 'android-build.json')) {
      const previousDir = path.join(temp, 'previous');
      fs.mkdirSync(previousDir);
      gh('release', 'download', 'staging-latest', '--repo', repo, '--pattern', 'android-build.json', '--dir', previousDir);
      current = JSON.parse(fs.readFileSync(path.join(previousDir, 'android-build.json'), 'utf8'));
    }
    const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    verifyRecovery({ release, manifest, apkSha: digest(apk), manifestSha: digest(manifestPath),
      version, versionCode: config.android.versionCode, certificate: process.env.DUIT_SIGNING_CERT_SHA256, current });
    execFileSync('git', ['merge-base', '--is-ancestor', manifest.sourceCommit, 'HEAD']);
    if (args.includes('--dry-run')) {
      console.log(`Verified immutable ${version} APK and manifest, certificate provenance, source ancestry and rollback guard. No remote changes made.`);
      return;
    }
    const compatibility = path.join(temp, 'DUIT-2026-Pilot.apk');
    fs.copyFileSync(apk, compatibility);
    const notes = path.join(temp, 'notes.md');
    fs.writeFileSync(notes, typeof release.body === 'string' ? release.body : `Verified staging recovery from ${tag}.`);
    if (channel) {
      gh('release', 'upload', 'staging-latest', apk, compatibility, manifestPath, '--clobber', '--repo', repo);
      gh('release', 'edit', 'staging-latest', '--title', `DUIT for Android · ${version}`, '--notes-file', notes, '--draft=false', '--repo', repo);
    } else {
      gh('release', 'create', 'staging-latest', apk, compatibility, manifestPath, '--target', manifest.sourceCommit,
        '--title', `DUIT for Android · ${version}`, '--notes-file', notes, '--prerelease', '--repo', repo);
    }
    const synced = await api('staging-latest');
    for (const [name, expected] of [[fileName, manifest.sha256], ['DUIT-2026-Pilot.apk', manifest.sha256], ['android-build.json', digest(manifestPath)]]) {
      if (synced.assets.find(asset => asset.name === name)?.digest !== `sha256:${expected}`) throw Error('Staging recovery verification failed; retry the recovery job.');
    }
    const summary = `Recovered staging ${version} from the verified immutable release; no APK rebuild or signing.\n\n${manifest.url}\n`;
    console.log(summary);
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
