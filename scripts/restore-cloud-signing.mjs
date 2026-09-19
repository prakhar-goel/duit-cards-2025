// Run only in the protected GitHub Actions signing environment. Never log inputs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.env.GITHUB_ACTIONS !== 'true' || process.env.GITHUB_REF !== 'refs/heads/main') {
  throw new Error('Signing restoration is restricted to GitHub Actions on main.');
}
const names = ['DUIT_KEYSTORE_BASE64', 'DUIT_STORE_PASSWORD', 'DUIT_KEY_PASSWORD', 'DUIT_SIGNING_CERT_SHA256'];
for (const name of names) if (!process.env[name]) throw new Error(`Missing android-staging secret: ${name}`);
const key = Buffer.from(process.env.DUIT_KEYSTORE_BASE64, 'base64');
if (key.length < 1000) throw new Error('Invalid signing keystore.');
const dir = path.join(root, '.local/signing');
fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
const keyPath = path.join(dir, 'duit-pilot.jks');
const escape = value => value.replaceAll('\\', '\\\\').replaceAll('\r', '\\r').replaceAll('\n', '\\n');
fs.writeFileSync(keyPath, key, { mode: 0o600 });
fs.writeFileSync(path.join(dir, 'pilot.properties'), [
  `storeFile=${escape(keyPath)}`,
  `storePassword=${escape(process.env.DUIT_STORE_PASSWORD)}`,
  'keyAlias=duitpilot',
  `keyPassword=${escape(process.env.DUIT_KEY_PASSWORD)}`,
  '',
].join('\n'), { mode: 0o600 });
console.log('Restored existing signing identity for this runner.');
