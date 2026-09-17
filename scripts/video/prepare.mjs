#!/usr/bin/env node
// Produces reviewable scripts and tool-ready voice jobs; does not call a provider.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { videos, captureRequests } from "./storyboard.mjs";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const destination = path.join(root, "artifacts/videos/source");
await fs.mkdir(destination, { recursive: true });
const time = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
const narrationJobs = [];
for (const [cut, video] of Object.entries(videos))
  for (const scene of video.scenes) {
    const transcript =
      scene.audioTranscript || scene.narration.replace(/DUIT/g, "Do-it");
    if (transcript.length > 500)
      throw new Error(
        `Split ${scene.id} before voice generation: ${transcript.length} characters exceeds the full-preview bound.`,
      );
    const voiceFile = path.join(
      root,
      "artifacts/videos/audio",
      scene.id + ".mp3",
    );
    const voiceSource = await fs
      .readFile(voiceFile.replace(/\.mp3$/, ".source.json"), "utf8")
      .then(JSON.parse)
      .catch(() => null);
    const generated = await fs.access(voiceFile).then(
      () => cut === "proof" || voiceSource?.transcript === transcript,
      () => false,
    );
    narrationJobs.push({
      id: scene.id,
      cut,
      file: `artifacts/videos/audio/${scene.id}.mp3`,
      generated,
      tool: "mcp__codex_apps__ai_voice_generator_create_audio",
      arguments: {
        transcript,
        preview_transcript: transcript,
        voice_id: "clear",
      },
      captions: scene.narration,
      conditional: scene.conditional || null,
    });
  }
await fs.writeFile(
  path.join(destination, "narration-jobs.json"),
  JSON.stringify(narrationJobs, null, 2) + "\n",
);
await fs.writeFile(
  path.join(destination, "capture-requests.json"),
  JSON.stringify(captureRequests, null, 2) + "\n",
);
await fs.writeFile(
  path.join(destination, "capture-manifest.example.json"),
  JSON.stringify(
    Object.fromEntries(
      captureRequests.map((capture) => [
        capture.key,
        {
          capture: `artifacts/videos/captures/${capture.key}.mp4`,
          start: 0,
          captureLabel: `Actual ${capture.surface.toLowerCase()} capture · ${capture.key.startsWith("archive") ? "private historical archive" : "fictional demo"}`,
        },
      ]),
    ),
    null,
    2,
  ) + "\n",
);
const preamble = `# DUIT 2026 narrated walkthrough

Private review. Editorial baseline: **18 September 2026**. The primary story is a working product loop, not a montage of proposed screens. The owner has authorized archived details in private videos. Keep outputs under ignored \`artifacts/videos\`; do not publish them or commit source recordings.

## Deliverables

- Main walkthrough: **7 minutes 45 seconds planned**, ${videos.main.scenes.reduce((sum, scene) => sum + scene.narration.split(/\s+/).length, 0).toLocaleString("en-US")} words, 17 chapters. Actual length may expand slightly to preserve complete speech.
- Quick walkthrough: **90 seconds planned**, 211 words, eight chapters.
- Narrated proof: **10 seconds**, already rendered from the real initial Maya public-profile capture. This is a visual/voice proof, not the finished app walkthrough.

The visual language is warm ivory, deep teal and restrained lime. Local DM Sans, generous space, short titles and a real product viewport do the work. Preserve native taps and scrolling. Still screenshots receive only a gentle camera move. Avoid stock footage, fake cursors, fabricated UI, rotating phone theatrics, applause and loud music. The working product should be the interesting part.

## What must stay honest

- Modern demo people, businesses, events, notes, enquiries and recorded activity are fictional. Their labels remain visible. Seeded actions are not evidence of real demand.
- Historical archive profiles are private, dated records. They do not become current active users, new leads or public cards. The selected gallery has 300 profiles and 630 distinct copied images from 643 source paths.
- The archive filter groups original phone dialling codes, not nationality or verified residence. Prakhar Goel is source ID 6; Amandeep Singh is source ID 2392. Preserve original dates and count definitions.
- A copied or opened WhatsApp link is not proof of delivery, a reply or a sale. Demonstrate local share UI without sending to anyone.
- Recipient details start as a private draft. A forwarded link does not verify identity. The local verification outbox is visibly a development facility, not real email delivery. Hide tokens, verification links/codes, passwords and API keys in every recording.
- Current saved-evidence search is a search of authorized stored facts. Do not call its pre-provider results live AI output.
- The default narration explicitly shows AI as **unconfigured**. Replace the two AI passages only after an approved real provider call, original/result review, and successful capture. Never splice a canned answer into the UI. The server-side paid API budget and this authorized narration tool are separate.
- Admin charts must identify their actual scope. Confirm the chosen demo/live/archive distinction in the final capture. Ordinary operator browsing does not expose another user's private relationship notes.
- Proposed pilot metrics and prices are hypotheses. No projected revenue, valuation, guaranteed sales or claims of a unique feature unsupported by the research.

## Capture handoff

Capture the completed build only after the relevant flow passes QA. Use portrait Android recordings at native resolution, or a phone-browser viewport around 390–430 by 844–932 pixels. A portrait viewport capture is preferable to a stitched full-height webpage. Desktop recordings around 1440 by 900 work well; use browser zoom or focused screenshots when small detail needs emphasis.

Keep one second of stillness before and after a tap sequence. Capture 8–20 seconds of actual action per key; the compositor can hold the last frame without replaying a swipe. Use longer clips for the two founder profiles and claim flow. Remove accidental notifications and secrets before capture, not by moving them into a different public artifact. Do not alter the product UI to simulate success.

| Capture key | Surface | Required action |
|---|---|---|
${captureRequests.map((capture) => `| \`${capture.key}\` | ${capture.surface} | ${capture.action} |`).join("\n")}

