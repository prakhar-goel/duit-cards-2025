import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { networkInterfaces } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const qrcode = require("qrcode-terminal");
const mobilePortStart = numberFromEnv("DUIT_MOBILE_PORT", 48151);
const apiPortStart = numberFromEnv("DUIT_API_PORT", 48152);
const lanIp = findLanIp();
const apiPackagePath = resolve(rootDir, "apps/api/package.json");
const hasApiWorkspace = existsSync(apiPackagePath);
const children = new Set();

const mobilePort = await findAvailablePort(mobilePortStart);
const apiPort = await findAvailablePort(apiPortStart, new Set([mobilePort]));
const apiHost = process.env.DUIT_API_HOST || lanIp || "127.0.0.1";
const apiUrl =
  process.env.EXPO_PUBLIC_API_URL || `http://${apiHost}:${apiPort}/api/v1`;

let dashboardPrintedAfterReady = false;

printDashboard("Starting");

if (hasApiWorkspace) {
  startApi();
}

const expoArgs = [
  "run",
  "start",
  "--workspace",
  "@duit/mobile",
  "--",
  "--web",
  "--go",
  "--port",
  String(mobilePort),
];

const expo = spawnProcess("npm", expoArgs, {
  ...process.env,
  BROWSER: "none",
  EXPO_PUBLIC_API_URL: apiUrl,
});

expo.stdout.on("data", (chunk) => {
  const output = chunk.toString();
  process.stdout.write(output);

  if (
    !dashboardPrintedAfterReady &&
    /(Metro waiting on|Web is waiting on|Logs for your project)/i.test(output)
  ) {
    dashboardPrintedAfterReady = true;
    setTimeout(() => printDashboard("Ready"), 300);
  }
});

expo.stderr.on("data", (chunk) => process.stderr.write(chunk));
expo.on("exit", (code, signal) => {
  stopChildren();
  if (signal) {
    process.exitCode = 0;
  } else {
    process.exitCode = code ?? 1;
  }
});

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => {
    stopChildren(signal);
    process.exit(0);
  });
}

function startApi() {
  const apiPackage = JSON.parse(readFileSync(apiPackagePath, "utf8"));
  const apiScript = apiPackage.scripts?.dev ? "dev" : "start";

  if (!apiPackage.scripts?.[apiScript]) {
    throw new Error(
      "apps/api exists but defines neither a dev nor a start script.",
    );
  }

  const api = spawnProcess(
    "npm",
    ["run", apiScript, "--workspace", apiPackage.name],
    {
      ...process.env,
      PORT: String(apiPort),
    },
  );

  api.stdout.on("data", (chunk) => process.stdout.write(`[api] ${chunk}`));
  api.stderr.on("data", (chunk) => process.stderr.write(`[api] ${chunk}`));
}

function spawnProcess(command, args, env) {
  const child = spawn(command, args, {
    cwd: rootDir,
    env,
    stdio: ["inherit", "pipe", "pipe"],
  });

  children.add(child);
  child.once("exit", () => children.delete(child));
  return child;
}

function stopChildren(signal = "SIGTERM") {
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
}

function printDashboard(status) {
  const localWebUrl = `http://localhost:${mobilePort}`;
  const mobileLanUrl = lanIp
    ? `exp://${lanIp}:${mobilePort}`
    : `exp://127.0.0.1:${mobilePort}`;
  const localApiUrl = `http://localhost:${apiPort}/api/v1`;
  const apiStatus = hasApiWorkspace
    ? localApiUrl
    : `${localApiUrl} (configured only; no apps/api workspace)`;

  console.log(`\n${"═".repeat(72)}`);
  console.log(` Duit Cards local development — ${status}`);
  console.log(`${"─".repeat(72)}`);
  console.log(` Web                 ${localWebUrl}`);
  console.log(` Mobile (Expo Go)    ${mobileLanUrl}`);
  console.log(` Mobile (simulator)  exp://127.0.0.1:${mobilePort}`);
  console.log(` API                  ${apiStatus}`);
  console.log(` Client API setting   ${apiUrl}`);
  console.log(`${"═".repeat(72)}\n`);

  if (status === "Ready") {
    console.log(" Scan with Expo Go:\n");
    qrcode.generate(mobileLanUrl, { small: true });
    console.log(` ${mobileLanUrl}\n`);
  }
}

function numberFromEnv(name, fallback) {
  const value = process.env[name];
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1024 || parsed > 65535) {
    throw new Error(`${name} must be an integer between 1024 and 65535.`);
  }
  return parsed;
}

async function findAvailablePort(startPort, excluded = new Set()) {
  for (let port = startPort; port < Math.min(startPort + 50, 65536); port += 1) {
    if (excluded.has(port)) continue;
    if (await isPortAvailable(port)) return port;
  }

  throw new Error(
    `No available port found between ${startPort} and ${startPort + 49}.`,
  );
}

function isPortAvailable(port) {
  return new Promise((resolvePort) => {
    const server = createServer();
    server.unref();
    server.once("error", () => resolvePort(false));
    server.listen({ host: "0.0.0.0", port }, () => {
      server.close(() => resolvePort(true));
    });
  });
}

function findLanIp() {
  const interfaces = networkInterfaces();
  const preferredNames = ["en0", "en1", "eth0", "wlan0"];

  for (const name of preferredNames) {
    const address = interfaces[name]?.find(isUsableIpv4);
    if (address) return address.address;
  }

  for (const addresses of Object.values(interfaces)) {
    const address = addresses?.find(isUsableIpv4);
    if (address) return address.address;
  }

  return undefined;
}

function isUsableIpv4(address) {
  return address.family === "IPv4" && !address.internal;
}
