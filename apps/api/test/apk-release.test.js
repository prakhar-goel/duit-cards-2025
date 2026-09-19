import test from 'node:test';
import assert from 'node:assert/strict';
import { createApkReleaseReader } from '../src/apk-release.js';
const base = 'https://github.com/prakhar-goel/duit-cards-2025/releases/download/';
const channel = `${base}staging-latest/DUIT-2026-Pilot.apk`;
const sha = 'a'.repeat(64);
function fixture(version = '4.6.1') {
  return {
    manifest: { version, sha256: sha, builtAt: '2026-09-18T15:57:14Z', url: `${base}v${version}-staging/DUIT-2026-Pilot.apk` },
    release: { tag_name: `v${version}-staging`, draft: false, published_at: '2026-09-18T16:11:23Z', assets: [{ name: 'DUIT-2026-Pilot.apk', digest: `sha256:${sha}` }] },
  };
}
test('release details use original publication time, cache concurrent reads, then follow a new APK', async () => {
  let clock = 0, calls = 0, data = fixture();
  const read = createApkReleaseReader({ now: () => clock, fetchJson: async url => { calls++; return url.endsWith('android-build.json') ? data.manifest : data.release; } });
  const [a, b] = await Promise.all([read(channel), read(channel)]);
  assert.deepEqual(a, { version: '4.6.1', releasedAt: '2026-09-18T16:11:23.000Z', fileName: 'DUIT-2026-Pilot.apk', downloadUrl: `${base}v4.6.1-staging/DUIT-2026-Pilot.apk` });
  assert.deepEqual(a, b);
  assert.equal(calls, 2);
  clock = 300001;
  data = fixture('4.6.2');
  assert.equal((await read(channel)).version, '4.6.2');
  assert.equal(calls, 4);
});
test('mismatched, draft and malformed release metadata never becomes a displayed version', async () => {
  for (const alter of [
    d => { d.release.assets[0].digest = 'sha256:wrong'; },
    d => { d.release.draft = true; },
    d => { d.release.published_at = 'not a date'; },
    d => { d.manifest.url = `${base}v4.6.0-staging/DUIT-2026-Pilot.apk`; },
  ]) {
    const data = fixture(); alter(data);
    const read = createApkReleaseReader({ fetchJson: async url => url.endsWith('android-build.json') ? data.manifest : data.release });
    await assert.rejects(read(channel));
  }
});
test('metadata outage recovers and untrusted URLs are rejected before fetching', async () => {
  let calls = 0, clock = 0, offline = true;
  const data = fixture();
  const read = createApkReleaseReader({ now: () => clock, fetchJson: async url => { calls++; if (offline) throw Error('Offline'); return url.endsWith('android-build.json') ? data.manifest : data.release; } });
  await assert.rejects(read('https://attacker.test/DUIT-2026-Pilot.apk'));
  assert.equal(calls, 0);
  await assert.rejects(read(channel));
  await assert.rejects(read(channel));
  assert.equal(calls, 1);
  offline = false; clock = 30001;
  assert.equal((await read(channel)).version, '4.6.1');
});

test('downloads prefer the checksum-verified versioned filename, including older manifests', async () => {
  for (const version of ['4.6.1', '4.7.0']) {
    const data = fixture(version);
    const fileName = `DUIT-2026-${version}.apk`;
    data.release.assets.push({ name: fileName, digest: `sha256:${sha}` });
    if (version === '4.7.0') data.manifest.url = `${base}v${version}-staging/${fileName}`;
    const read = createApkReleaseReader({ fetchJson: async url => url.endsWith('android-build.json') ? data.manifest : data.release });
    const details = await read(channel);
    assert.equal(details.fileName, fileName);
    assert.equal(details.downloadUrl, `${base}v${version}-staging/${fileName}`);
  }
});
test('a versioned asset with a different checksum cannot be served even if the legacy alias matches', async () => {
  const data = fixture();
  data.release.assets.push({ name: 'DUIT-2026-4.6.1.apk', digest: 'sha256:wrong' });
  const read = createApkReleaseReader({ fetchJson: async url => url.endsWith('android-build.json') ? data.manifest : data.release });
  await assert.rejects(read(channel));
});

test('publisher-stamped manifests serve filename and original release time without anonymous API calls', async () => {
  const data = fixture();
  Object.assign(data.manifest, { fileName: 'DUIT-2026-4.6.1.apk', url: `${base}v4.6.1-staging/DUIT-2026-4.6.1.apk`, releasedAt: data.release.published_at });
  let calls = 0;
  const read = createApkReleaseReader({ fetchJson: async url => {
    calls++;
    if (!url.endsWith('android-build.json')) throw Error('GitHub API unavailable');
    return data.manifest;
  } });
  const result = await read(channel);
  assert.equal(calls, 1);
  assert.equal(result.fileName, 'DUIT-2026-4.6.1.apk');
  assert.equal(result.releasedAt, '2026-09-18T16:11:23.000Z');
});
test('invalid publisher timestamp or filename is rejected', async () => {
  const data = fixture();
  Object.assign(data.manifest, { fileName: 'DUIT-2026-4.6.1.apk', url: `${base}v4.6.1-staging/DUIT-2026-4.6.1.apk`, releasedAt: 'invalid' });
  const read = createApkReleaseReader({ fetchJson: async () => data.manifest });
  await assert.rejects(read(channel));
});
