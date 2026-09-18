# DUIT · visual card-first iteration

18 September 2026. User feedback is recorded verbatim in `PRODUCT_INPUT_LOG.md`; current direction is in `PRD.md` version 0.4.

## What changed

The business card is the primary visual object. The viewing rhythm is **Person → Card → Business**: recognise the person, see the distinctive original card, then explore a short visual pitch and take an action. Search and relationship memory support the introduction instead of dominating its first screen.

The app and app-free recipient website share this three-page rhythm. The existing uploader can resize/recompress artwork into JPEG; “original” means the complete supplied design rather than an AI reconstruction, not a byte-for-byte archival backup. Landscape and portrait cards keep their proportions; the card artwork is separate from a portrait and a business cover. Six fictional brands demonstrate different typography, palettes and formats. No real archived card was redesigned or relabelled as a new business. Existing old DUIT restoration and archive files are untouched.

Backend changes are additive: `cards.business_card_url`, reviewed snapshot publication, image-only ownership checks, public image authorization, and saved-card artwork retention. A draft's unpublished card image stays private. Audio cannot be published as artwork. Known fictional contacts are linked to their published demo card; the original counts and meetings are retained.

The owner can keep using existing edit, publish, share, capture, search and meeting flows. Long-form information remains available as supporting detail. Future owner-recorded video is a proposal, not an implemented feature. Application AI remains disabled; the demo imagery and voiceover are explicitly generated presentation assets.

## Demo artwork

- Maya / Northstar: coral landscape card, bold design-studio typography.
- Noah / Fieldwork: forest green, lime, event identity.
- Aisha / Loop & Leaf: warm paper, serif typography, botanical identity; packaging photograph.
- Raka / Kembali: terracotta, material-led branding; reclaimed-timber café photograph.
- Sofia / Atelier Système: portrait card, lilac, serif typography.
- Elias / Werkflow: cobalt, strong industrial geometry.

Rebuild authored card/portfolio artwork with `node scripts/create-visual-demo-assets.mjs`. Image provenance and full generation prompts are in `GENERATED_ASSETS.md`. The image-generation tool was built-in; no paid application AI job was run.

## Verification record

- Isolated API/provider suite: **34 passed**, including card artwork persistence, approved public exposure, private/unpublished denial, source preservation when saving, and rejecting voice notes in all three artwork fields. Provider tests use mocks.
- Public/admin browser suite: **8 journeys passed**. Additional 390px, 432px and 1440px visual checks verify swipe/keyboard/tap navigation, full-size artwork viewer, landscape and portrait proportions, visible CTA and no overflow/errors. Evidence: `artifacts/qa/visual-story/verification.json`.
- Mobile typecheck and **26 tests passed**. Six actual app-web recordings completed without page errors: wallet, portrait, original card/enlargement, business, Aisha’s three-page story and meeting memory. Evidence: `artifacts/videos/visual-iteration/captures/mobile-provenance.json`.
- APK **4.1.0 / 2026091803**, ARM64, same modern signing identity and package `io.duit.ecards.pilot`. Server download matches **47,425,049 bytes**, SHA-256 `01567d45c0f8a0191ad8de452fd252e274ad434fa52a996148b62983bc5dabb0`. All three artwork fields load for Maya, Aisha and Sofia. Evidence: `artifacts/qa/visual-delivery.json`.
- Android ARM64 emulator: **4.1.0 installed over 4.0.1 with session/data retained and cold-launched successfully**. Card-first home, all three story pages, original/enlarged viewer, landscape/portrait cards, horizontal swipe, meeting memory and Android Back verified. CTA/share/edit remain reachable above three-button navigation, including by scrolling longer owner previews. No AndroidRuntime/ReactNativeJS error lines in the running process. Evidence: `artifacts/qa/native/visual-4.1.0-verification.json` and matching screenshots. This is emulator validation, not a physical S25 hardware test.
- Film **2:28**, 1920×1080/30fps, generated clear-voice narration, captions and eight chapters. File: `artifacts/videos/visual-iteration/DUIT-2026-visual.mp4`. Full decode, timing, exact narration provenance and chapter visual review passed (`artifacts/videos/visual-iteration/verification.json`). Captions use proportional timing; no full human listening review was performed.
- Narrated film: separate from previous movies; source in `scripts/video/visual-*`, storyboard in `VISUAL_WALKTHROUGH.md`. Only actual product captures may represent implemented behaviour; proposed next ideas are labelled.

## Stop point

This is a design-review milestone, not a declaration that the full private-pilot goal is complete. The goal was already paused when this request began. After delivering the iteration and film, leave it paused and perform no further autonomous goal work. Live application AI activation and GitHub's missing `workflow` scope remain future setup matters; do not resume them as part of this request.


## Repository status

Changes are saved on `codex/duit-2026-private-pilot`. GitHub previously rejected this branch because the signed-in credential lacks `workflow` scope and the branch includes the CI workflow change. Local milestone commits therefore remain unpushed. No repeated authorization attempt, deployment, merge or external publishing is part of this design-review request. No paid application AI call was made.
