import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawn, execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const android = path.join(root, "apps/mobile/android");
const signing = path.join(root, ".local/signing");
fs.mkdirSync(signing, { recursive: true, mode: 0o700 });
const javaHome =
  process.env.JAVA_HOME ||
  (fs.existsSync(
    "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home",
  )
    ? "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
    : execFileSync("/usr/libexec/java_home", ["-v", "17"], {
        encoding: "utf8",
      }).trim());
const sdk =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  path.join(os.homedir(), "Library/Android/sdk");
if (!fs.existsSync(sdk))
  throw new Error(
    "Install the Android SDK or set ANDROID_HOME before building.",
  );
const props = path.join(signing, "pilot.properties");
if (!fs.existsSync(props)) {
  const password = crypto.randomBytes(24).toString("hex");
  const key = path.join(signing, "duit-pilot.jks");
  if (fs.existsSync(key))
    throw new Error(
      "A pilot signing key exists without its properties. Restore its saved password; do not replace this identity.",
    );
  execFileSync(
    path.join(javaHome, "bin/keytool"),
    [
      "-genkeypair",
      "-keystore",
      key,
      "-alias",
      "duitpilot",
      "-storepass:env",
      "DUIT_SIGNING_STORE_PASSWORD",
      "-keypass:env",
      "DUIT_SIGNING_KEY_PASSWORD",
      "-keyalg",
      "RSA",
      "-keysize",
      "3072",
      "-validity",
      "10000",
      "-dname",
      "CN=DUIT Private Pilot, OU=Local Development, O=DUIT, C=IN",
    ],
    {
      env: {
        ...process.env,
        DUIT_SIGNING_STORE_PASSWORD: password,
        DUIT_SIGNING_KEY_PASSWORD: password,
      },
      stdio: "inherit",
    },
  );
  fs.writeFileSync(
    props,
    `storeFile=${key}\nstorePassword=${password}\nkeyAlias=duitpilot\nkeyPassword=${password}\n`,
    { mode: 0o600 },
  );
  fs.chmodSync(key, 0o600);
}
fs.writeFileSync(path.join(android, "local.properties"), `sdk.dir=${sdk}\n`);
const lan = Object.entries(os.networkInterfaces())
  .filter(([name]) => !/^(utun|lo|bridge|awdl|llw)/.test(name))
  .flatMap(([, values]) => values || [])
  .find((n) => n.family === "IPv4" && !n.internal)?.address;
const apiUrl =
  process.env.EXPO_PUBLIC_API_URL || `http://${lan || "10.0.2.2"}:48152/api/v1`;
// The user requested one-tap entry in this private demo APK. Never embed an
// operator account or commit its password. Other builds can opt out explicitly.
const credentialsFile = path.join(root, ".local/credentials.json");
const demoAccount =
  process.env.DUIT_DEMO_PREFILL !== "false" && fs.existsSync(credentialsFile)
    ? JSON.parse(fs.readFileSync(credentialsFile, "utf8")).accounts?.find(
        (account) => account.email === "maya@northstar.example",
      )
    : undefined;
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
];
const child = spawn("./gradlew", args, {
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
const apk = path.join(artifacts, "DUIT-2026-Pilot.apk");
fs.copyFileSync(
  path.join(android, "app/build/outputs/apk/release/app-release.apk"),
  apk,
);
const toolVersion = fs
  .readdirSync(path.join(sdk, "build-tools"))
  .filter((v) => /^\d/.test(v))
  .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];
execFileSync(
  path.join(sdk, "build-tools", toolVersion, "apksigner"),
  ["verify", apk],
  { env, stdio: "inherit" },
);
const metadata = {
  builtAt: new Date().toISOString(),
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
  path.join(artifacts, "android-build.json"),
  JSON.stringify(metadata, null, 2) + "\n",
);
console.log(
  `\nVerified APK: ${apk}\nSHA-256: ${metadata.sha256}\nBack up .local/signing privately. Future updates need the same key.`,
);
