#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const out = path.join(root, "artifacts/videos/visual-iteration");
const manifest = JSON.parse(
  await fs.readFile(
    path.join(out, "source/DUIT-2026-visual-render.json"),
    "utf8",
  ),
);
if (manifest.partial)
  throw new Error("A partial review is not the final film.");
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const font = (
  await fs.readFile(path.join(root, "scripts/video/fonts/DM-Sans.ttf"))
).toString("base64");
const time = (s) =>
  `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
await fs.writeFile(
  path.join(out, "index.html"),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>DUIT · The card comes first</title><style>@font-face{font-family:DM;src:url(data:font/ttf;base64,${font})}*{box-sizing:border-box}body{margin:0;background:#f6f8f1;color:#183c33;font-family:DM,system-ui,sans-serif}main{max-width:1400px;margin:auto;padding:44px 28px}header{display:flex;justify-content:space-between;align-items:center}.brand{font-size:32px;font-weight:750;letter-spacing:-2px}.brand span{color:#8baa60}.label{font-size:12px;letter-spacing:1.5px;color:#788678}h1{font-size:clamp(32px,5vw,66px);font-weight:500;letter-spacing:-2px;margin:55px 0 24px}video{display:block;width:100%;border-radius:18px;background:#183c33;box-shadow:0 18px 65px #183c3319}p{line-height:1.7;max-width:900px}.links,.chapters{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}a,button{color:inherit;text-decoration:none;border:1px solid #d4ddcf;border-radius:12px;background:transparent;padding:12px 17px;font:inherit;font-size:14px;cursor:pointer}a:hover,button:hover{background:#d8f585}small{display:block;color:#6e7c71;line-height:1.7;margin-top:34px;max-width:1000px}</style></head><body><main><header><div class="brand">duit<span>.</span></div><div class="label">PRIVATE VISUAL REVIEW / SEPTEMBER 2026</div></header><h1>The card comes first.</h1><video id="film" controls preload="metadata" playsinline poster="qa/visual-01.png"><source src="DUIT-2026-visual.mp4" type="video/mp4"></video><p>${time(manifest.seconds)} · A visual wallet. The person, their card, and a short business introduction. Captured from the actual changed app web build and public phone browser.</p><div class="links"><a download href="DUIT-2026-visual.mp4">Download film</a><a href="DUIT-2026-visual-transcript.md">Read transcript</a><a download href="DUIT-2026-visual.srt">Download captions</a></div><div class="chapters">${manifest.scenes.map((s) => `<button data-time="${s.start}">${time(s.start)} · ${esc(s.title)}</button>`).join("")}</div><small>Fictional demonstration profiles and artwork. Generated clear-voice narration. AI remains unconfigured. The closing owner-video and AI suggestions are proposed ideas. This capture does not assert native Android validation, real customers, a sent WhatsApp message, or live AI results. Previous walkthroughs remain unchanged.<br>Media decode, chapter timing, captions and narration provenance were checked. No end-to-end human listening review was performed; subtitle timing is proportional.</small></main><script>document.querySelectorAll('[data-time]').forEach(button=>button.addEventListener('click',()=>{const video=document.getElementById('film');video.currentTime=Number(button.dataset.time);video.play();}));</script></body></html>`,
);
console.log("Built private visual-iteration viewing page.");
