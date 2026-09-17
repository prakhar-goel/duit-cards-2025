# DUIT 2026 private pilot delivery

Updated 18 September 2026 for the user-requested **visual card-first iteration**. The modern implementation lives in this repository. The restored legacy application and archive remain separate. The broader pilot goal is paused; see `VISUAL_ITERATION.md`.

## Open the pilot

Run from `/Volumes/UserData/prakhargoel/Development/duit/duit-cards-2025`:

```sh
npm run phone
```

The launcher prints the current local and internet address status. This verified session uses:

- Mac: `http://localhost:48152`
- Same-Wi-Fi phone: `http://192.168.1.56:48152`
- Admin: `/admin`
- Signed-out sample: `/c/maya-desai-demo`
- Phone download page: `/download`

The Wi-Fi IP may change. Use the launcher's new printed address after changing networks. For an explicitly requested internet session, `npm run phone:internet` starts a quick tunnel; `npm run phone:internet:stop` closes it. Keep the Mac awake. The managed background process survives this task and a closed terminal tab.

Use the generated operator or fictional account credentials in `.local/credentials.json`. The private demo APK now prefills Maya’s credentials at the user’s request; operator credentials are not embedded and passwords are not committed to source. `maya@northstar.example` and `noah@fieldwork.example` provide separate, populated workspaces.

## Android artifact

- File: `artifacts/DUIT-2026-Pilot.apk`
- Package: `io.duit.ecards.pilot`
- Version: 4.2.0 / 2026091805
- Architecture: ARM64, suitable for Samsung S25 Ultra
- Size: 47,562,351 bytes
- SHA-256: `bf28167e1dd36cde0e125968b5c6efd492ef5e58a2eff1065274b0f22f6a201b`

The signed standalone APK includes all final source changes. Its server setting can be changed without rebuilding. Preserve `.local/signing` for future updates. The app installs separately from the restored legacy DUIT package.

The incompatible Expo Asset version that caused the earlier 4.0.0 startup crash is fixed. Version 4.0.1 was confirmed running; 4.1.0 contains the visual redesign. Its signed download hash is verified in `artifacts/qa/visual-delivery.json`; current native evidence is listed in `VISUAL_ITERATION.md`. This is not a claim of physical Samsung S25 camera, QR, microphone, location or WhatsApp validation.

## Private narrated videos

The latest, separate film is `artifacts/videos/visual-iteration/DUIT-2026-visual.mp4`, with its own viewing page, transcript and captions. It demonstrates the card-first design through actual app-web and recipient-browser captures; see `VISUAL_WALKTHROUGH.md`.

Earlier cuts remain available for comparison:

- `artifacts/videos/DUIT-2026-quick.mp4` — 1 minute 32 seconds.
- `artifacts/videos/DUIT-2026-main.mp4` — 7 minutes 48 seconds.
- `artifacts/videos/index.html` — local viewing page with both cuts.

The 1080p videos include generated narration, captions, chapters and separate SRT/transcript files. They show actual app-web/browser interactions, accurately labelled, recorded while the Mac was locked during the earlier delivery. The longer cut covers the card, meetings, follow-up, recipient review, admin, private archive and first business experiments. The archive includes the requested founder profiles.

Full-stream decode, chapter/caption bounds and voice-source consistency checks passed; chapter contact sheets and representative full-size frames were inspected. No full end-to-end listening review was performed. Caption timing is proportional to speech segments. Results are in `artifacts/videos/verification.json`; narrative and reproduction instructions are in `docs/WALKTHROUGH_STORYBOARD.md` and `scripts/video/README.md`. These private files are not published or committed.

## Verification

- 26 mobile tests and 34 API/provider tests pass: `artifacts/qa/visual-mobile-tests.txt` and `artifacts/qa/visual-api-tests.txt`.
- Eight public/admin browser checks pass: `artifacts/qa/web/verification.json`.
- Eight two-account/offline mobile-browser journeys pass: `artifacts/qa/mobile-browser-verification.json`.
- Current native screenshots and exact limitations: `artifacts/qa/native/visual-4.1.0-verification.json` (older verification remains historical).
- Current APK download and published imagery checks: `artifacts/qa/visual-delivery.json`. Prior background-server/setup checks: `artifacts/qa/delivery-verification.json`.
- API production dependency audit has zero reported advisories. Remaining Expo/native tooling findings are in `docs/DEPENDENCY_REVIEW.md`.

