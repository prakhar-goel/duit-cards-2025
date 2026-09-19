import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyRecovery } from '../sync-staging-channel.mjs';
const sha = 'a'.repeat(64), manifestSha = 'b'.repeat(64), cert = 'c'.repeat(64);
const manifest = { version: '4.6.3', versionCode: 13, sha256: sha, bytes: 20, package: 'io.duit.ecards.pilot',
  initialApiUrl: 'https://duit-cards-staging.onrender.com/api/v1', signingCertificateSha256: cert,
  sourceCommit: 'd'.repeat(40), sourceDirty: false, fileName: 'DUIT-2026-4.6.3.apk',
  url: 'https://github.com/prakhar-goel/duit-cards-2025/releases/download/v4.6.3-staging/DUIT-2026-4.6.3.apk', releasedAt: '2026-09-19T08:00:00Z' };
const input = { release: { draft: false, tag_name: 'v4.6.3-staging', published_at: manifest.releasedAt, assets: [
  { name: manifest.fileName, size: 20, digest: `sha256:${sha}` }, { name: 'android-build.json', digest: `sha256:${manifestSha}` }] },
  manifest, apkSha: sha, manifestSha, version: '4.6.3', versionCode: 13, certificate: cert };
test('channel recovery accepts only assets with matching signed-release provenance', () => {
  verifyRecovery(input);
  for (const change of [{ apkSha: 'e'.repeat(64) }, { manifestSha: 'e'.repeat(64) }, { certificate: '' }, { versionCode: 14 },
    { manifest: { ...manifest, initialApiUrl: 'https://other.example' } }, { manifest: { ...manifest, sourceDirty: true } },
    { release: { ...input.release, draft: true } }]) assert.throws(() => verifyRecovery({ ...input, ...change }));
});
test('channel recovery cannot replace a newer or different same-version APK', () => {
  verifyRecovery({ ...input, current: { versionCode: 12 } });
  verifyRecovery({ ...input, current: { versionCode: 13, sha256: sha } });
  assert.throws(() => verifyRecovery({ ...input, current: { versionCode: 14 } }));
  assert.throws(() => verifyRecovery({ ...input, current: { versionCode: 13, sha256: 'e'.repeat(64) } }));
});
