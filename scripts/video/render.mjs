#!/usr/bin/env node
// Local compositor: real UI captures + authored titles + separately generated narration.
// Never records credentials, invokes a paid API, or manufactures application UI.
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { videos } from "./storyboard.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../..");
const argv = process.argv.slice(2),
  option = (flag, fallback) => {
    const index = argv.indexOf(flag);
    return index < 0 ? fallback : argv[index + 1];
  };
const cut = option("--cut", "proof"),
  video = videos[cut];
if (!video) throw new Error("Choose --cut proof, main or quick.");
const selected = option("--scenes", "").split(",").filter(Boolean);
if (selected.some((id) => !video.scenes.some((scene) => scene.id === id)))
  throw new Error("Unknown scene in --scenes selection.");
const authoredScenes = selected.length
  ? video.scenes.filter((scene) => selected.includes(scene.id))
  : video.scenes;
const partial = authoredScenes.length !== video.scenes.length;
const output = path.resolve(root, option("--out", "artifacts/videos"));
const audioDirectory = path.resolve(
  root,
  option("--audio-dir", "artifacts/videos/audio"),
);
const captureManifest = option("--captures", null);
const overrides = captureManifest
  ? JSON.parse(await fs.readFile(path.resolve(root, captureManifest), "utf8"))
  : {};
const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg",
  ffprobe = process.env.FFPROBE_PATH || "ffprobe";
const width = 1920,
  height = 1080,
  fps = 30,
  ink = "#183c33",
  paper = "#f6f8f1",
  muted = "#788678",
  lime = "#d8f585";
const dirs = {
  frames: path.join(output, "frames"),
  clips: path.join(output, "clips"),
  source: path.join(output, "source"),
};
for (const value of Object.values(dirs))
  await fs.mkdir(value, { recursive: true });
const exists = (file) =>
  fs.access(file).then(
    () => true,
    () => false,
  );
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "",
      stderr = "";
    child.stdout.on("data", (data) => (stdout += data));
    child.stderr.on("data", (data) => (stderr = (stderr + data).slice(-12000)));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0
        ? resolve(stdout)
        : reject(
            new Error(`${path.basename(command)} failed (${code}): ${stderr}`),
          ),
    );
  });
}
async function duration(file) {
  return Number(
    (
      await run(ffprobe, [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        file,
      ])
    ).trim(),
  );
}
const require = createRequire(import.meta.url);
let playwright;
for (const candidate of [
  process.env.PLAYWRIGHT_MODULE_PATH,
  "playwright",
  path.join(
    os.homedir(),
    ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
  ),
].filter(Boolean)) {
  try {
    const found = require(candidate);
    if (
      process.env.CHROMIUM_EXECUTABLE_PATH ||
      (await exists(found.chromium.executablePath()))
    ) {
      playwright = found;
      break;
    }
  } catch {}
}
if (!playwright)
  throw new Error(
    "Install Playwright locally, or point PLAYWRIGHT_MODULE_PATH at the bundled runtime package.",
  );
const fontPath = path.join(directory, "fonts/DM-Sans.ttf");
if (!(await exists(fontPath)))
  throw new Error(
    "Missing local licensed DM Sans font. See scripts/video/README.md.",
  );
