import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { requireExistingSigning, demoCredentials, certificateDigest } from '../android-build-config.mjs';

test('missing signing identity fails closed and never generates a replacement', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'duit-signing-check-'));
  try {
    assert.throws(() => requireExistingSigning(dir), /new key will not be generated/);
    assert.deepEqual(fs.readdirSync(dir), []);
    fs.writeFileSync(path.join(dir, 'pilot.properties'), '');
    assert.throws(() => requireExistingSigning(dir), /Missing existing/);
  } finally { fs.rmSync(dir, { recursive: true }); }
});

test('cloud prefill accepts only the shared tester and fails on missing credentials', () => {
  assert.equal(demoCredentials('/nonexistent', { DUIT_DEMO_PREFILL: 'false', DUIT_DEMO_EMAIL: 'owner@example.com', DUIT_DEMO_PASSWORD: 'secret' }), undefined);
  assert.throws(() => demoCredentials('/nonexistent', { DUIT_DEMO_PREFILL: 'true' }), /missing/);
  assert.throws(() => demoCredentials('/nonexistent', { DUIT_DEMO_EMAIL: 'owner@example.com', DUIT_DEMO_PASSWORD: 'secret' }), /designated shared Maya/);
  assert.throws(() => demoCredentials('/nonexistent', { DUIT_DEMO_EMAIL: 'maya@northstar.example' }), /designated shared Maya/);
  assert.deepEqual(demoCredentials('/nonexistent', { DUIT_DEMO_PREFILL: 'true', DUIT_DEMO_EMAIL: 'maya@northstar.example', DUIT_DEMO_PASSWORD: 'test-only' }), { email: 'maya@northstar.example', password: 'test-only' });
});

test('signing certificate verification rejects another identity or missing evidence', () => {
  const digest = 'a'.repeat(64);
  const output = `Signer #1 certificate SHA-256 digest: ${digest}`;
  assert.equal(certificateDigest(output, digest.toUpperCase()), digest);
  assert.throws(() => certificateDigest(output, 'b'.repeat(64)), /differs/);
  assert.throws(() => certificateDigest('Verified'), /Could not verify/);
});
