import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const repository = 'prakhar-goel/duit-cards-2025';
const shaPattern = /^[a-f0-9]{40}$/;

export function releaseSource({ eventName, event, ref, sha, repo }) {
  if (repo !== repository || ref !== 'refs/heads/main') throw Error('Only DUIT main can release.');
  if (eventName === 'workflow_run') {
    const run = event.workflow_run;
    if (run?.name !== 'Pilot CI' || run.event !== 'push' || run.head_branch !== 'main' ||
        run.head_repository?.full_name !== repository || run.conclusion !== 'success' || run.status !== 'completed') {
      throw Error('Automatic releases require successful same-repository main push CI.');
    }
    sha = run.head_sha;
  } else if (eventName !== 'workflow_dispatch') {
    throw Error('Unsupported release event.');
  }
  if (!shaPattern.test(sha || '')) throw Error('Invalid source commit.');
  return sha;
}

export function verifyReleaseCi(run, sha) {
  if (run?.event !== 'push' || run.head_branch !== 'main' || run.head_sha !== sha ||
      run.head_repository?.full_name !== repository || run.status !== 'completed' ||
      run.conclusion !== 'success' || run.path?.split('@')[0] !== '.github/workflows/ci.yml') {
    throw Error('The latest Pilot CI for this exact main commit must pass before signing.');
  }
}

export function automaticReleaseDecision({ version, versionCode, gradle, existing, channel, previous }) {
  if (!/^\d+\.\d+\.\d+$/.test(version || '') || !Number.isSafeInteger(versionCode) || versionCode <= 0 || versionCode > 2100000000) {
    throw Error('Invalid Android release version.');
  }
  if (gradle.match(/\bversionName\s+["']([^"']+)["']/)?.[1] !== version ||
      Number(gradle.match(/\bversionCode\s+(\d+)/)?.[1]) !== versionCode) {
    throw Error('app.json and Android versions must match.');
  }
  const fileName = `DUIT-2026-${version}.apk`;
  if (existing) {
    const asset = existing.assets?.find(asset => asset.name === fileName);
    if (existing.draft || !asset?.size || !/^sha256:[a-f0-9]{64}$/.test(asset.digest || '')) {
      throw Error('This version has an incomplete release; inspect it before retrying.');
    }
    const names = [fileName, 'DUIT-2026-Pilot.apk', 'android-build.json'];
    if (names.some(name => !/^sha256:[a-f0-9]{64}$/.test(existing.assets?.find(item => item.name === name)?.digest || '')) ||
        existing.assets.find(item => item.name === 'DUIT-2026-Pilot.apk')?.digest !== asset.digest) {
      throw Error('Published release is missing recovery assets; inspect it before retrying.');
    }
    const synchronized = channel && !channel.draft && names.every(name => {
      const expected = existing.assets.find(item => item.name === name);
      const actual = channel.assets?.find(item => item.name === name);
      return actual?.digest === expected.digest && actual?.size === expected.size;
    });
    return { build: false, repair: !synchronized, reason: synchronized
      ? `${version} and the staging channel are already published; no new version was requested.`
      : `Recover the staging channel from verified ${version} assets without rebuilding or signing.` };
  }
  if (previous) {
    if (!/^\d+\.\d+\.\d+$/.test(previous.version || '') || !Number.isSafeInteger(previous.versionCode)) throw Error('Invalid previous release manifest.');
    const next = version.split('.').map(Number), old = previous.version.split('.').map(Number);
    const index = next.findIndex((value, i) => value !== old[i]);
    if (index < 0 || next[index] < old[index] || versionCode <= previous.versionCode) {
      throw Error('New releases must increase both version and versionCode.');
    }
  }
  return { build: true, reason: `Publish DUIT ${version} (${versionCode}).` };
}

async function main() {
  const eventName = process.env.GITHUB_EVENT_NAME;
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const sha = releaseSource({ eventName, event, ref: process.env.GITHUB_REF, sha: process.env.GITHUB_SHA, repo: process.env.GITHUB_REPOSITORY });
  const api = async (route, optional = false) => {
    const response = await fetch(`https://api.github.com/repos/${repository}/${route}`, {
      headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(30000),
    });
    if (optional && response.status === 404) return null;
    if (!response.ok) throw Error(`GitHub release preflight failed: HTTP ${response.status}.`);
    return response.json();
  };
  const current = await api('git/ref/heads/main');
  const checkout = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  let decision;
  if (current.object.sha !== sha || checkout !== sha) {
    if (eventName !== 'workflow_run') throw Error('Main moved; wait for its CI and rerun from current main.');
    decision = { build: false, reason: 'Superseded main commit; its newer CI will handle publication.' };
  } else {
    const runs = await api(`actions/workflows/ci.yml/runs?head_sha=${sha}&branch=main&event=push&per_page=100`);
    const latest = runs.workflow_runs.sort((a, b) => b.id - a.id)[0];
    verifyReleaseCi(latest, sha);
    decision = { build: true, reason: 'Manual build from verified main.' };
    const recover = event.inputs?.recover_channel === 'true' || event.inputs?.recover_channel === true;
    if (eventName === 'workflow_run' || recover) {
      const config = JSON.parse(fs.readFileSync('apps/mobile/app.json', 'utf8')).expo;
      const existing = await api(`releases/tags/v${config.version}-staging`, true);
      if (recover && !existing) throw Error('No published version exists to recover; request a normal build instead.');
      let previous;
      if (!existing) {
        const response = await fetch(`https://github.com/${repository}/releases/download/staging-latest/android-build.json`, { signal: AbortSignal.timeout(30000) });
        if (!response.ok) throw Error(`Cannot verify previous staging version: HTTP ${response.status}.`);
        previous = await response.json();
      }
      const channel = existing ? await api('releases/tags/staging-latest', true) : undefined;
      decision = automaticReleaseDecision({ version: config.version, versionCode: config.android.versionCode,
        gradle: fs.readFileSync('apps/mobile/android/app/build.gradle', 'utf8'), existing, channel, previous });
    }
  }
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `sha=${sha}\nbuild=${decision.build}\nrepair=${decision.repair === true}\n`);
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Android release preflight\n\n${decision.reason}\n\nSource: \`${sha}\`\n`);
  console.log(decision.reason);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