const fontData = (await fs.readFile(fontPath)).toString("base64");
function boxFor(scene) {
  return scene.frame === "phone"
    ? { x: 1264, y: 122, w: 378, h: 818, r: 28 }
    : scene.frame === "desktop"
      ? { x: 70, y: 238, w: 1780, h: 702, r: 14 }
      : null;
}
function html(scene, box) {
  const desktop = scene.frame === "desktop",
    title = scene.frame === "title";
  const displayTitle = desktop ? scene.title.replace(/\n/g, " ") : scene.title;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
 @font-face{font-family:DM;src:url(data:font/ttf;base64,${fontData}) format('truetype');font-weight:100 1000}*{box-sizing:border-box}html,body{margin:0;width:${width}px;height:${height}px;background:${paper};font-family:DM,sans-serif;color:${ink}}.brand{position:absolute;left:80px;top:49px;font-size:39px;font-weight:650;letter-spacing:-2.4px}.brand b{color:#91aa64}.review{position:absolute;right:80px;top:62px;font-size:15px;letter-spacing:2.3px;text-transform:uppercase;color:${muted}}.copy{position:absolute;left:80px;top:${desktop ? 112 : title ? 240 : 220}px;max-width:${desktop ? 1750 : title ? 1690 : 1010}px}.eyebrow{font-size:16px;letter-spacing:2.5px;color:${muted};font-weight:600;margin-bottom:${desktop ? 16 : 33}px}.title{font-size:${desktop ? 64 : title ? 112 : 100}px;line-height:1.05;letter-spacing:${desktop ? -2.8 : -5}px;font-weight:500;white-space:pre-line}.subtitle{font-size:${desktop ? 22 : 29}px;line-height:1.55;color:${muted};white-space:pre-line;margin-top:${desktop ? 15 : 36}px;max-width:900px}.rule{width:64px;height:6px;border-radius:6px;background:${lime};margin-bottom:29px}.device{position:absolute;left:${box ? box.x - 11 : 0}px;top:${box ? box.y - 11 : 0}px;width:${box ? box.w + 22 : 0}px;height:${box ? box.h + 22 : 0}px;border-radius:${box ? box.r + 11 : 0}px;background:${ink};box-shadow:0 30px 80px #193c3320}.device:after{content:'';position:absolute;inset:10px;background:#fff;border-radius:${box ? box.r : 0}px}.capture-label{position:absolute;left:${box?.x || 80}px;top:${box ? box.y + box.h + 16 : 880}px;font-size:13px;color:${muted};letter-spacing:.3px}.points{display:flex;gap:20px;margin-top:62px}.point{border:1px solid #dce5d3;border-radius:20px;padding:23px 30px;font-size:23px;background:#ffffff80}.footer{position:absolute;bottom:0;width:100%;height:102px;background:${ink}}.footer:before{content:'';display:block;width:90px;height:4px;margin:0 auto;background:${lime};border-radius:0 0 3px 3px}
 </style></head><body><div class="brand">duit<b>.</b></div><div class="review">Private review / September 2026</div><div class="copy">${desktop ? "" : '<div class="rule"></div>'}<div class="eyebrow">${esc(scene.eyebrow)}</div><div class="title">${esc(displayTitle)}</div>${!desktop ? `<div class="subtitle">${esc(scene.subtitle || "")}</div>` : ""}${scene.points ? `<div class="points">${scene.points.map((point) => `<div class="point">${esc(point)}</div>`).join("")}</div>` : ""}</div>${box ? '<div class="device"></div>' : ""}<div class="capture-label">${esc(scene.captureLabel || (box ? "Actual product capture · fictional demo unless labelled archive" : "Pilot direction · hypotheses to test"))}</div><div class="footer"></div></body></html>`;
}
function stamp(seconds, ass = false) {
  const milliseconds = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(milliseconds / 3600000),
    minutes = Math.floor(milliseconds / 60000) % 60,
    secs = Math.floor(milliseconds / 1000) % 60;
  return ass
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(Math.floor((milliseconds % 1000) / 10)).padStart(2, "0")}`
    : `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(milliseconds % 1000).padStart(3, "0")}`;
}
function captionChunks(text) {
  const words = text.split(/\s+/),
    chunks = [];
  let current = [];
  for (const word of words) {
    current.push(word);
    if (current.length >= 12 || (current.length >= 5 && /[.!?]$/.test(word))) {
      chunks.push(current.join(" "));
      current = [];
    }
  }
  if (current.length) chunks.push(current.join(" "));
  return chunks;
}
function wrapCaption(text) {
  const words = text.split(" ");
  if (text.length < 66) return text;
  let split = 1,
    best = Infinity;
  for (let index = 1; index < words.length; index++) {
    const difference = Math.abs(
      words.slice(0, index).join(" ").length -
        words.slice(index).join(" ").length,
    );
    if (difference < best) {
      best = difference;
      split = index;
    }
  }
  return `${words.slice(0, split).join(" ")}\n${words.slice(split).join(" ")}`;
}
function captions(scene, audioLength, lead) {
  const chunks = captionChunks(scene.narration),
    words = chunks.map((chunk) => chunk.split(" ").length),
    total = words.reduce((a, b) => a + b, 0);
  let position = lead;
  return chunks.map((chunk, index) => {
    const next = position + (audioLength * words[index]) / total;
    const value = { start: position, end: next, text: wrapCaption(chunk) };
    position = next;
    return value;
  });
}
function assText(cues) {
  return `[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\nWrapStyle: 0\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,DM Sans,32,&H00F9FCF5,&H00F9FCF5,&H00333C18,&H00333C18,0,0,0,0,100,100,0,0,1,0,0,2,100,100,27,1\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${cues.map((cue) => `Dialogue: 0,${stamp(cue.start, true)},${stamp(cue.end, true)},Default,,0,0,0,,${cue.text.replace(/\\/g, "\\\\").replace(/[{}]/g, "").replace(/\n/g, "\\N")}`).join("\n")}\n`;
}
const filterPath = (file) =>
  file.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
const plans = [];
for (const authored of authoredScenes) {
  const override = overrides[authored.captureKey];
  const scene = {
    ...authored,
    ...(typeof override === "object" ? override : {}),
  };
  const capture =
    typeof override === "string"
      ? override
      : scene.capture ||
        (scene.captureKey
          ? `artifacts/videos/captures/${scene.captureKey}.mp4`
          : null);
  const capturePath = capture ? path.resolve(root, capture) : null;
  const audioPath = scene.audio
    ? path.resolve(root, scene.audio)
    : path.join(audioDirectory, `${scene.id}.mp3`);
  if (!(await exists(audioPath)))
    throw new Error(
      `Missing narration for ${scene.id}: ${audioPath}. Generate the reviewed transcript first.`,
    );
  if (scene.frame !== "title" && (!capturePath || !(await exists(capturePath))))
    throw new Error(
      `Missing actual capture for ${scene.captureKey}. Add it to the capture manifest; placeholder UI is not rendered.`,
    );
  if (scene.frame === "title" && scene.captureKey)
    throw new Error(
      "A product action cannot be silently replaced with a title slide.",
    );
  const audioLength = await duration(audioPath),
    audioLead = scene.audioLead ?? 0.65;
  const seconds = Math.max(scene.seconds, audioLead + audioLength + 0.7);
  plans.push({
    scene,
    capturePath,
    audioPath,
    audioLength,
    audioLead,
    seconds,
    box: boxFor(scene),
  });
}
if (argv.includes("--check")) {
  console.log(
    JSON.stringify(
      {
        cut,
        scenes: plans.length,
        seconds: plans.reduce((sum, plan) => sum + plan.seconds, 0),
        capturesReady: true,
        audioReady: true,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}
const browser = await playwright.chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROMIUM_EXECUTABLE_PATH ||
    playwright.chromium.executablePath(),
});
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: 1,
});
const completed = [],
  allCues = [];
