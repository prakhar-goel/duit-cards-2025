#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const out = path.join(root, "artifacts/videos");
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const videos = await Promise.all(
  ["quick", "main"].map(async (cut) =>
    JSON.parse(
      await fs.readFile(
        path.join(out, "source", `DUIT-2026-${cut}-render.json`),
        "utf8",
      ),
    ),
  ),
);
if (videos.some((video) => video.partial))
  throw new Error("Only complete renders belong in the viewing page.");
const time = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
const font = (
  await fs.readFile(path.join(root, "scripts/video/fonts/DM-Sans.ttf"))
).toString("base64");
await fs.writeFile(
  path.join(out, "index.html"),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DUIT 2026 · Private walkthroughs</title><style>
@font-face{font-family:DM;src:url(data:font/ttf;base64,${font}) format('truetype');font-weight:100 1000}*{box-sizing:border-box}body{margin:0;background:#f6f8f1;color:#183c33;font-family:DM,system-ui,sans-serif}main{max-width:1260px;margin:auto;padding:48px 32px 80px}.brand{font-size:34px;font-weight:650;letter-spacing:-2px}.brand b{color:#9ab667}header{display:flex;align-items:center;justify-content:space-between}header span,.eyebrow{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#70836c}h1{font-size:clamp(38px,6vw,70px);line-height:1.05;letter-spacing:-3px;font-weight:500;margin:70px 0 22px;max-width:760px}.intro{max-width:690px;line-height:1.7;color:#6e7c6c;font-size:17px}.note{margin:30px 0 50px;border-left:3px solid #c6e497;padding:4px 20px;max-width:910px;font-size:13px;line-height:1.8;color:#6e7c6c}section{margin:50px 0}section h2{font-size:29px;letter-spacing:-1px;font-weight:500;margin:10px 0 20px}video{width:100%;background:#183c33;border-radius:16px;display:block;box-shadow:0 20px 45px #183c3312}a{color:#365947;text-underline-offset:4px}.links{display:flex;gap:20px;font-size:12px;margin:18px 0 25px}.chapters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.chapters button{background:#fff;border:1px solid #dfe6d6;color:#183c33;font:inherit;text-align:left;font-size:13px;border-radius:9px;padding:13px;cursor:pointer}.chapters button:hover{background:#eaf2db}.chapters button span{display:block;color:#78916a;font-size:10px;margin-bottom:6px}footer{border-top:1px solid #dfe6d6;margin-top:50px;padding-top:24px;color:#7a8974;font-size:12px}@media(max-width:700px){main{padding:28px 20px}header span{font-size:8px}.chapters{grid-template-columns:1fr 1fr}h1{margin-top:48px}.intro{font-size:15px}}
</style></head><body><main><header><div class="brand">duit<b>.</b></div><span>Private review / September 2026</span></header><h1>Make the next<br>meeting count.</h1><p class="intro">Two walkthroughs of the working private pilot: the short version, then the complete story from a useful introduction to a promise kept.</p><p class="note">Actual app web build and browser recordings, with generated narration. Modern profiles and activity are fictional demo data. Archived profiles are historical and included for private review. The application’s AI provider is unconfigured in these recordings; no canned responses are shown as live results.</p>
${videos.map((video) => `<section><div class="eyebrow">${video.cut === "quick" ? "The short version" : "The complete walkthrough"} / ${time(video.seconds)}</div><h2>${esc(video.cut === "quick" ? "A useful next step." : "From hello to follow-through.")}</h2><video id="${video.cut}" controls playsinline preload="metadata" poster="qa/${video.cut}-01.png" src="DUIT-2026-${video.cut}.mp4"></video><div class="links"><a href="DUIT-2026-${video.cut}.mp4" download>Download MP4</a><a href="DUIT-2026-${video.cut}.srt" download>Captions</a><a href="DUIT-2026-${video.cut}-transcript.md">Read transcript</a></div>${video.cut === "main" ? `<div class="chapters">${video.scenes.map((scene) => `<button type="button" data-video="main" data-start="${scene.start}"><span>${time(scene.start)}</span>${esc(scene.title)}</button>`).join("")}</div>` : ""}</section>`).join("")}
<footer>Private artifacts. These videos have not been published. Historical data does not count as current pilot growth.</footer></main><script>for(const button of document.querySelectorAll('[data-video]'))button.addEventListener('click',()=>{const player=document.getElementById(button.dataset.video);player.currentTime=Number(button.dataset.start);player.play();player.scrollIntoView({behavior:'smooth',block:'center'});});</script></body></html>`,
);
console.log(`Created ${path.join(out, "index.html")}`);
