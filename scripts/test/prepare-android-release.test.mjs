import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

function fixture(branch, gradle = 'versionName "4.6.2"\nversionCode 2026091812\n') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'duit-release-version-'));
  execFileSync('git', ['init', '-q', '-b', branch, root]);
  fs.mkdirSync(path.join(root, 'scripts'));
  fs.mkdirSync(path.join(root, 'apps/mobile/android/app'), { recursive: true });
  fs.copyFileSync(new URL('../prepare-android-release.mjs', import.meta.url), path.join(root, 'scripts/prepare-android-release.mjs'));
  fs.writeFileSync(path.join(root, 'apps/mobile/app.json'), JSON.stringify({ expo: { version: '4.6.2', android: { versionCode: 2026091812 } } }));
  fs.writeFileSync(path.join(root, 'apps/mobile/android/app/build.gradle'), gradle);
  return root;
}
test('release preparation updates both version files without committing', () => {
  const root = fixture('codex/test');
  try {
    execFileSync(process.execPath, [path.join(root, 'scripts/prepare-android-release.mjs')]);
    const config = JSON.parse(fs.readFileSync(path.join(root, 'apps/mobile/app.json'))).expo;
    assert.equal(config.version, '4.6.3');
    assert.equal(config.android.versionCode, 2026091813);
    assert.match(fs.readFileSync(path.join(root, 'apps/mobile/android/app/build.gradle'), 'utf8'), /versionName "4.6.3"\nversionCode 2026091813/);
    assert.notEqual(spawnSync('git', ['rev-parse', '--verify', 'HEAD'], { cwd: root }).status, 0);
  } finally { fs.rmSync(root, { recursive: true }); }
});
test('main or a version mismatch is rejected without modifying files', () => {
  for (const [branch, gradle] of [['main', undefined], ['codex/test', 'versionName "4.6.1"\nversionCode 2026091812\n']]) {
    const root = fixture(branch, gradle);
    try {
      const paths = ['apps/mobile/app.json', 'apps/mobile/android/app/build.gradle'].map(p => path.join(root, p));
      const before = paths.map(p => fs.readFileSync(p, 'utf8'));
      assert.notEqual(spawnSync(process.execPath, [path.join(root, 'scripts/prepare-android-release.mjs')]).status, 0);
      assert.deepEqual(paths.map(p => fs.readFileSync(p, 'utf8')), before);
    } finally { fs.rmSync(root, { recursive: true }); }
  }
});