## Narration and captions

The proof uses the installed **AI Voice Generator**, \`voice_id: clear\`, with the complete 16-word transcript supplied to both transcript and preview. The generated MP3 has been saved locally. “Do-it” is used only in spoken input to guide pronunciation; captions retain “DUIT”. This is generated narration, not a clone of a real speaker.

All 25 final narration chunks are below 500 characters. Review the text below before generating them. \`node scripts/video/prepare.mjs\` creates \`artifacts/videos/source/narration-jobs.json\`, with full transcript, voice style and target path for each tool call. Generation is not automated by that script. Download each returned native MP3 into its assigned local path; retain response provenance privately. Do not substitute macOS speech for final narration.

Captions are both burned in and delivered as SRT. Initial timing is proportional within each spoken segment; review against the voice and adjust before final delivery. The renderer preserves complete audio, creates MP4 chapters, and also writes a transcript and source manifest. No borrowed background music is included.

## Timed scripts
`;
let document = preamble;
for (const cut of ["main", "quick"]) {
  const video = videos[cut];
  let position = 0;
  document += `\n### ${cut === "main" ? "Main walkthrough" : "Quick walkthrough"}\n\n`;
  for (const scene of video.scenes) {
    document += `#### ${time(position)}–${time(position + scene.seconds)} · ${scene.title.replace(/\n/g, " ")}\n\n`;
    document += `Capture: ${scene.captureKey ? "\`" + scene.captureKey + "\`" : "authored chapter card; pilot proposal"}. Frame: ${scene.frame}.\n\n${scene.narration}\n\n`;
    if (scene.conditional)
      document += `**Conditional:** ${scene.conditional}\n\n`;
    if (scene.approvedAlternative)
      document += `Approved-live alternative, only after evidence exists: “${scene.approvedAlternative}”\n\n`;
    position += scene.seconds;
  }
}
document += `## Evidence and source notes

Product facts come from the running pilot and its local API, not competitor copy: [API contract](API_PILOT.md), [demo and archive provenance](DEMO_DATA.md), [AI provider plan](AI_PROVIDER_PLAN.md), [pilot plan](DUIT_2026_PLAN.md). Capture each claimed action on the completed build; revise narration if the observed behavior differs. The proof image is \`artifacts/qa/shared-profile-phone-initial.png\` and must not stand in for a final native-app recording.

The historical source is the read-only \`artifacts/videos/source/curated-gallery-data.json\` in the restoration repository. The 300-profile and country-code statements refer to this selected collection, not the full historical database. Do not sum per-profile meeting counts and call them unique global meetings.

The 2026 positioning segment is a proposal grounded in the [dated market review](DUIT_2026_MARKET_RESEARCH.md), using official pages checked for that review on 18 September 2026:

- [Blinq AI Notetaker](https://support.blinq.me/en/articles/71264-ai-notetaker-the-basics): notes and next steps already exist in the category.
- [HiHello digital cards](https://www.hihello.com/features/digital-business-cards): app-free receiving is an established expectation.
- [Popl event lead capture](https://popl.co/pages/event-lead-capture): event capture and follow-up are established products.
- [Dex](https://getdex.com/): personal relationship memory and reminders are also an existing category.

These vendor sources establish advertised features, not independently tested performance or DUIT's ability to win. The 20–30-person, two-event pilot and willingness-to-pay interviews are recommended experiments, not market forecasts. Suggested prices remain in the market review rather than being presented as a launched offer in the video.

[DM Sans source and licence](https://github.com/google/fonts/tree/main/ofl/dmsans), retrieved 18 September 2026: the local font is distributed under the SIL Open Font License, retained beside it in \`scripts/video/fonts/OFL.txt\`.

## Build and final acceptance

See [renderer instructions](../scripts/video/README.md). Before delivering the final two cuts: verify each capture is final; confirm names, dates and metric scope; inspect representative frames and every chapter transition; listen end to end; fix caption timing; check no secrets or unauthorized people appear; confirm voice and picture are synchronized; and open the final MP4 on a normal player. Keep a separate silent/no-narration export only if requested. The current proof is not evidence that the final capture-dependent videos are complete.
`;
const verification = await fs
  .readFile(path.join(root, "artifacts/videos/verification.json"), "utf8")
  .then(JSON.parse)
  .catch(() => null);
