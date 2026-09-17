# DUIT 2026 private pilot delivery

Prepared 18 September 2026. The modern implementation lives in this repository. The restored legacy application and archive remain separate.

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

Use the generated operator or fictional account credentials in `.local/credentials.json`. Passwords are not embedded in the app or source. `maya@demo.duit.test` and `noah@demo.duit.test` provide separate, populated workspaces.

## Android artifact

- File: `artifacts/DUIT-2026-Pilot.apk`
- Package: `io.duit.ecards.pilot`
- Version: 4.0.0 / 2026091801
- Architecture: ARM64, suitable for Samsung S25 Ultra
- Size: 47,440,945 bytes
- SHA-256: `ebbbbbf56a97a4e20bdefe3a649d777a32675ec04a12065ef9943242e67549aa`

The signed standalone APK includes all final source changes. Its server setting can be changed without rebuilding. Preserve `.local/signing` for future updates. The app installs separately from the restored legacy DUIT package.

The first release passed native emulator checks. The final source passed typechecks, unit tests and actual app-browser journeys; final native reinstall/retest is pending Mac unlock. This is not a claim of completed physical S25 camera, QR, microphone, location or WhatsApp validation.

## Private narrated videos

- `artifacts/videos/DUIT-2026-quick.mp4` — 1 minute 32 seconds.
- `artifacts/videos/DUIT-2026-main.mp4` — 7 minutes 48 seconds.
- `artifacts/videos/index.html` — local viewing page with both cuts.

The 1080p videos include generated narration, captions, chapters and separate SRT/transcript files. They show actual app-web/browser interactions, accurately labelled, while the locked Mac prevents final native recording. The longer cut covers the card, meetings, follow-up, recipient review, admin, private archive and first business experiments. The archive includes the requested founder profiles.

Full-stream decode, chapter/caption bounds and voice-source consistency checks passed; chapter contact sheets and representative full-size frames were inspected. No full end-to-end listening review was performed. Caption timing is proportional to speech segments. Results are in `artifacts/videos/verification.json`; narrative and reproduction instructions are in `docs/WALKTHROUGH_STORYBOARD.md` and `scripts/video/README.md`. These private files are not published or committed.

## Verification

- 21 mobile tests and 34 API/provider tests pass: `artifacts/qa/final-unit-integration-tests.txt`.
- Eight public/admin browser checks pass: `artifacts/qa/web/verification.json`.
- Eight two-account/offline mobile-browser journeys pass: `artifacts/qa/mobile-browser-verification.json`.
- Native screenshots and exact limitations: `artifacts/qa/native/verification.json`.
- Background-server identity, setup, private/public boundaries and served APK hash pass: `artifacts/qa/delivery-verification.json`.
- API production dependency audit has zero reported advisories. Remaining Expo/native tooling findings are in `docs/DEPENDENCY_REVIEW.md`.

The private data library has 300 selected historical profiles and 630 unique images. Six fictional modern accounts have six published profiles, 38 saved people, 53 meetings, 38 commitments and nine seeded enquiries. Recording fixtures were removed with exact ownership/ID guards. Historical records and fictional activity are labelled and kept out of current-user growth claims.

## Outstanding external steps

1. Approve the AI provider budget and configure the server key locally before real AI sample evaluation. No paid application-provider call has been made; disabled AI is shown honestly. See `docs/AI_PROVIDER_PLAN.md`.
2. Unlock the Mac for the remaining final-APK emulator checks. The private videos use actual app-web recordings while native recording is unavailable.
3. Refresh the existing GitHub CLI's workflow permission with `gh auth refresh -h github.com -s workflow` before pushing the implementation commit and executing its pull-request checks. GitHub rejected the push because the commit updates `.github/workflows/ci.yml`; it has not been merged. The existing repository is public, while local user media, databases, credentials, signing keys, APKs and videos are Git-ignored.
4. Real verification email delivery is not configured. The current private pilot uses an explicitly labelled operator outbox; it sends no email. A delivery provider is required before self-service external onboarding.

The overall goal remains active while required live-AI and final delivery checks are outstanding. Do not treat this document as a production launch approval.