let elapsed = 0;
try {
  for (const plan of plans) {
    const {
      scene,
      box,
      seconds,
      audioLength,
      audioLead,
      audioPath,
      capturePath,
    } = plan;
    const frame = path.join(dirs.frames, `${scene.id}.png`),
      mask = path.join(dirs.frames, `${scene.id}-mask.png`),
      ass = path.join(dirs.source, `${scene.id}.ass`),
      clip = path.join(dirs.clips, `${scene.id}.mp4`);
    await page.setViewportSize({ width, height });
    await page.setContent(html(scene, box), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: frame });
    if (box) {
      await page.setViewportSize({ width: box.w, height: box.h });
      await page.setContent(
        `<html><body style="margin:0;background:black"><div style="width:${box.w}px;height:${box.h}px;background:white;border-radius:${box.r}px"></div></body></html>`,
      );
      await page.screenshot({ path: mask });
    }
    const cues = captions(scene, audioLength, audioLead);
    await fs.writeFile(ass, assText(cues));
    const args = [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-loop",
      "1",
      "-framerate",
      String(fps),
      "-i",
      frame,
      "-i",
      audioPath,
    ];
    const filters = [];
    if (box) {
      const still = /\.(png|jpe?g|webp)$/i.test(capturePath);
      if (still) args.push("-loop", "1", "-framerate", String(fps));
      else if (scene.start) args.push("-ss", String(scene.start));
      args.push(
        "-i",
        capturePath,
        "-loop",
        "1",
        "-framerate",
        String(fps),
        "-i",
        mask,
      );
      let transform = "";
      if (scene.sourceCrop) {
        const c = scene.sourceCrop;
        if (
          ![c.x, c.y, c.width, c.height].every(Number.isInteger) ||
          c.x < 0 ||
          c.y < 0 ||
          c.width < 1 ||
          c.height < 1
        )
          throw new Error("Invalid source crop.");
        transform += `crop=${c.width}:${c.height}:${c.x}:${c.y},`;
      }
      if (scene.crop === "top")
        transform += `crop=iw:min(ih\\,iw*${box.h}/${box.w}):0:0,`;
      transform += `scale=${box.w}:${box.h}:force_original_aspect_ratio=decrease,pad=${box.w}:${box.h}:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1,fps=${fps}`;
      if (still)
        transform += `,zoompan=z='min(1.014\\,1+on*0.00002)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=${box.w}x${box.h}:fps=${fps}`;
      else transform += `,tpad=stop_mode=clone:stop_duration=${seconds}`;
      filters.push(
        `[2:v]${transform},format=rgb24[capture]`,
        `[3:v]format=gray[mask]`,
        `[capture][mask]alphamerge[rounded]`,
        `[0:v][rounded]overlay=${box.x}:${box.y}:shortest=1[base]`,
      );
    } else filters.push("[0:v]null[base]");
    filters.push(
      `[base]fade=t=in:st=0:d=0.3:color=${paper}:alpha=0,fade=t=out:st=${seconds - 0.3}:d=0.3:color=${paper}:alpha=0,ass=filename='${filterPath(ass)}':fontsdir='${filterPath(path.join(directory, "fonts"))}'[video]`,
    );
    filters.push(
      `[1:a]loudnorm=I=-16:TP=-1.5:LRA=11,adelay=${Math.round(audioLead * 1000)}:all=1,apad[audio]`,
    );
    args.push(
      "-filter_complex",
      filters.join(";"),
      "-map",
      "[video]",
      "-map",
      "[audio]",
      "-t",
      seconds.toFixed(3),
      "-r",
      String(fps),
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "19",
      "-threads",
      "2",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-ar",
      "48000",
      "-ac",
      "2",
      "-movflags",
      "+faststart",
      clip,
    );
    await run(ffmpeg, args);
    const encodedSeconds = await duration(clip);
    for (const cue of cues)
      allCues.push({
        ...cue,
        start: cue.start + elapsed,
        end: cue.end + elapsed,
      });
    completed.push({
      id: scene.id,
      title: scene.title.replace(/\n/g, " "),
      seconds: encodedSeconds,
      start: elapsed,
      clip,
      capture: capturePath,
      audio: audioPath,
      narration: scene.narration,
      conditional: scene.conditional || null,
    });
    elapsed += encodedSeconds;
    console.log(`Rendered ${scene.id} (${encodedSeconds.toFixed(1)}s).`);
  }
} finally {
  await browser.close();
}
const name = `DUIT-2026-${cut}${partial ? "-review" : ""}`,
  concat = path.join(dirs.source, `${name}-concat.txt`),
  metadata = path.join(dirs.source, `${name}-chapters.txt`),
  destination = path.join(output, `${name}.mp4`);
