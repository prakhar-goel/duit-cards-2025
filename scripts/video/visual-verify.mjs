#!/usr/bin/env node
// Check final encodes and emit real frames for visual review. No provider calls.
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const out = path.join(root, "artifacts/videos/visual-iteration"),
  qa = path.join(out, "qa");
await fs.mkdir(qa, { recursive: true });
const cuts = process.argv.slice(2).length ? process.argv.slice(2) : ["visual"];
function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "",
      stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on(
      "data",
      (chunk) => (stderr = (stderr + chunk).slice(-8000)),
    );
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve(stdout) : reject(new Error(`${command}: ${stderr}`)),
    );
  });
}
const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg",
  ffprobe = process.env.FFPROBE_PATH || "ffprobe";
const summary = [];
for (const cut of cuts) {
  const stem = `DUIT-2026-${cut}`,
    file = path.join(out, stem + ".mp4");
  const manifest = JSON.parse(
    await fs.readFile(path.join(out, "source", stem + "-render.json"), "utf8"),
  );
  assert.equal(
    Boolean(manifest.partial),
    false,
    "A partial review is not a final deliverable.",
  );
  const probe = JSON.parse(
    await run(ffprobe, [
      "-v",
      "error",
      "-show_format",
      "-show_streams",
      "-show_chapters",
      "-of",
      "json",
      file,
    ]),
  );
  const video = probe.streams.find((stream) => stream.codec_type === "video"),
    audio = probe.streams.find((stream) => stream.codec_type === "audio");
  assert.equal(video?.codec_name, "h264");
  assert.equal(video.width, 1920);
  assert.equal(video.height, 1080);
  assert.equal(video.r_frame_rate, "30/1");
  assert.equal(audio?.codec_name, "aac");
  assert.equal(audio.sample_rate, "48000");
  assert.equal(probe.chapters.length, manifest.scenes.length);
  assert.ok(
    Math.abs(Number(probe.format.duration) - manifest.seconds) < 0.5,
    "Final duration must match encoded chapter durations.",
  );
  await run(ffmpeg, [
    "-hide_banner",
    "-v",
    "error",
    "-i",
    file,
    "-map",
    "0:v:0",
    "-map",
    "0:a:0",
    "-f",
    "null",
    "-",
  ]);
  const srt = await fs.readFile(path.join(out, stem + ".srt"), "utf8");
  const seconds = (value) => {
    const [h, m, s, ms] = value.split(/[:,]/).map(Number);
    return h * 3600 + m * 60 + s + ms / 1000;
  };
  const cues = [
    ...srt.matchAll(/(\d\d:\d\d:\d\d,\d{3}) --> (\d\d:\d\d:\d\d,\d{3})/g),
  ].map((match) => [seconds(match[1]), seconds(match[2])]);
  assert.ok(cues.length > 0);
  let previous = 0;
  for (const [start, end] of cues) {
    assert.ok(
      start >= previous - 0.003 &&
        end > start &&
        end <= Number(probe.format.duration) + 0.1,
      "Caption timing must be ordered and contained.",
    );
    previous = end;
  }
  const frames = [];
  for (const [index, scene] of manifest.scenes.entries()) {
    const frame = path.join(
      qa,
      `${cut}-${String(index + 1).padStart(2, "0")}.png`,
    );
    await run(ffmpeg, [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-ss",
      String(scene.start + Math.min(scene.seconds / 2, 8)),
      "-i",
      file,
      "-frames:v",
      "1",
      frame,
    ]);
    frames.push(frame);
    const voice = JSON.parse(
      await fs.readFile(scene.audio.replace(/\.mp3$/, ".source.json"), "utf8"),
    );
    assert.equal(
      voice.transcript,
      scene.narration.replace(/DUIT/g, "Do-it"),
      "Narration audio provenance must match the delivered transcript.",
    );
  }
  const sheet = path.join(qa, `${cut}-contact-sheet.png`),
    rows = Math.ceil(frames.length / 4);
  await run(ffmpeg, [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-framerate",
    "1",
    "-start_number",
    "1",
    "-i",
    path.join(qa, `${cut}-%02d.png`),
    "-vf",
    `scale=480:270,tile=4x${rows}:padding=6:margin=6:color=0xf6f8f1`,
    "-frames:v",
    "1",
    sheet,
  ]);
  summary.push({
    cut,
    file,
    durationSeconds: Number(probe.format.duration),
    sizeBytes: Number(probe.format.size),
    chapters: probe.chapters.length,
    captionCues: cues.length,
    video: "H.264 1920×1080 30fps",
    audio: "AAC 48kHz",
    completeDecode: true,
    narrationProvenanceMatches: true,
    frames,
    contactSheet: sheet,
  });
  console.log(
    `Verified ${cut}: ${Number(probe.format.duration).toFixed(2)}s, ${probe.chapters.length} chapters, ${cues.length} caption cues.`,
  );
}
await fs.writeFile(
  path.join(out, "verification.json"),
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      privacy:
        "Private review; fictional demo and actual app-web/browser source labelled.",
      captionTiming:
        "Proportional draft timing; representative burned-in captions inspected separately.",
      results: summary,
    },
    null,
    2,
  ) + "\n",
);
