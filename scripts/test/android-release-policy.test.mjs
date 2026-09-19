import { test } from 'node:test';
import assert from 'node:assert/strict';
import { releaseSource, verifyReleaseCi, automaticReleaseDecision } from '../plan-android-release.mjs';

const sha = 'a'.repeat(40);
const run = { name: 'Pilot CI', event: 'push', head_branch: 'main', head_sha: sha,
  head_repository: { full_name: 'prakhar-goel/duit-cards-2025' }, conclusion: 'success', status: 'completed', path: '.github/workflows/ci.yml' };
const event = { eventName: 'workflow_run', event: { workflow_run: run }, ref: 'refs/heads/main', sha: 'b'.repeat(40), repo: 'prakhar-goel/duit-cards-2025' };
test('automatic source is the tested commit, never the workflow default SHA', () => {
  assert.equal(releaseSource(event), sha);
  assert.equal(releaseSource({ ...event, eventName: 'workflow_dispatch' }), 'b'.repeat(40));
});
test('PR, fork, failure and non-main events cannot reach signing', () => {
  for (const change of [{ event: 'pull_request' }, { head_branch: 'codex/test' }, { conclusion: 'failure' },
    { status: 'in_progress' }, { name: 'Other workflow' }, { head_repository: { full_name: 'attacker/fork' } }]) {
    assert.throws(() => releaseSource({ ...event, event: { workflow_run: { ...run, ...change } } }));
  }
  assert.throws(() => releaseSource({ ...event, ref: 'refs/heads/test' }));
  assert.throws(() => releaseSource({ ...event, eventName: 'pull_request_target' }));
});
test('signing requires exact successful CI provenance', () => {
  verifyReleaseCi(run, sha);
  for (const change of [{ head_sha: 'b'.repeat(40) }, { event: 'pull_request' }, { conclusion: 'failure' },
    { head_repository: { full_name: 'attacker/fork' } }, { path: '.github/workflows/other.yml' }]) {
    assert.throws(() => verifyReleaseCi({ ...run, ...change }, sha));
  }
});
const input = { version: '4.6.3', versionCode: 13, gradle: 'versionName "4.6.3"\nversionCode 13', previous: { version: '4.6.2', versionCode: 12 } };
test('new aligned increasing versions publish; existing verified versions skip', () => {
  assert.equal(automaticReleaseDecision(input).build, true);
  assert.equal(automaticReleaseDecision({ ...input, existing: { draft: false, assets: [{ name: 'DUIT-2026-4.6.3.apk', size: 10, digest: `sha256:${'a'.repeat(64)}` }] } }).build, false);
});
test('incomplete, mismatched and rollback releases fail closed', () => {
  for (const change of [{ existing: { draft: true } }, { existing: { assets: [] } },
    { gradle: 'versionName "4.6.2"\nversionCode 13' }, { previous: { version: '4.6.4', versionCode: 12 } },
    { previous: { version: '4.6.2', versionCode: 13 } }, { version: '../bad' }]) {
    assert.throws(() => automaticReleaseDecision({ ...input, ...change }));
  }
});
