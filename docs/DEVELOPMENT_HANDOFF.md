# DUIT development handoff

Read this at the start of a resumed cloud or desktop task, together with
`AGENTS.md` and `docs/MOBILE_CLOUD_DEVELOPMENT.md`. GitHub carries code and these
notes between devices; a new conversation does not inherit the old chat.

## Current milestone — offline wallet and sharing browser review

- Objective: offline card galleries and meeting history, automatic exchange sync,
  readable/searchable GPS location, nearby saved-event tags, discussion choices,
  editable WhatsApp message and persistent sample-card gallery.
- Branch: `codex/offline-location-sharing`; draft PR #79:
  https://github.com/prakhar-goel/duit-cards-2025/pull/79. No APK requested
  for this iteration; user explicitly wants Chrome review before packaging.
- Changes: server/account-scoped snapshot and media storage; idempotent durable
  exchange outbox; reconnect/foreground sync; offline token-refresh preservation;
  authenticated wallet snapshot and Photon/OpenStreetMap lookup endpoints; separate
  media/API request allowances so an offline download cannot exhaust login requests.
- Chrome review: `http://localhost:48163/review` lets the user open Maya or a new
  local account. Local-only helper is `.local/preview-review.mjs` (untracked, binds
  loopback, does not change hosted authentication). The isolated API is port 48162,
  built web files are `apps/mobile/dist`, compiled with API URL localhost:48162.
  Existing port 48152 and Render/tunnel settings were not changed.
- Validation: 44 mobile tests, 46 API tests on `duit_2026_pilot_test`, workspace
  type checks and Expo web export passed. Chrome checked at 412×915: topic picker,
  Bharat Mandapam search → coordinates/address → message, editable preview and
  disabled-button reason. Fresh account shows the curated gallery; Maya retains it
  alongside 54 connections. With the isolated API stopped and Chrome reloaded,
  saved photos, Aisha's business carousel and all three meetings remained available.
- Limits: physical-device GPS and native filesystem/media playback remain device
  smoke tests before packaging. Current nearby-event suggestions use the user's
  saved DUIT events, not a global live-events provider. Public Photon has no SLA.
  Media needs one successful download before it is usable offline; failed items
  remain visible as waiting to download. Browser shell itself is served locally;
  this is not a service-worker/PWA offline installation.
- Offline WhatsApp uses the published public card URL; a personal invitation URL
  is generated only with network access. A queued meeting is not proof of WhatsApp
  delivery. No WhatsApp messages were sent during verification.
- CI follow-up: location-result formatting was separated from the authenticated
  router so its unit test runs without any local server secret.
- Release: unchanged at 4.6.4 / 2026091814. No release bump, APK build, merge or
  Render deployment. Next: user reviews the Chrome screens; then any requested
  adjustments, Android device checks and the normal protected-main release flow.

## Previous published milestone

- Objective: intro and Firebase phone login, guided AI card creation/editing,
  People/Share/My Card navigation, remembered WhatsApp exchanges, meeting filters,
  enquiry inbox, and a versioned staging APK.
