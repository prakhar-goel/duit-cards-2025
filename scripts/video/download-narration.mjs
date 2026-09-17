#!/usr/bin/env node
// Save native voice-generator MP3 results already returned by the authorized tool.
// This never sends text to a provider or creates a new audio job.
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const file = process.argv[2];
if (!file)
  throw new Error(
    "Pass the private JSON array of completed voice-generator results.",
  );
const records = JSON.parse(await fs.readFile(path.resolve(root, file), "utf8"));
const allowed = path.join(root, "artifacts/videos/audio");
await fs.mkdir(allowed, { recursive: true });
let saved = 0,
  reused = 0;
async function download(record) {
  const target = path.resolve(root, record.file),
    url = new URL(record.result.preview_url);
  if (!target.startsWith(allowed + path.sep) || path.extname(target) !== ".mp3")
    throw new Error(
      "Narration target must be an MP3 in artifacts/videos/audio.",
    );
  if (
    url.protocol !== "https:" ||
    url.hostname !== "storage.googleapis.com" ||
    !url.pathname.startsWith("/adm--audio-playback--7d--public/mcp-preview/")
  )
    throw new Error(
      "Expected the native MP3 preview URL returned by AI Voice Generator.",
    );
  const metadataPath = target.replace(/\.mp3$/, ".source.json");
  const prior = await fs
    .readFile(metadataPath, "utf8")
    .then(JSON.parse)
    .catch(() => null);
  if (
    prior?.contextId === record.result.context_id &&
    (await fs
      .stat(target)
      .then((stat) => stat.size > 1000)
      .catch(() => false))
  ) {
    reused++;
    return;
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok)
    throw new Error(
      `${record.id}: native audio download failed (${response.status}).`,
    );
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000 || bytes.length > 12 * 1024 * 1024)
    throw new Error(`${record.id}: unexpected audio size.`);
  await fs.writeFile(target + ".tmp", bytes, { mode: 0o600 });
  await fs.rename(target + ".tmp", target);
  await fs.writeFile(
    metadataPath,
    JSON.stringify(
      {
        id: record.id,
        contextId: record.result.context_id,
        voiceId: record.result.voice_id,
        transcript: record.transcript,
        sourceUrl: url.href,
        sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
        savedAt: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
    { mode: 0o600 },
  );
  saved++;
}
for (let index = 0; index < records.length; index += 4)
  await Promise.all(records.slice(index, index + 4).map(download));
console.log(
  JSON.stringify({
    recordedResults: records.length,
    saved,
    reused,
    providerJobsCreated: 0,
  }),
);
