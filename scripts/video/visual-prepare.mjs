#!/usr/bin/env node
// Prepares reviewable narration/capture jobs. Never invokes a provider.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { visualVideo } from "./visual-storyboard.mjs";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const out = path.join(root, "artifacts/videos/visual-iteration");
await fs.mkdir(path.join(out, "source"), { recursive: true });
const jobs = visualVideo.scenes.map((scene) => {
  const transcript = scene.narration.replace(/DUIT/g, "Do-it");
  if (transcript.length > 500)
    throw new Error(`${scene.id} exceeds full-preview narration limit`);
  return {
    id: scene.id,
    file: `artifacts/videos/visual-iteration/audio/${scene.id}.mp3`,
    tool: "mcp__codex_apps__ai_voice_generator_create_audio",
    arguments: {
      transcript,
      preview_transcript: transcript,
      voice_id: "clear",
    },
    captions: scene.narration,
  };
});
await fs.writeFile(
  path.join(out, "source/narration-jobs.json"),
  JSON.stringify(jobs, null, 2) + "\n",
);
const captures = Object.fromEntries(
  visualVideo.scenes
    .filter((s) => s.captureKey)
    .map((s) => [
      s.captureKey,
      {
        capture: `artifacts/videos/visual-iteration/captures/${s.captureKey}.mp4`,
        start: 0,
        captureLabel:
          s.captureKey === "recipient-web"
            ? "Actual phone browser · fictional demo"
            : "Actual app web build · fictional demo",
      },
    ]),
);
await fs.writeFile(
  path.join(out, "source/capture-manifest.example.json"),
  JSON.stringify(captures, null, 2) + "\n",
);
const stamp = (t) =>
  `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}`;
let cursor = 0;
let doc = `# DUIT visual card-first walkthrough\n\nPrivate review, 18 September 2026. A separate film of the user-requested visual iteration; the earlier movies remain untouched. Planned duration **${stamp(visualVideo.scenes.reduce((a, s) => a + s.seconds, 0))}**. Narration was reviewed and approved before voice generation; final product actions still require real UI capture evidence.\n\n## Visual approach\n\nThe actual phone is central and almost full-height. Short headings, ample space and optional companion screenshots from the real three-page flow keep the imagery dominant. No made-up interface, staged cursor or synthetic success result. Source labels distinguish the app web build from the recipient browser. Each recording plays once, then holds. Captions stay below the product.\n\nAll modern profiles and media in these captures are fictional demonstration material. The photographed-looking portraits are generated demo artwork, not asserted to be real customers. The visiting-card image is authored digital demo artwork. User-uploaded originals remain separate and preserved. No archived private people are needed for this iteration.\n\n## Approved narration\n\n`;
for (const scene of visualVideo.scenes) {
  doc += `### ${stamp(cursor)}–${stamp(cursor + scene.seconds)} · ${scene.title}\n\nCapture: ${scene.captureKey || "authored proposed-ideas card"}.\n\n${scene.narration}\n\n`;
  cursor += scene.seconds;
}
doc += `## Capture acceptance\n\n- Wallet shows the changed real visual layout.\n- Person, Card and Business pages are actual pages; swipe/tab movement is captured. The Card image must be uncropped and original accessible.\n- Business pitch remains short and visual; show the actual CTA opening its real next step without sending a message.\n- A second profile has distinct real demo assets and content.\n- Meeting memory is a secondary screen, with recorded notes/date/place shown only where implemented.\n- Public recipient browser demonstrates the actual same three-page structure and CTA. App-free viewing is not proof that a WhatsApp message was delivered.\n- Closing ideas are labelled proposed. AI remains unconfigured. Owner video is an optional idea, not a working feature.\n\n## Reproduction\n\nRun \`node scripts/video/visual-prepare.mjs\` to generate narration jobs and capture mapping under ignored \`artifacts/videos/visual-iteration\`. This does not call any provider. Generate the reviewed text through the already authorized AI Voice Generator, clear voice; keep native MP3 provenance. Each chunk is under 500 characters so the full native preview contains the whole passage.\n\nUse the runtime setup in [video README](../scripts/video/README.md), then \`node scripts/video/visual-render.mjs --captures .local/visual-video-captures.json\`. Optional \`--scenes visual-01\` produces a review export; it is not the final film. Override \`sideFrames\` with two actual PNG screenshots to accompany the central real recording. Optional \`sourceCrop\` removes empty capture padding only; do not crop product content. Final outputs include MP4, SRT, transcript and source manifest.\n\nVerify the completed encode with \`node scripts/video/visual-verify.mjs\`, then create the private viewing page with \`node scripts/video/visual-index.mjs\`. The check covers whole-stream decoding, chapter offsets, caption bounds, and exact audio-source transcript matching. Inspect all chapter frames separately. Captions use proportional timing; do not claim a full listening review unless one was performed.\n\nNo app provider calls, live messages, publication, or changes to the previous videos are part of this rendering workflow.\n`;
const verification = await fs
  .readFile(path.join(out, "verification.json"), "utf8")
  .then(JSON.parse)
  .catch(() => null);
if (verification?.results?.[0]) {
  const result = verification.results[0];
  doc += `\n## Completed private film\n\n[Play the walkthrough](../artifacts/videos/visual-iteration/index.html) or [open the MP4](../artifacts/videos/visual-iteration/DUIT-2026-visual.mp4): **${stamp(result.durationSeconds)}**, ${(result.sizeBytes / 1024 / 1024).toFixed(1)} MiB, 1080p/30fps, ${result.chapters} chapters, generated clear-voice narration, captions and transcript.\n\n[Verification](../artifacts/videos/visual-iteration/verification.json) confirms complete stream decode, chapter timing, caption bounds and exact narration provenance. Final chapter contact sheets and representative full-size frames were inspected separately. No end-to-end human listening review was performed; subtitle timing remains proportional. The captured product is the actual app web build and phone browser, labelled throughout. Proposed ideas remain separate from implemented behavior and in-app AI is still unconfigured. Earlier movies remain untouched.\n`;
}
await fs.writeFile(path.join(root, "docs/VISUAL_WALKTHROUGH.md"), doc);
console.log(
  `Prepared ${jobs.length} narration jobs and ${Object.keys(captures).length} capture keys. No provider calls made.`,
);