- Source PR: https://github.com/prakhar-goel/duit-cards-2025/pull/77, merged into
  main as `a8ca7a5`. The feature branch is retired. Release evidence is recorded on
  the short-lived `codex/phone-release-handoff` branch (PR #78), which also updates
  download-page instructions for phone sign-in.
- **Published: 4.6.4 / Android 2026091814**, signed with the existing identity.
  Android staging APK workflow 36299766159 succeeded. Immutable release:
  https://github.com/prakhar-goel/duit-cards-2025/releases/tag/v4.6.4-staging.
  File: `DUIT-2026-4.6.4.apk`, 49,359,817 bytes; SHA-256
  `7adf4604d50c26f699929cd9101926c98ad451cffcbf5d1320ee5da7bd08d792`.
  Published 2026-09-27T06:29:18Z (11:59:18 Asia/Kolkata).
  Render `/downloads/release.json` independently returned the matching version,
  filename, release timestamp and immutable GitHub download URL.
- Validation: 45 API checks passed against `duit_2026_pilot_test` only; 37 mobile
  tests passed; tooling/type checks and mobile/public web builds passed. Intro and
  phone-entry screens were checked in Chrome at 412×915. Final editor changes
  preserve video uploads and reverse-side card images; type checks passed.
- Firebase: project `duit-cards-2025` (101035881110), native/web clients configured,
  existing APK certificate registered, phone enabled, India SMS allowlist and
  effective 20/day verification-SMS quota. User approved narrowing both public
  Firebase keys to authentication services; applied successfully. Gemini key remains
  separate. Both client keys returned HTTP 200 from Firebase auth configuration
  after restriction. Actual SMS delivery/device OTP sign-in still needs a device smoke test.
- Render service: `srv-damc5v142hec738h1sq0`; stable origin
  https://duit-cards-staging.onrender.com. Firebase project and bounded AI settings
  deployed on `a8ca7a5`; phone capabilities and AI enabled were verified live.
  Owner added separate `OPENAI_API_KEY` and `GOOGLE_GEMINI_AI_API_KEY`.
  Both variable names were independently verified in Render without reading values.
  Only OpenAI has a feature adapter. No DutyExchange key was uploaded to Render;
  temporary local copies were removed. Never add server secrets to the APK/repo.
- Application semantics: WhatsApp opens a prepared message; delivery is not known.
  Meeting context goes only to a matching verified phone, private notes stay with
  the sender. Example cards are not invented meetings. Existing email workspaces
  are not automatically claimed by phone-number matching.
- Final review fixes: unique links for additional cards; selected event IDs retained
  with ownership checks; reminders/focus/suggestions retained in People; verified
  phone tokens can retry a temporary API failure without consuming another SMS.
  Country names are bundled for Hermes; feed matching reuses owner data and ranks
  partial matches; conflicting exchange retries/phone identities return explicit errors.
- Live AI checks: profile draft produced six panels; OCR extracted the sample
  name/company/role/phone/email/website; business visual and visiting-card cleanup
  both succeeded. Total recorded usage: $0.036331, remaining $4.963669. Nothing was
  applied to a published card. Cleanup retained the sample logo/text but changed
  aspect ratio; originals and review controls remain essential. Gemini is stored
  but has no feature adapter and incurred no calls.
- Next: install from https://duit-cards-staging.onrender.com/download and test a
  real Indian phone OTP, GPS, and WhatsApp handoff on the Samsung. No connected
  Android device was available; actual carrier delivery/native interactions are
  not claimed as tested. Website URLs inform profile drafts; website crawling is
  not implemented. Improve image cleanup aspect-ratio preservation next.
- Desktop directory: `/Volumes/UserData/prakhargoel/Development/duit/duit-cards-2025`.
  The separate legacy restoration is not this repository.

## Working rules for both devices

1. Run `npm run handoff` to inspect branch, commit, dirty paths and these notes.
2. Before resuming on desktop, inspect local changes and fetch GitHub. Resume the
   same short-lived branch if its PR is open; use current main if it is merged.
   Never reset or force-push to make two devices agree.
3. Before leaving a device, update the sections below, commit a coherent checkpoint,
   and push it (desktop) or use Create PR / Update PR (cloud). Unpushed files are
   not available on the other device. Draft PRs can carry unfinished work without
   merging or triggering signed releases.
4. Before resuming an old cloud task after desktop edits, verify it contains the
   latest GitHub commit. If it cannot refresh, start a cloud task on the updated
   branch and read these notes. Do not publish an old cloud snapshot over new work.
5. One active editor per branch. Parallel tasks use separate branches and PRs.

## Update at every handoff

Replace the current milestone details with the current objective, branch/PR/task
links, source commit known before this note, completed changes, tests actually
run, unresolved failures, release version/status/URL, and concrete next steps.
Do not include secrets, private user data, or full chat transcripts. Do not invent
passing tests or call a queued build published.

## Phone prompts

New change:

> Read AGENTS.md and docs/DEVELOPMENT_HANDOFF.md. Start from current main. Make
> [change], run the cloud app checks, and prepare a new staging APK version with
> npm run release:prepare. Update the handoff and prepare a focused PR. Give me
> the PR link or tell me to click Create PR. GitHub publishes after merge and CI.

Resume unfinished work on either device:

> Resume [branch or PR URL]. Read AGENTS.md and docs/DEVELOPMENT_HANDOFF.md.
> Verify the latest GitHub commit before editing, preserve any local changes,
> and continue the recorded next steps.
