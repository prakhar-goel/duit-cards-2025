import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
console.log(`Branch: ${git('branch', '--show-current') || '(detached; check the cloud task branch)'}\nCommit: ${git('rev-parse', 'HEAD')}\n`);
const status = git('status', '--short');
console.log(`Working tree: ${status ? '\n' + status : 'clean'}\n`);
console.log('Recent commits:\n' + git('log', '-4', '--format=%h %s') + '\n');
console.log(fs.readFileSync(path.join(root, 'docs/DEVELOPMENT_HANDOFF.md'), 'utf8'));
console.log('\nThis is a local snapshot, not proof of a push or deployment. Fetch remote state when available; in cloud use Create PR / Update PR for GitHub handoff.');
