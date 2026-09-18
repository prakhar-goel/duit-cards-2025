# DUIT visual card-first walkthrough

Private review, 18 September 2026. A separate film of the user-requested visual iteration; the earlier movies remain untouched. Planned duration **2:28**. Narration was reviewed and approved before voice generation; final product actions still require real UI capture evidence.

## Visual approach

The actual phone is central and almost full-height. Short headings, ample space and optional companion screenshots from the real three-page flow keep the imagery dominant. No made-up interface, staged cursor or synthetic success result. Source labels distinguish the app web build from the recipient browser. Each recording plays once, then holds. Captions stay below the product.

All modern profiles and media in these captures are fictional demonstration material. The photographed-looking portraits are generated demo artwork, not asserted to be real customers. The visiting-card image is authored digital demo artwork. User-uploaded originals remain separate and preserved. No archived private people are needed for this iteration.

## Approved narration

### 0:00–0:19 · Your card wallet.

Capture: wallet.

DUIT starts with the card. Open your wallet and browse faces, businesses and cards you can recognise. A little less scrolling through job titles; a little more, “Ah, that’s the person I met.” These are fictional demo profiles.

### 0:19–0:35 · First, the person.

Capture: maya-person.

First, the person. A proper portrait, a name, and a short introduction. The aim is to recognise someone in a second. Their entire career can wait politely outside.

### 0:35–0:54 · Then, their card.

Capture: maya-card.

Next, the visiting card. Keep its colours, its layout, and its character. It is the design they chose to share, shown clearly as an image. The original should stay available, not vanish behind a wall of extracted text.

### 0:54–1:12 · Show the business.

Capture: maya-pitch.

Then, a look inside the business. What do they do? Who do they help? What would you talk about next? A short visual pitch and a clear button give the introduction somewhere useful to go.

### 1:12–1:28 · Same rhythm. Different character.

Capture: second-profile.

Another person should feel like another business. Different face, different card, different visual story. The same simple three-page structure holds it together, without dressing every company in exactly the same suit.

### 1:28–1:47 · Keep the conversation.

Capture: meeting-memory.

The meeting still matters. Saved notes, the place, the date, and a promised next step sit behind the card. You can remember the conversation without turning the first hello into paperwork. Memory supports the introduction; it does not take over.

### 1:47–2:05 · Open. Meet. Explore.

Capture: recipient-web.

And the recipient can open the card in a phone browser. No installation before saying hello. Move from the person to the visiting card to the pitch, then choose the next step. This is the actual local web flow.

### 2:05–2:28 · A few next ideas.

Capture: authored proposed-ideas card.

What could come next? Perhaps a short owner-recorded introduction, played only when the visitor chooses. AI could help tidy images and drafts behind the scenes, with review and the original kept safe. Those are ideas to test. AI is not enabled in this demo.

## Capture acceptance

- Wallet shows the changed real visual layout.
- Person, Card and Business pages are actual pages; swipe/tab movement is captured. The Card image must be uncropped and original accessible.
- Business pitch remains short and visual; show the actual CTA opening its real next step without sending a message.
- A second profile has distinct real demo assets and content.
- Meeting memory is a secondary screen, with recorded notes/date/place shown only where implemented.
- Public recipient browser demonstrates the actual same three-page structure and CTA. App-free viewing is not proof that a WhatsApp message was delivered.
- Closing ideas are labelled proposed. AI remains unconfigured. Owner video is an optional idea, not a working feature.

## Reproduction

Run `node scripts/video/visual-prepare.mjs` to generate narration jobs and capture mapping under ignored `artifacts/videos/visual-iteration`. This does not call any provider. Generate the reviewed text through the already authorized AI Voice Generator, clear voice; keep native MP3 provenance. Each chunk is under 500 characters so the full native preview contains the whole passage.

Use the runtime setup in [video README](../scripts/video/README.md), then `node scripts/video/visual-render.mjs --captures .local/visual-video-captures.json`. Optional `--scenes visual-01` produces a review export; it is not the final film. Override `sideFrames` with two actual PNG screenshots to accompany the central real recording. Optional `sourceCrop` removes empty capture padding only; do not crop product content. Final outputs include MP4, SRT, transcript and source manifest.

Verify the completed encode with `node scripts/video/visual-verify.mjs`, then create the private viewing page with `node scripts/video/visual-index.mjs`. The check covers whole-stream decoding, chapter offsets, caption bounds, and exact audio-source transcript matching. Inspect all chapter frames separately. Captions use proportional timing; do not claim a full listening review unless one was performed.

No app provider calls, live messages, publication, or changes to the previous videos are part of this rendering workflow.

## Completed private film

[Play the walkthrough](../artifacts/videos/visual-iteration/index.html) or [open the MP4](../artifacts/videos/visual-iteration/DUIT-2026-visual.mp4): **2:28**, 6.3 MiB, 1080p/30fps, 8 chapters, generated clear-voice narration, captions and transcript.

[Verification](../artifacts/videos/visual-iteration/verification.json) confirms complete stream decode, chapter timing, caption bounds and exact narration provenance. Final chapter contact sheets and representative full-size frames were inspected separately. No end-to-end human listening review was performed; subtitle timing remains proportional. The captured product is the actual app web build and phone browser, labelled throughout. Proposed ideas remain separate from implemented behavior and in-app AI is still unconfigured. Earlier movies remain untouched.
