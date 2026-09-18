#!/usr/bin/env node
import fs from 'node:fs/promises';
import { constants as fsConstants, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
import { promisify, parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const exec = promisify(execFile);
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = fileURLToPath(import.meta.url);
const require = createRequire(import.meta.url);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const stateDir = path.resolve(process.env.DUIT_PILOT_STATE_DIR || path.join(root, '.local/pilot'));
const stateFile = path.join(stateDir, 'state.json');
const controlFile = path.join(stateDir, 'control.json');
const logFile = path.join(stateDir, 'runtime.log');
export async function privateWrite(filename, content) {
  await fs.mkdir(path.dirname(filename), { recursive: true, mode: 0o700 });
  const temporary = `${filename}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(temporary, content, { mode: 0o600 });
  await fs.chmod(temporary, 0o600);
  await fs.rename(temporary, filename);
}
export function validateDatabase(env) {
  for (const [key, name] of [['DATABASE_URL', 'duit_2026_pilot'], ['TEST_DATABASE_URL', 'duit_2026_pilot_test']]) {
    const value = env[key];
    if (!value) throw new Error(`${key} is missing. Run npm run setup:pilot.`);
    let url;
    try { url = new URL(value); } catch { throw new Error(`${key} is not a valid database URL.`); }
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.pathname !== `/${name}`) throw new Error(`${key} must name the isolated ${name} database. The original databases will not be changed.`);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error(`${key} must use local PostgreSQL for this local pilot launcher.`);
  }
}
export async function config() {
  let values;
  try { values = parseEnv(await fs.readFile(path.join(root, '.env.local'), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') throw new Error('Private configuration is missing. Run npm run setup:pilot first.'); throw error; }
  const env = { ...values, ...process.env };
  validateDatabase(env);
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32 || /^(generate-|replace-)/i.test(env.JWT_SECRET)) throw new Error('JWT_SECRET must be a random private value of at least 32 characters. Run setup:pilot or repair .env.local.');
  return env;
}
export function lanAddress() {
  const interfaces = os.networkInterfaces();
  const usable = address => address.family === 'IPv4' && !address.internal && !address.address.startsWith('169.254.');
  for (const name of ['en0', 'en1', 'eth0', 'wlan0', ...Object.keys(interfaces)]) {
    const address = interfaces[name]?.find(usable);
    if (address) return address.address;
  }
  return null;
}
function portValue(env, key, fallback) {
  const value = Number(env[key] || fallback);
  if (!Number.isInteger(value) || value < 1024 || value > 65535) throw new Error(`${key} must be a port between 1024 and 65535.`);
  return value;
}
export async function executable(name, extras = []) {
  const candidates = name.includes('/') ? [name] : [...(process.env.PATH || '').split(path.delimiter).map(dir => path.join(dir, name)), ...extras];
  for (const candidate of candidates) {
    try { await fs.access(candidate, fsConstants.X_OK); return candidate; } catch { /* Try the next configured installation. */ }
  }
  return null;
}
async function cloudflared(env) {
  const binary = await executable(env.CLOUDFLARED_BIN || 'cloudflared', [
    '/opt/homebrew/bin/cloudflared', '/usr/local/bin/cloudflared',
    '/Volumes/UserData/prakhargoel/Development/misc/duit-cards/.local/tools/cloudflared',
    path.join(root, '.local/tools/cloudflared')
  ]);
  if (!binary) throw new Error('cloudflared is not installed. Install the official cloudflared package (for example: brew install cloudflared), or set CLOUDFLARED_BIN to an existing trusted installation. No download was attempted.');
  return binary;
}
async function readState() { try { return JSON.parse(await fs.readFile(stateFile, 'utf8')); } catch { return null; } }
async function ownedRuntime(state) {
  if (!state || state.root !== root || !Number.isInteger(state.pid) || state.pid < 2 || !/^[a-f0-9-]{36}$/.test(state.nonce || '')) return false;
  try {
    process.kill(state.pid, 0);
    const { stdout } = await exec('/bin/ps', ['-p', String(state.pid), '-o', 'command='], { timeout: 3000 });
    return stdout.includes(script) && stdout.includes(`--runtime-token=${state.nonce}`);
  } catch { return false; }
}
async function health(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(1200) });
    if (!response.ok) return null;
    const data = await response.json();
    return data.service === 'duit-private-pilot' ? data : { otherService: true };
  } catch { return null; }
}
async function ensureInviteCode() {
  const filename = path.join(root, '.env.local');
  const original = await fs.readFile(filename, 'utf8');
  const values = parseEnv(original);
  if (values.PILOT_INVITE_CODE?.trim() || process.env.PILOT_INVITE_CODE?.trim()) return;
  const code = crypto.randomBytes(24).toString('base64url');
  const lines = original.split(/\r?\n/).filter(line => !/^\s*(?:export\s+)?PILOT_INVITE_CODE\s*=/.test(line));
  await privateWrite(filename, `${lines.join('\n').trimEnd()}\n# Private invitation code for the internet pilot. Do not publish.\nPILOT_INVITE_CODE=${code}\n`);
  console.log('A private invitation code was saved in .env.local. Existing users can sign in normally.');
}
function printStatus(state) {
  if (!state) { console.log('DUIT pilot is not managed by this launcher. Run npm run phone or npm run pilot.'); return; }
  const urls = state.urls || {};
  console.log(`\nDUIT 2026 private pilot — ${state.status}${state.background ? ' · background' : ' · foreground'}`);
  console.log(`Local on this Mac:  ${urls.local || 'Starting…'}`);
  console.log(`Local Wi-Fi phone:  ${urls.lan || 'No usable Wi-Fi/LAN IPv4 address detected.'}`);
  console.log(`Internet phone:     ${urls.internet || (state.internet?.status === 'starting' ? 'Waiting for the HTTPS connection…' : 'Not running. Use npm run phone:internet when needed.')}`);
  const base = urls.internet || urls.lan || urls.local;
  if (base) {
    console.log(`App server address: ${base}`);
    console.log(`Admin:              ${base}/admin`);
    console.log(`Sample card:        ${base}/c/maya-desai-demo`);
    console.log(`Download APK:       ${base}/download`);
  }
  if (state.mode === 'dev') console.log(`Web editor preview: ${state.dev?.web}\nMobile dev server:  ${state.dev?.expo}`);
  if (state.api && !state.api.owned) console.log('API reuse: this server was started elsewhere. This launcher will not stop or reconfigure it.');
  if (state.error) console.log(`Status detail:      ${state.error}`);
  if (state.internet?.status === 'connecting') console.log('The tunnel URL is available; Cloudflare is still finishing the connection.');
  console.log('Keep the Mac awake, online and its lid open. Wi-Fi isolation can block local phone access.');
  console.log(`Private account details: ${path.join(root, '.local/credentials.json')}`);
  console.log(`Logs: ${state.logPath || logFile}`);
  console.log('Stop managed services: npm run phone:stop\n');
}
async function lock() {
  await fs.mkdir(stateDir, { recursive: true, mode: 0o700 });
  const filename = path.join(stateDir, 'launch.lock');
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const handle = await fs.open(filename, 'wx', 0o600);
      await handle.writeFile(JSON.stringify({ pid: process.pid, root })); await handle.close();
      return async () => { try { const data = JSON.parse(await fs.readFile(filename, 'utf8')); if (data.pid === process.pid) await fs.unlink(filename); } catch { /* Already released. */ } };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      let data;
      try { data = JSON.parse(await fs.readFile(filename, 'utf8')); } catch { throw new Error(`Another launch is being prepared. If no launcher is running, remove ${filename}.`); }
      try { process.kill(data.pid, 0); throw new Error('Another launcher command is still starting. Try status in a moment.'); }
      catch (err) { if (err.code === 'ESRCH') { await fs.unlink(filename); continue; } throw err; }
    }
  }
  throw new Error('Could not acquire the launcher lock.');
}
async function waitForState(predicate, { timeout = 90000, nonce, announceInternet = true } = {}) {
  const deadline = Date.now() + timeout; let shownUrl = false;
  while (Date.now() < deadline) {
    const state = await readState();
    if (state && (!nonce || state.nonce === nonce)) {
      if (announceInternet && state.urls?.internet && !shownUrl) { console.log(`Internet address: ${state.urls.internet}`); shownUrl = true; }
      if (predicate(state)) return state;
      if (state.internet?.status === 'failed' && state.error) throw new Error(`${state.error} Local status is available via phone:status.`);
      if (state.status === 'failed') throw new Error(`${state.error || 'The pilot could not start.'} See ${logFile}`);
    }
    await sleep(300);
  }
  throw new Error(`The launcher is still starting. Run npm run phone:status and inspect ${logFile}.`);
}
async function sendControl(state, action) {
  if (!await ownedRuntime(state)) throw new Error('The saved process does not match this project launcher. No process was signalled.');
  await privateWrite(controlFile, JSON.stringify({ nonce: state.nonce, action, issuedAt: new Date().toISOString() }));
}
async function startBackground(internet = false) {
  const release = await lock();
  try {
    const current = await readState();
    if (await ownedRuntime(current)) {
      if (internet && !current.urls?.internet) {
        if (!current.api?.owned) throw new Error('The API was started outside this launcher. Stop it in its original terminal, then run npm run phone:internet again. No unrelated process was stopped.');
        await cloudflared(await config()); await ensureInviteCode();
        console.log('Starting the requested HTTPS internet connection…');
        await sendControl(current, 'internet-start');
        printStatus(await waitForState(s => Boolean(s.urls?.internet) && s.status === 'ready', { nonce: current.nonce }));
      } else printStatus(current);
      return;
    }
    const env = await config();
    const port = portValue(env, 'DUIT_API_PORT', env.PORT || 48152);
    const existing = await health(port);
    if (internet && existing) throw new Error('An API is already running outside this launcher. Stop it in its original terminal, then run phone:internet; internet mode must restart its own API with private invitation settings.');
    if (internet) { await cloudflared(env); await ensureInviteCode(); }
    const nonce = crypto.randomUUID();
    const handle = await fs.open(logFile, 'a', 0o600); await fs.chmod(logFile, 0o600);
    const child = spawn(process.execPath, [script, 'supervise', `--runtime-token=${nonce}`, '--background', ...(internet ? ['--internet'] : [])], { cwd: root, env: process.env, detached: true, stdio: ['ignore', handle.fd, handle.fd] });
    child.unref(); await handle.close();
    console.log(internet ? 'Starting DUIT and waiting for its HTTPS connection…' : 'Starting DUIT in the background…');
    const state = await waitForState(s => s.status === 'ready' && (!internet || Boolean(s.urls?.internet)), { nonce });
    printStatus(state);
  } finally { await release(); }
}
async function stopManaged() {
  const state = await readState();
  if (!await ownedRuntime(state)) { console.log('No matching managed DUIT process is running. Unrelated servers were left alone.'); return; }
  process.kill(state.pid, 'SIGTERM');
  for (let i = 0; i < 50; i++) { if (!await ownedRuntime(state)) { console.log('Managed DUIT services stopped.'); return; } await sleep(200); }
  console.log('Shutdown is still in progress. No force-kill was sent. Check phone:status and the private log.');
}
async function supervise({ nonce, background = false, dev = false, internet = false }) {
  let env = await config();
  const port = portValue(env, 'DUIT_API_PORT', env.PORT || 48152);
  const webPort = portValue(env, 'DUIT_WEB_PORT', 48153), mobilePort = portValue(env, 'DUIT_MOBILE_PORT', 48151);
  if (dev && new Set([port, webPort, mobilePort]).size !== 3) throw new Error('API, Vite and Expo ports must be different.');
  const lan = lanAddress();
  const localOrigin = `http://localhost:${port}`, lanOrigin = lan ? `http://${lan}:${port}` : null;
  const phoneOrigin = env.DUIT_LAN_HOST ? `http://${env.DUIT_LAN_HOST}:${port}` : lanOrigin || localOrigin;
  let state = { schemaVersion: 1, root, nonce, pid: process.pid, background, mode: dev ? 'dev' : 'local', status: 'starting', startedAt: new Date().toISOString(), api: { port, owned: false }, urls: { local: localOrigin, lan: lanOrigin, internet: null }, internet: { status: 'stopped' }, logPath: logFile, dev: dev ? { web: `http://localhost:${webPort}`, expo: `exp://${lan || '127.0.0.1'}:${mobilePort}` } : undefined };
  const children = new Set(); let apiChild, tunnelChild, shuttingDown = false, busy = false, poll, tunnelBuffer = '';
  let saveQueue = Promise.resolve();
  const save = () => { state.updatedAt = new Date().toISOString(); const content = JSON.stringify(state, null, 2) + '\n'; saveQueue = saveQueue.then(() => privateWrite(stateFile, content)); return saveQueue; };
  await save();
  function child(command, args, options = {}) {
    const proc = spawn(command, args, { cwd: options.cwd || root, env: options.env || env, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
    proc.expectedStop = false; children.add(proc);
    proc.stdout?.on('data', data => { if (options.onData) options.onData(data.toString()); else process.stdout.write(`[${options.label || 'pilot'}] ${data}`); });
    proc.stderr?.on('data', data => { if (options.onData) options.onData(data.toString()); else process.stderr.write(`[${options.label || 'pilot'}] ${data}`); });
    proc.on('error', error => { void fatal(new Error(`${options.label || 'Child'} could not start: ${error.code || 'execution failed'}`)); });
    proc.on('exit', (code, signal) => { children.delete(proc); if (!shuttingDown && !proc.expectedStop) void fatal(new Error(`${options.label || 'Child'} exited (${signal || code}). See the private log.`)); });
    return proc;
  }
  async function terminate(proc) {
    if (!proc || proc.exitCode !== null || proc.signalCode !== null) return;
    proc.expectedStop = true;
    try { if (process.platform === 'win32') proc.kill('SIGTERM'); else process.kill(-proc.pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
    for (let i = 0; i < 50 && proc.exitCode === null && proc.signalCode === null; i++) await sleep(100);
    if (proc.exitCode === null && proc.signalCode === null) throw new Error('An owned child is still shutting down. No unrelated process was stopped.');
  }
  async function apiReady() {
    for (let i = 0; i < 100; i++) { if (shuttingDown) throw new Error('Startup cancelled.'); const status = await health(port); if (status && !status.otherService) return; await sleep(100); }
    throw new Error(`The API did not become ready on port ${port}.`);
  }
  async function startApi(origin, replace = false) {
    if (replace) await terminate(apiChild);
    const allowed = new Set((env.APP_ORIGIN || '').split(',').filter(Boolean));
    for (const url of [localOrigin, lanOrigin, origin, `http://localhost:${webPort}`, `http://127.0.0.1:${webPort}`, `http://localhost:${mobilePort}`, `http://127.0.0.1:${mobilePort}`]) if (url) allowed.add(url);
    const apiEnv = { ...env, PORT: String(port), HOST: '0.0.0.0', API_PUBLIC_ORIGIN: origin, PUBLIC_WEB_ORIGIN: origin, PUBLIC_WEB_URL: origin, APP_ORIGIN: [...allowed].join(',') };
    apiChild = child(process.execPath, [path.join(root, 'apps/api/src/server.js')], { env: apiEnv, label: 'api' });
    state.api = { port, owned: true, pid: apiChild.pid }; await save(); await apiReady();
  }
  async function enableInternet() {
    if (tunnelChild || state.urls.internet) return;
    if (!state.api.owned) throw new Error('Internet mode cannot reconfigure an externally started API. Stop that API in its own terminal, then start phone:internet.');
    env = await config(); if (!env.PILOT_INVITE_CODE?.trim()) throw new Error('Internet mode requires a private invitation code. Run phone:internet to create one.');
    const binary = await cloudflared(env);
    state.internet = { status: 'starting' }; state.status = 'starting'; state.error = null; await save();
    await startApi(phoneOrigin, true);
    let resolveUrl, rejectUrl;
    const urlPromise = new Promise((resolve, reject) => { resolveUrl = resolve; rejectUrl = reject; });
    const timer = setTimeout(() => rejectUrl(new Error('Cloudflare did not announce a URL within 75 seconds. Check the private tunnel log.')), 75000);
    tunnelBuffer = '';
    const tunnelConfig = path.join(stateDir, 'cloudflared.yml'); await privateWrite(tunnelConfig, '{}\n');
    tunnelChild = child(binary, ['tunnel', '--config', tunnelConfig, '--no-autoupdate', '--protocol', 'http2', '--metrics', '127.0.0.1:0', '--url', `http://127.0.0.1:${port}`], { label: 'cloudflared', onData: data => {
      process.stdout.write(`[cloudflared] ${data}`); tunnelBuffer = (tunnelBuffer + data).slice(-32000);
      const match = tunnelBuffer.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com\b/i);
      if (match) resolveUrl(match[0]);
      if (/Registered tunnel connection/i.test(tunnelBuffer)) { state.internet.status = 'connected'; void save(); }
    } });
    try {
      const url = await urlPromise; clearTimeout(timer);
      state.urls.internet = url; state.internet.url = url; if (state.internet.status !== 'connected') state.internet.status = 'connecting'; state.mode = 'internet'; await save();
      console.log(`Internet server address: ${url}`);
      await startApi(url, true); state.status = 'ready'; await save();
      console.log('Internet links are ready. The URL changes after a new tunnel. Cloudflare Access is not configured; DUIT account sign-in and invitation checks apply.');
    } catch (error) { clearTimeout(timer); await terminate(tunnelChild).catch(() => {}); tunnelChild = null; state.urls.internet = null; state.internet = { status: 'failed' }; state.status = 'ready'; state.error = error.message; await save(); throw error; }
  }
  async function disableInternet() {
    await terminate(tunnelChild); tunnelChild = null; state.urls.internet = null; state.internet = { status: 'stopped' }; state.mode = dev ? 'dev' : 'local'; state.error = null;
    env = await config(); if (state.api.owned) await startApi(phoneOrigin, true); state.status = 'ready'; await save();
  }
  async function shutdown(exitCode = 0) {
    if (shuttingDown) return; shuttingDown = true; clearInterval(poll); state.status = exitCode ? 'failed' : 'stopping'; await save().catch(() => {});
    for (const proc of [...children]) await terminate(proc).catch(error => console.error(error.message));
    state.status = exitCode ? 'failed' : 'stopped'; state.urls.internet = null; state.internet.status = 'stopped'; await save().catch(() => {}); process.exit(exitCode);
  }
  async function fatal(error) { if (shuttingDown) return; state.error = error.message; console.error(error.message); await shutdown(1); }
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => { void shutdown(); });
  try {
    const existing = await health(port);
    if (existing?.otherService) throw new Error(`Port ${port} is occupied by a different service. Stop it yourself or choose DUIT_API_PORT.`);
    if (existing) { if (internet) throw new Error('An external API already occupies this port. Internet mode requires ownership of its API.'); state.api.owned = false; }
    else await startApi(phoneOrigin);
    if (!existsSync(path.join(root, 'apps/web/dist/index.html'))) console.warn('Web build is absent. Build it with npm run build:public before the full browser experience.');
    if (dev) {
      const vite = path.join(path.dirname(require.resolve('vite/package.json')), 'bin/vite.js');
      child(process.execPath, [vite, '--host', '0.0.0.0', '--port', String(webPort), '--strictPort'], { cwd: path.join(root, 'apps/web'), env: { ...env, DUIT_API_PORT: String(port) }, label: 'web' });
      const expo = path.join(path.dirname(require.resolve('expo/package.json', { paths: [path.join(root, 'apps/mobile')] })), 'bin/cli');
      child(process.execPath, [expo, 'start', '--lan', '--port', String(mobilePort)], { cwd: path.join(root, 'apps/mobile'), env: { ...env, EXPO_PUBLIC_API_URL: `${phoneOrigin}/api/v1`, EXPO_NO_DOTENV: '1', BROWSER: 'none' }, label: 'expo' });
    }
    if (internet) await enableInternet(); else { state.status = 'ready'; await save(); }
    printStatus(state);
    poll = setInterval(async () => {
      if (busy || shuttingDown) return; busy = true;
      try {
        let command; try { command = JSON.parse(await fs.readFile(controlFile, 'utf8')); } catch { return; }
        await fs.unlink(controlFile).catch(() => {});
        if (command.nonce !== nonce) return;
        if (command.action === 'internet-start') await enableInternet();
        else if (command.action === 'internet-stop') await disableInternet();
      } catch (error) { state.error = error.message; state.status = 'ready'; await save(); console.error(error.message); }
      finally { busy = false; }
    }, 500);
  } catch (error) { await fatal(error); }
}
function help() {
  console.log('DUIT pilot commands:\n  start            Foreground packaged API + website\n  dev              Foreground API + Vite + Expo\n  phone            Persistent local phone server\n  status           Show local and internet addresses\n  stop             Stop only this launcher\n  internet         Start a requested Cloudflare quick tunnel\n  internet:stop    Stop internet access, keep local phone server\n\nPrivate configuration: .env.local; private logs/state: .local/pilot.');
}
async function main() {
  const command = process.argv[2] || 'start';
  if (['--help', '-h', 'help'].includes(command)) return help();
  if (command === 'supervise') {
    const nonce = process.argv.find(a => a.startsWith('--runtime-token='))?.split('=')[1];
    if (!/^[a-f0-9-]{36}$/.test(nonce || '')) throw new Error('Internal runtime token missing.');
    return supervise({ nonce, background: process.argv.includes('--background'), dev: process.argv.includes('--dev'), internet: process.argv.includes('--internet') });
  }
  if (command === 'phone') return startBackground(false);
  if (command === 'internet') return startBackground(true);
  if (command === 'stop') return stopManaged();
  if (command === 'status') {
    const state = await readState();
    if (await ownedRuntime(state)) printStatus(state);
    else {
      const env = await config(); const port = portValue(env, 'DUIT_API_PORT', env.PORT || 48152); const running = await health(port); const lan = lanAddress();
      if (running && !running.otherService) printStatus({ status: 'ready · externally started', urls: { local: `http://localhost:${port}`, lan: lan ? `http://${lan}:${port}` : null }, api: { owned: false } });
      else printStatus(null);
    }
    return;
  }
  if (command === 'internet:stop') {
    const state = await readState(); if (!await ownedRuntime(state)) { console.log('No managed internet tunnel is running.'); return; }
    if (!state.urls?.internet && state.internet?.status !== 'starting') { printStatus(state); return; }
    await sendControl(state, 'internet-stop'); printStatus(await waitForState(s => !s.urls?.internet && s.internet?.status === 'stopped' && s.status === 'ready', { nonce: state.nonce, announceInternet: false })); return;
  }
  if (command === 'start' || command === 'dev') {
    const current = await readState(); if (await ownedRuntime(current)) { printStatus(current); console.log('A managed pilot is already running. Stop it before changing foreground/development modes.'); return; }
    const nonce = crypto.randomUUID();
    const child = spawn(process.execPath, [script, 'supervise', `--runtime-token=${nonce}`, ...(command === 'dev' ? ['--dev'] : [])], { cwd: root, env: process.env, stdio: 'inherit' });
    for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => { if (child.exitCode === null) child.kill('SIGTERM'); });
    child.on('error', error => { console.error(`Launcher could not start: ${error.code || 'unknown error'}`); process.exitCode = 1; });
    child.on('exit', code => { process.exitCode = code || 0; }); return;
  }
  throw new Error(`Unknown command: ${command}. Use --help.`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === script) main().catch(error => { console.error(`DUIT: ${error.message}`); process.exitCode = 1; });