await fs.writeFile(
  concat,
  completed
    .map((scene) => `file '${scene.clip.replace(/'/g, "'\\''")}'`)
    .join("\n") + "\n",
);
const metaEscape = (value) =>
  value.replace(/[\\=;#\n]/g, (character) => "\\" + character);
await fs.writeFile(
  metadata,
  `;FFMETADATA1\ntitle=${metaEscape(video.title)}\ncomment=Private review. Generated narration. Fictional demo and historical records labelled.\n${completed.map((scene) => `\n[CHAPTER]\nTIMEBASE=1/1000\nSTART=${Math.round(scene.start * 1000)}\nEND=${Math.round((scene.start + scene.seconds) * 1000)}\ntitle=${metaEscape(scene.title)}\n`).join("")}`,
);
await run(ffmpeg, [
  "-y",
  "-hide_banner",
  "-loglevel",
  "error",
  "-f",
  "concat",
  "-safe",
  "0",
  "-i",
  concat,
  "-i",
  metadata,
  "-map_metadata",
  "1",
  "-map_chapters",
  "1",
  "-c",
  "copy",
  "-movflags",
  "+faststart",
  destination,
]);
await fs.writeFile(
  path.join(output, `${name}.srt`),
  allCues
    .map(
      (cue, index) =>
        `${index + 1}\n${stamp(cue.start)} --> ${stamp(cue.end)}\n${cue.text}`,
    )
    .join("\n\n") + "\n",
);
await fs.writeFile(
  path.join(output, `${name}-transcript.md`),
  `# ${video.title}\n\n${video.privacy}. Generated narration.\n\n${completed.map((scene) => `## ${stamp(scene.start)} — ${scene.title}\n\n${scene.narration}\n`).join("\n")}`,
);
await fs.writeFile(
  path.join(dirs.source, `${name}-render.json`),
  JSON.stringify(
    {
      title: video.title,
      cut,
      partial,
      seconds: elapsed,
      width,
      height,
      fps,
      privacy: video.privacy,
      captionTiming:
        "Draft timing proportional to spoken words; review before final delivery.",
      scenes: completed,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Finished ${destination} (${elapsed.toFixed(1)}s). Captions, transcript and chapters included.`,
);