if (verification?.results?.length) {
  document += `\n## Completed private artifacts\n\n`;
  for (const result of verification.results) {
    const filename = path.basename(result.file);
    const prefix = filename.replace(/\.mp4$/, "");
    document += `- [${result.cut === "main" ? "Detailed walkthrough" : "Quick walkthrough"}](../artifacts/videos/${filename}): **${time(result.durationSeconds)}**, ${(result.sizeBytes / 1024 / 1024).toFixed(1)} MiB, ${result.chapters} chapters; [captions](../artifacts/videos/${prefix}.srt) and [transcript](../artifacts/videos/${prefix}-transcript.md).\n`;
  }
  document += `\nOpen the [private viewing page](../artifacts/videos/index.html) for both cuts and chapter navigation. Outputs are 1080p/30fps H.264 with AAC narration. The final capture source is the real app web build and browser UI, clearly labelled throughout. The locked-Mac fallback is not a final Android recording or native validation. Application AI is visibly unconfigured; no provider output was simulated.\n\n[Media verification](../artifacts/videos/verification.json) confirms complete stream decode, duration/chapter consistency, caption bounds and exact voice transcript provenance. Every chapter contact sheet and representative full-size frames were visually inspected. **No end-to-end human listening review was performed.** Caption timing remains proportional to spoken words rather than word-aligned by a speech recognizer. Keep these limitations with the handoff and review the full audio before external use. These files include privately authorized archival details and are not public release assets.\n`;
}
await fs.writeFile(path.join(root, "docs/WALKTHROUGH_STORYBOARD.md"), document);
console.log(
  `Prepared ${narrationJobs.length} voice jobs, ${captureRequests.length} capture requests, and the reviewable storyboard. No provider calls made.`,
);
