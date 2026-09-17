#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { parseEnv } from 'node:util';
import { root, privateWrite, validateDatabase, executable } from './pilot.mjs';
const envFile = path.join(root, '.env.local');
const checkOnly = process.argv.includes('--check');
if (process.argv.includes('--help')) {
  console.log('DUIT local setup: node scripts/setup-pilot.mjs [--check]\nCreates only isolated pilot databases, private configuration and the first local operator.\n--check performs read-only configuration/database checks. No legacy database is changed.');
  process.exit(0);
}
if (process.argv.slice(2).some(a => !['--check'].includes(a))) throw new Error('Unknown setup option. Use --help.');
const token = () => crypto.randomBytes(32).toString('base64url');
function valueLine(key, value) { return `${key}=${JSON.stringify(String(value))}`; }
async function readPrivateConfig() {
  let source = '';
  try { source = await fs.readFile(envFile, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (checkOnly && !source) throw new Error('.env.local is missing. Run npm run setup:pilot.');
  const values = parseEnv(source);
  const defaults = {
    DATABASE_URL: 'postgresql://duit@127.0.0.1:5432/duit_2026_pilot',
    TEST_DATABASE_URL: 'postgresql://duit@127.0.0.1:5432/duit_2026_pilot_test',
    JWT_SECRET: token(), PORT: '48152', PUBLIC_WEB_ORIGIN: values.PUBLIC_WEB_URL || 'http://localhost:48152', API_PUBLIC_ORIGIN: 'http://localhost:48152',
    APP_ORIGIN: 'http://localhost:48152,http://127.0.0.1:48152,http://localhost:48153,http://localhost:48151',
    MEDIA_DIR: path.join(root, '.local/media'), LOCAL_OUTBOX: 'true', PILOT_SEED_PASSWORD: token(),
    OPENAI_API_KEY: '', DUIT_AI_ENABLED: 'false', DUIT_AI_BUDGET_APPROVED_USD: '0', DUIT_AI_IMAGE_ENABLED: 'false'
  };
  if (!checkOnly) {
    const missing = Object.entries(defaults).filter(([key]) => values[key] === undefined || (['JWT_SECRET','PILOT_SEED_PASSWORD'].includes(key) && (!values[key].trim() || /^(generate-|replace-)/i.test(values[key]))));
    if (missing.length) {
      const replaced = new Set(missing.map(([key])=>key));
      source = source.split(/\r?\n/).filter(line=>{const match=line.match(/^\s*(?:export\s+)?([A-Z_]+)\s*=/);return !match || !replaced.has(match[1]);}).join('\n');
      source = `${source.trimEnd()}${source.trim() ? '\n\n' : ''}# Local DUIT 2026 private pilot. Generated values are never committed.\n${missing.map(([key, value]) => valueLine(key, value)).join('\n')}\n`;
      await privateWrite(envFile, source);
    }
    await fs.chmod(envFile, 0o600);
  }
  const env = { ...parseEnv(source), ...process.env };
  validateDatabase(env);
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 random characters. Existing values were not overwritten.');
  if (!checkOnly && (!env.PILOT_SEED_PASSWORD || env.PILOT_SEED_PASSWORD.length < 10)) throw new Error('PILOT_SEED_PASSWORD is missing or too short. Existing configuration was preserved.');
  return env;
}
async function pgBinary(name) {
  const roots = ['/Applications/Postgres.app/Contents/Versions/latest/bin', '/opt/homebrew/opt/postgresql@18/bin', '/opt/homebrew/opt/postgresql@17/bin', '/opt/homebrew/opt/postgresql@16/bin', '/opt/homebrew/opt/postgresql@15/bin', '/opt/homebrew/bin', '/usr/local/bin'];
  const found = await executable(name, roots.map(p => path.join(p, name)));
  if (!found) throw new Error(`${name} was not found. Install/start local PostgreSQL (Postgres.app or Homebrew), then run setup again. No database changes were attempted.`);
  return found;
}
async function command(binary, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', data => { stdout += data.toString(); });
    child.stderr.on('data', data => { stderr += data.toString(); });
    const timer = setTimeout(() => { child.kill('SIGTERM'); reject(new Error(`${path.basename(binary)} did not finish. Check local PostgreSQL availability.`)); }, 15000);
    child.on('error', error => { clearTimeout(timer); reject(new Error(`${path.basename(binary)} could not run (${error.code || 'unknown error'}).`)); });
    child.on('exit', code => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(`${path.basename(binary)} failed. Check that PostgreSQL is running and the local administrator can connect. Existing databases were not removed. ${/password authentication failed/i.test(stderr) ? 'Local administrator authentication was rejected.' : ''}`));
    });
  });
}
function sqlLiteral(value) { return `'${String(value).replace(/'/g, "''")}'`; }
async function ensureDatabases(env) {
  const psql = await pgBinary('psql');
  const pilot = new URL(env.DATABASE_URL), test = new URL(env.TEST_DATABASE_URL);
  if (pilot.hostname !== test.hostname || (pilot.port || '5432') !== (test.port || '5432') || pilot.username !== test.username) throw new Error('Pilot and test databases must use the same local PostgreSQL host, port and application role. Existing configuration was preserved.');
  const role = decodeURIComponent(pilot.username);
  if (!role || !/^[a-z_][a-z0-9_-]{0,62}$/i.test(role)) throw new Error('Use a conventional local PostgreSQL role name in DATABASE_URL.');
  const adminEnv = { ...process.env, PGHOST: pilot.hostname === '[::1]' ? '::1' : pilot.hostname, PGPORT: pilot.port || '5432', PGUSER: env.DUIT_PG_ADMIN_USER || os.userInfo().username, PGCONNECT_TIMEOUT: '5', ...(env.DUIT_PG_ADMIN_PASSWORD ? { PGPASSWORD: env.DUIT_PG_ADMIN_PASSWORD } : {}) };
  const scalar = sql => command(psql, ['-X', '--no-password', '-v', 'ON_ERROR_STOP=1', '-At', '-d', 'postgres', '-c', sql], adminEnv);
  await scalar('SELECT 1');
  if (!await scalar(`SELECT 1 FROM pg_roles WHERE rolname=${sqlLiteral(role)}`)) {
    if (pilot.password) throw new Error('The configured password-based application role does not exist. Create it in PostgreSQL first; setup will not guess or change database passwords.');
    const createuser = await pgBinary('createuser');
    await command(createuser, ['--no-password', '--login', '--no-superuser', '--no-createdb', '--no-createrole', '--', role], adminEnv);
    console.log('Created the local pilot application role.');
  }
  const createdb = await pgBinary('createdb');
  for (const name of ['duit_2026_pilot', 'duit_2026_pilot_test']) {
    if (await scalar(`SELECT 1 FROM pg_database WHERE datname=${sqlLiteral(name)}`)) { console.log(`Preserved existing database: ${name}`); continue; }
    await command(createdb, ['--no-password', '--owner', role, '--', name], adminEnv);
    console.log(`Created isolated database: ${name}`);
  }
}
async function main() {
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 22) throw new Error('Use Node.js 22 or newer for this pilot.');
  const env = await readPrivateConfig();
  if (checkOnly) {
    const pg = (await import('pg')).default;
    for (const key of ['DATABASE_URL', 'TEST_DATABASE_URL']) {
      const pool = new pg.Pool({ connectionString: env[key], connectionTimeoutMillis: 5000 });
      try { await pool.query('SELECT 1'); console.log(`${key}: isolated local database reachable`); }
      finally { await pool.end(); }
    }
    console.log('Read-only setup check passed. No configuration, credentials or data were changed.'); return;
  }
  await fs.mkdir(path.join(root, '.local'), { recursive: true, mode: 0o700 }); await fs.chmod(path.join(root, '.local'), 0o700);
  await fs.mkdir(env.MEDIA_DIR, { recursive: true, mode: 0o700 });
  await ensureDatabases(env);
  Object.assign(process.env, env);
  const { migrate, query, pool } = await import('../apps/api/src/db.js');
  try {
    await migrate();
    const email = 'admin@pilot.duit.test';
    const existing = (await query('SELECT id,role FROM users WHERE email=$1', [email])).rows[0];
    const credentialFile = path.join(root, '.local/credentials.json');
    if (!existing) {
      const bcrypt = (await import('bcryptjs')).default;
      await query("INSERT INTO users(email,password_hash,display_name,role,profile) VALUES($1,$2,'Pilot operator','admin',$3)", [email, await bcrypt.hash(env.PILOT_SEED_PASSWORD, 12), { fullName: 'Pilot operator' }]);
      let credentials = { note: 'Private local pilot accounts. Do not commit or share this file.', accounts: [] };
      try { credentials = JSON.parse(await fs.readFile(credentialFile, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      credentials.accounts ||= [];
      if (!credentials.accounts.some(account => account.email === email)) credentials.accounts.push({ email, password: env.PILOT_SEED_PASSWORD, label: 'Pilot operator' });
      await privateWrite(credentialFile, JSON.stringify(credentials, null, 2) + '\n');
      console.log('Created the first local operator; credentials were written privately.');
    } else {
      if (existing.role !== 'admin') throw new Error('The operator email already exists without the admin role. Setup will not elevate an existing account automatically.');
      console.log('Preserved the existing operator and password.');
    }
    console.log(`\nPrivate config: ${envFile}\nPrivate account details: ${credentialFile}`);
    console.log('Next: build the web app, run npm run pilot, then run npm run seed:pilot in another terminal.');
    console.log('Use npm run phone for background phone access. Internet access starts only when you run npm run phone:internet.');
    console.log(env.DUIT_AI_ENABLED==='true'?'Existing AI settings were preserved; provider calls still require approved credentials and budget.':'AI remains disabled until you supply a key and explicitly approve a spending limit.');
    console.log('Local verification uses the private admin outbox; no email provider or Cloudflare Access is configured.');
  } finally { await pool.end(); }
}
main().catch(error => { console.error(`DUIT setup: ${error.message}`); process.exitCode = 1; });
