import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawn, execFileSync } from "node:child_process";
import { androidTools, requireExistingSigning, demoCredentials, certificateDigest, androidBuildTools } from "./android-build-config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const android = path.join(root, "apps/mobile/android");
const signing = path.join(root, ".local/signing");
fs.mkdirSync(signing, { recursive: true, mode: 0o700 });
const { javaHome, sdk } = androidTools();
requireExistingSigning(signing);
fs.writeFileSync(path.join(android, "local.properties"), `sdk.dir=${sdk}\n`);
const lan = Object.entries(os.networkInterfaces())
  .filter(([name]) => !/^(utun|lo|bridge|awdl|llw)/.test(name))
  .flatMap(([, values]) => values || [])
  .find((n) => n.family === "IPv4" && !n.internal)?.address;
const apiUrl =
  process.env.EXPO_PUBLIC_API_URL || `http://${lan || "10.0.2.2"}:48152/api/v1`;
// The user requested one-tap entry in this private demo APK. Never embed an
// operator account or commit its password. Other builds can opt out explicitly.
const demoAccount = demoCredentials(root);
const env = {
  ...process.env,
  JAVA_HOME: javaHome,
  ANDROID_HOME: sdk,
  EXPO_PUBLIC_API_URL: apiUrl,
  EXPO_PUBLIC_DEMO_EMAIL: demoAccount?.email || "",
  EXPO_PUBLIC_DEMO_PASSWORD: demoAccount?.password || "",
  EXPO_NO_DOTENV: "1",
  NODE_ENV: "production",
};
const artifacts = path.join(root, "artifacts");
fs.mkdirSync(artifacts, { recursive: true });
const logPath = path.join(artifacts, "android-build.log");
const log = fs.createWriteStream(logPath);
console.log(
  `Building standalone DUIT 2026 for Android ARM64.\nInitial server: ${apiUrl}\nYou can change it inside the app.\nBuild log: ${logPath}`,
);
const args = [
  ":app:assembleRelease",
  "-PreactNativeArchitectures=arm64-v8a",
  "--console=plain",
  ...(process.env.CI ? ["--no-daemon", "--max-workers=2"] : []),
];
const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const sourceDirty = Boolean(execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim());
const child = spawn("bash", ["./gradlew", ...args], {
  cwd: android,
  env,
  stdio: ["inherit", "pipe", "pipe"],
});
let tail = "";
for (const stream of [child.stdout, child.stderr])
  stream.on("data", (chunk) => {
    log.write(chunk);
    tail = (tail + chunk.toString()).slice(-12000);
  });
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => child.kill(signal));
const code = await new Promise((resolve, reject) => {
  child.on("error", reject);
  child.on("exit", resolve);
});
log.end();
if (code !== 0) {
  console.error(tail);
  process.exit(Number(code) || 1);
}
const apk = path.join(artifacts, demoAccount ? "DUIT-2026-Private.apk" : "DUIT-2026-Pilot.apk");
fs.copyFileSync(
  path.join(android, "app/build/outputs/apk/release/app-release.apk"),
  apk,
);
const bundledCode = execFileSync("/usr/bin/unzip", ["-p", apk, "assets/index.android.bundle"], { maxBuffer: 32 * 1024 * 1024 });
if (!bundledCode.includes(Buffer.from(apiUrl))) {
  throw new Error("APK verification failed: the requested server address is missing from the compiled bundle.");
}
const androidTool = androidBuildTools(sdk);
const signingOutput = execFileSync(
  androidTool("apksigner"),
  ["verify", "--print-certs", apk], { env, encoding: "utf8" },
);
let signingCertificateSha256;
try {
  signingCertificateSha256 = certificateDigest(signingOutput, process.env.DUIT_SIGNING_CERT_SHA256);
} catch (error) {
  console.error("Android build-tools 35 certificate verification output:", signingOutput);
  throw error;
}
const badging = execFileSync(androidTool("aapt"), ["dump", "badging", apk], { env, encoding: "utf8" });
const appConfig = JSON.parse(fs.readFileSync(path.join(root, 'apps/mobile/app.json'), 'utf8')).expo;
const packageName = badging.match(/^package: name='([^']+)'/m)?.[1];
const version = badging.match(/versionName='([^']+)'/)?.[1];
const versionCode = Number(badging.match(/versionCode='([^']+)'/)?.[1]);
if (packageName !== 'io.duit.ecards.pilot' || version !== appConfig.version || versionCode !== appConfig.android.versionCode) {
  throw new Error('APK package/version differs from app.json. Keep Android and Expo versions in sync.');
}
const metadata = {
  builtAt: new Date().toISOString(),
  sourceCommit, sourceDirty, version, versionCode, signingCertificateSha256,
  prefilledLogin: Boolean(demoAccount),
  package: "io.duit.ecards.pilot",
  architecture: "arm64-v8a",
  initialApiUrl: apiUrl,
  sha256: crypto
    .createHash("sha256")
    .update(fs.readFileSync(apk))
    .digest("hex"),
  bytes: fs.statSync(apk).size,
};
fs.writeFileSync(
  path.join(artifacts, demoAccount ? "android-build-private.json" : "android-build.json"),
  JSON.stringify(metadata, null, 2) + "\n",
);
console.log(
  `\nVerified APK: ${apk}\nSHA-256: ${metadata.sha256}\nBack up .local/signing privately. Future updates need the same key.`,
);
