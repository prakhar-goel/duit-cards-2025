import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const branch = execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim();
if (!branch || branch === 'main') throw Error('Prepare a release on your focused feature branch, then merge through a PR.');
const configPath = path.join(root, 'apps/mobile/app.json');
const gradlePath = path.join(root, 'apps/mobile/android/app/build.gradle');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const gradle = fs.readFileSync(gradlePath, 'utf8');
const current = config.expo.version;
const code = config.expo.android.versionCode;
if (!/^\d+\.\d+\.\d+$/.test(current) || !Number.isSafeInteger(code) || code >= 2100000000 ||
    gradle.match(/\bversionName\s+["']([^"']+)["']/)?.[1] !== current ||
    Number(gradle.match(/\bversionCode\s+(\d+)/)?.[1]) !== code) throw Error('Repair mismatched or invalid versions before preparing a release.');
const parts = current.split('.').map(Number);
parts[2]++;
const version = parts.join('.');
if (process.argv.length > 2) throw Error('Usage: npm run release:prepare (increments the current patch version and Android code).');
config.expo.version = version;
config.expo.android.versionCode = code + 1;
const updatedGradle = gradle.replace(/\bversionName\s+["'][^"']+["']/, `versionName "${version}"`)
  .replace(/\bversionCode\s+\d+/, `versionCode ${code + 1}`);
fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
fs.writeFileSync(gradlePath, updatedGradle);
console.log(`Prepared DUIT ${version} (${code + 1}). Commit both version files with your change.\nAfter the PR merges and main CI passes, GitHub will build and publish the APK automatically.\nThis command does not sign, upload, commit, or merge anything.`);