The private data library has 300 selected historical profiles and 630 unique images. Six fictional modern accounts have six published profiles, 38 saved people, 53 meetings, 38 commitments and nine seeded enquiries. Recording fixtures were removed with exact ownership/ID guards. Historical records and fictional activity are labelled and kept out of current-user growth claims.

## Future setup if the broader pilot is resumed

1. Approve the AI provider budget and configure the server key locally before real AI sample evaluation. No paid application-provider call has been made; disabled AI is shown honestly. See `docs/AI_PROVIDER_PLAN.md`.
2. Review the card-first design before reopening broader feature work. The latest film uses actual app-web captures; version-specific Android checks are tracked separately.
3. Refresh the existing GitHub CLI's workflow permission with `gh auth refresh -h github.com -s workflow` before pushing the implementation commit and executing its pull-request checks. GitHub rejected the push because the commit updates `.github/workflows/ci.yml`; it has not been merged. The existing repository is public, while local user media, databases, credentials, signing keys, APKs and videos are Git-ignored.
4. Real verification email delivery is not configured. The current private pilot uses an explicitly labelled operator outbox; it sends no email. A delivery provider is required before self-service external onboarding.

At the user’s request, stop after this visual iteration and its walkthrough. The broad goal remains paused, not completed. The future setup items above do not extend this design-review milestone. This is not a production launch approval.


## Demo login update · 4.1.1

Email and masked password are prefilled for Maya in the private APK. Both stay editable. Switching to signup clears them; returning to login restores the demo. Build injection reads only the fictional Maya account from the private credentials file. Use `DUIT_DEMO_PREFILL=false npm run build:apk` for a build without it. This update does not resume the paused broader goal.


## Card stories, business feed and meeting context · 4.2.0

- Today now shows a visual feed grounded in the account's needs, offers and saved meeting context, with Grow, Improve and Network filters. It refreshes from the server with the rest of the workspace. It is not a public posting network or an autonomous sales agent.
- Cards support seven slides: portrait, front/back visiting card, and up to four captioned business images/videos. MP4 uploads are limited to 12 MB, play on request and follow the same reviewed-publication access rules as images. Both the Android app and shared web cards render the gallery.
- Added Leena Kapoor (clinic operations, Bengaluru), Kenji Mori (hospitality, Kyoto), Amara Okafor (solar, Lagos), Mateo Silva (coffee, São Paulo), Inês Costa (architecture, Lisbon), and Omar Haddad (logistics, Dubai), with distinct portraits, card artwork, business photography, short motion portfolios and six new meeting records in each of Maya's and Noah's workspaces. Internal fixture provenance is retained; presentation labels were removed. Existing passwords and account IDs are preserved; the six original fixture email addresses now use their business names at reserved example domains.
- Meeting capture starts with the current time, uses current GPS automatically when permission is already granted, and fills venue/street, city and country through the device reverse geocoder. First use offers an explicit location permission action. Event suggestions use date/distance; selecting one stores event identity and venue coordinates, labelled separately from live GPS. Manual entry remains available if location services fail.
- Back from record-meeting, meeting memory and person editing returns to the originating card. Event-group context remains underneath an opened card. My Card has one dedicated bottom-navigation destination.
- Validation: 28 mobile unit tests and 34 API/provider checks pass. Public cards verified at 390 and 1440 pixels, including video playback and six-slide navigation. Android emulator checks cover Back navigation, swipe, video controls and event-context fields. Actual S25 GPS reception and hardware playback are not verified on the physical phone.

Current tunnel after loading the update: `https://wishing-compression-valued-ana.trycloudflare.com`. The URL changes after restarting the quick tunnel. Local phone address remains `http://192.168.1.56:48152`. The user can run `npm run phone:internet` to print the current addresses. This bounded update does not resume the broader paused goal.
