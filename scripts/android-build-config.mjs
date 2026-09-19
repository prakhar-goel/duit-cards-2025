import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

export function androidTools(env = process.env) {
  let javaHome = env.JAVA_HOME;
  if (!javaHome && process.platform === 'darwin') {
    const brewJava = '/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home';
    javaHome = fs.existsSync(brewJava) ? brewJava
      : execFileSync('/usr/libexec/java_home', ['-v', '17'], { encoding: 'utf8' }).trim();
  }
  if (!javaHome) throw new Error('Set JAVA_HOME to Java 17 (CI uses actions/setup-java).');
  const sdk = env.ANDROID_HOME || env.ANDROID_SDK_ROOT || path.join(os.homedir(), 'Library/Android/sdk');
  if (!fs.existsSync(sdk)) throw new Error('Install the Android SDK and set ANDROID_HOME.');
  return { javaHome, sdk };
}

export function requireExistingSigning(signing) {
  for (const name of ['pilot.properties', 'duit-pilot.jks']) {
    if (!fs.existsSync(path.join(signing, name))) {
      throw new Error('Missing existing DUIT signing identity. Restore .local/signing or configure the android-staging environment secrets. A new key will not be generated.');
    }
  }
}

export function demoCredentials(root, env = process.env) {
  if (env.DUIT_DEMO_PREFILL === 'false') return undefined;
  const supplied = env.DUIT_DEMO_EMAIL || env.DUIT_DEMO_PASSWORD;
  const file = path.join(root, '.local/credentials.json');
  const account = supplied
    ? { email: env.DUIT_DEMO_EMAIL, password: env.DUIT_DEMO_PASSWORD }
    : fs.existsSync(file)
      ? JSON.parse(fs.readFileSync(file, 'utf8')).accounts?.find(a => a.email === 'maya@northstar.example')
      : undefined;
  if (account && (account.email !== 'maya@northstar.example' || !account.password)) {
    throw new Error('Only the designated shared Maya tester may be embedded in this APK.');
  }
  if (env.DUIT_DEMO_PREFILL === 'true' && !account) {
    throw new Error('Shared tester prefill requested but its credentials are missing.');
  }
  return account;
}

export function certificateDigest(output, expected) {
  const digest = output.match(/Signer #1 certificate SHA-256 digest:\s*([a-f\d]+)/i)?.[1]?.toLowerCase();
  if (!digest || digest.length !== 64) throw new Error('Could not verify the APK signing certificate.');
  if (expected && digest !== expected.replaceAll(':', '').trim().toLowerCase()) {
    throw new Error('APK signing certificate differs from the installed DUIT identity.');
  }
  return digest;
}
