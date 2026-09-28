# DUIT development handoff

Read this at the start of a resumed cloud or desktop task, together with
`AGENTS.md` and `docs/MOBILE_CLOUD_DEVELOPMENT.md`. GitHub carries code and these
notes between devices; a new conversation does not inherit the old chat.

## Current milestone — OTA APK and server presets released

- Objective completed: OTA-capable APK and prefilled Render/Local Mac choices.
  PRs #85 and #86 merged. Signed source ad311d30a2a4343e3922e176fefa53ac38bde304.
- APK 4.6.6 / 2026091816 published by workflow 36445184657 on 28 September 2026,
  21:20 IST. Existing package and signing certificate retained. Download:
  https://duit-cards-staging.onrender.com/download.
  Immutable release: https://github.com/prakhar-goel/duit-cards-2025/releases/tag/v4.6.6-staging.
  Filename DUIT-2026-4.6.6.apk; SHA-256
  e2da67d624da5c669b2437f4295befe2f4e6eddd04c30826f7f6c3e0731d056a.
- Downloaded release checksum and signer verified independently. Compiled Android
  manifest enables OTA on staging; runtime string duit-android-4.6.6 verified in
  APK resources. Embedded app.manifest exists for offline startup.
- First OTA published from clean main via npm run release:ota. Expo project
  b57ffffc-8706-4224-8036-ff3774883cb6, channel/branch staging; update group
  6e8ebbaa-f6e6-484b-9a66-8a316f629909; Android update
  01a0e8b7-9d30-713e-acb3-3cc63d11bbbe. Protocol endpoint returned HTTP 200 with
  matching runtime; launch bundle returned HTTP 200 and matched manifest SHA-256
  when using the asset request headers supplied in the multipart response.
- Server settings offers Render / Local Mac, remembers edits and preserves user
  selections while saved settings load. Local default Bonjour hostname
  Prakhars-MacBook-Pro.local:48152 resolved on this Mac; same Wi-Fi and npm run
  phone required. Native settings has Check for updates / Restart to update.
- Validation: 55 mobile tests, required API CI, type checks and both web builds
  passed. Release metadata and native OTA consistency checks passed. Chrome
  verified both address presets. First APK attempt 36442409329 hit the old 512 MiB
  Gradle metaspace limit; raising it to 1 GiB fixed the signed build without
  disabling lint. No additional version bump was needed.
- Render deployed the download-page OTA label from b0d6ac3. Label follows release
  metadata, not guessed version numbers; metadata cache may lag up to five minutes.
- Future UI-only iterations: merge checked changes, then npm run release:ota.
  Keep app version/runtime unchanged. The command blocks native/config/dependency
  changes relative to the published APK; those require a new compatible APK.
  See docs/OTA_UPDATES.md. Do not rebuild APKs for ordinary UI iterations.
- Phone follow-up: install 4.6.6 once over the existing app; use Check for updates
  then Restart to update to exercise actual device delivery. Native Samsung OTA
  application, Truecaller and GPS have not been exercised on a physical phone.

## Previous milestone — visual feed, Google Maps and Android 4.6.5

- Objective: simplify the visual relationship feed, separate outgoing shares,
  shorten card links, add country-code entry and enable Google Maps/Truecaller.
- Implementation merged through Truecaller PR #82 and visual-feed PR #83.
  Release source is protected main `ef94f55694ceaf4ddc7cd1bb21e40f00da349cb1`.
  Owner product wording is preserved in `docs/PRODUCT_INPUT_LOG.md`.
- Cards/Sent/Share/Meetings/My Card replaces the previous navigation. The feed
  groups business photos with card artwork and removes introductions/follow-up/
  focus panels. Sent contains chronological recipient/meeting rows. Filter values
  come from saved exchanges. New/small accounts retain visual sample cards.
- Country-code search accepts names and dial codes; the separate phone input
  retains ASCII digits only. Public card aliases have 12-character path codes;
  invitation tokens have 16 characters. Old links and retry behavior still work.
- Google Places (New) and Geocoding enabled in `duit-cards-2025`. Dedicated key is
  restricted to those APIs and stored only in Render's private environment.
  Persistent limits: 100 lookups/rolling 24h globally, 50/user, 1,000 total.
  Live staging search returned Bharat Mandapam and reverse lookup returned
  Kartavya Path/New Delhi/IN; shortened public-card URL returned HTTP 200.
- Truecaller Android credential saved with owner approval and existing signing
  certificate. Android and Render public client IDs match. Console test number,
  consent details and openid/phone/profile scopes were confirmed. Live server
  advertises Truecaller. Physical phone consent/cancellation still need testing.
- Validation: 55 mobile tests, 55 isolated API tests, 13 tooling checks, type
  checks, public web build and Expo web export passed. PR and protected-main
  Pilot CI passed. Chrome reviewed feed collages, Sent city filtering, country
  search, digit-only entry and populated new-user feed. No WhatsApp message sent.
- Render deployed exact release source successfully at stable URL
  https://duit-cards-staging.onrender.com. No Mac or tunnel is needed.
- Android release 4.6.5 / 2026091815 published successfully in trusted workflow
  36436708222 from the release source above. Immutable release:
  https://github.com/prakhar-goel/duit-cards-2025/releases/tag/v4.6.5-staging.
  Render /download and /downloads/release.json both verified version 4.6.5,
  filename DUIT-2026-4.6.5.apk and release time 28 September 2026, 20:14 IST.
  APK SHA-256: 49376b13d1827632aa5e423af3d1a36ab0185c7415246f6c004e3bcf75d0c006.
  Release provenance matches GitHub asset digest, source and existing signing
  certificate. Documentation handoff is PR #84; no additional version bump.
- Next: install from https://duit-cards-staging.onrender.com/download over the
  existing signed app and test native Truecaller, SIM picker and physical GPS.
  Test mode only permits the Truecaller numbers listed in its console.
- Local Chrome review: http://localhost:48163/review (Maya or new-user workspace);
  phone frame http://localhost:48163/phone; DUIT Master http://localhost:48164/master.
  Local API is 48162. These helpers are loopback-only and are not committed.

## Previous milestone — Truecaller login and requested Android release

- Objective: connect the owner's newly created Truecaller project and publish an
  installable APK. The latest request explicitly authorizes packaging, superseding
  the earlier Chrome-only review phase.
- Branch: `codex/truecaller-login`; implementation `d7dd8fc`; draft PR #82:
  https://github.com/prakhar-goel/duit-cards-2025/pull/82. Based on phone-number
  selection `7993b87` and updated to merged main.
  Offline PR #79, company PR #80 and phone-number PR #81 were merged
  after their CI passed (main `ee54bb0`). Chrome review of the local mobile business
  dashboard and DUIT Master completed successfully now that the Mac is unlocked.
- Changes: native Truecaller OAuth SDK 3.3.0/PKCE/state checking and OTP fallback;
  server-side code exchange/verified-phone account mapping; additive v8 provider
  identity column; company invitation claims accept either verified provider.
- Validation so far: 51 API and 51 mobile tests passed; type checks, both browser
  builds and 13 tooling checks passed. Android compileDebugKotlin passed. Test
  provider responses are mocked; no live Truecaller phone verification claimed.
- Console setup completed with owner approval: Android credential uses the existing
  signed APK certificate. Its public client ID is wired into Android and saved
  in Render. Test consent details are owner-managed. Physical phone login still
  needs the new APK; Chrome cannot exercise native Truecaller.
- Version remains 4.6.4 on this prerequisite branch. The already prepared 4.6.5 /
  2026091815 version is reserved for `codex/visual-network-feed`, so the next APK
  includes the latest requested feed/sharing work. Do not bump again.
- Next: merge this prerequisite after CI, integrate into the visual-feed branch,
  then release that branch through protected main.

## Previous milestone — Android phone-number selection

- Objective: reduce phone-login typing and evaluate optional Truecaller login.
- Branch: `codex/phone-number-selection`; implementation `74aaddd`; draft PR #81:
  https://github.com/prakhar-goel/duit-cards-2025/pull/81. Based on company-review commit `f4fe442`
  (draft PR #80), which includes offline-review PR #79. Preserve those review
  milestones; none is approved for APK packaging yet.
- Changes: small Android Google Phone Number Hint bridge using Play services auth
  22.0.0, registered in MainApplication; show the SIM chooser once after the intro
  and offer a Choose my number button. Cancel/no-number/unsupported-platform paths
  retain manual entry. Selection only fills the number; Firebase verification and
  explicit Send code are unchanged. No phone/SMS permission added.
- Validation: workspace type checks and 49 mobile tests passed; Android
  `:app:compileDebugKotlin` and Expo web export succeeded. Actual SIM selection still needs a physical Android device test.
- Truecaller remains unconfigured and unimplemented. Owner was asked whether DUIT
  is registered. Next dependency is its Android OAuth client ID for package
  `io.duit.ecards.pilot` and the existing release certificate SHA-1; provider review
  and verified server-side identity integration are also required. See
  `docs/PHONE_LOGIN_OPTIONS.md` for sources and the account-linking constraints.
- No APK was built, signed, published or version-bumped; published 4.6.4 remains
  unchanged. Chrome cannot display Android's native SIM-number chooser.
- Next: obtain Truecaller registration/client ID, implement its verified login
  adapter with OTP fallback, and test native number selection before release.
  Company/offline Chrome review remains pending the Mac unlock from the prior task.

## Previous review milestone — company onboarding browser review

- Objective: a separate DUIT Master admin workspace, shared company profiles
  linked to multiple employees, and an in-app team/card/enquiry dashboard.
- Branch: `codex/company-onboarding`; implementation `858181a`; draft PR #80:
  https://github.com/prakhar-goel/duit-cards-2025/pull/80. Based on `82f07da` from the still-open
  offline review PR #79. This preview intentionally includes that prior work.
  Both features await browser feedback; do not merge or bump the APK version.
- Implementation: additive v7 companies/members migration; scoped business API;
  standalone `/master` web app; `My card → My business` in React Native.
  Includes person/company creation, image uploads, existing-account/card linking,
  phone-bound seven-day invitations, safe image copies into claimed drafts,
  team access/card pausing and company enquiry assignment/status changes.
- Local review data: `scripts/seed-company-review.mjs` accepts only a loopback
  `duit_2026_pilot` database. It adds Northstar Studio's authored six-person team,
  four linked cards and four enquiries, plus two company shells. Never run it
  against hosted staging or historical data. Fixture employee accounts have
  random passwords, not reusable credentials.
- Running previews: `http://localhost:48164/review` opens DUIT Master using a
  loopback-only local admin launcher. `http://localhost:48163/review` opens the
  mobile app as Maya; choose My card → My business. The private local helpers
  `.local/master-review.mjs` and `.local/preview-review.mjs` are not committed.
  The isolated API is 48162; existing 48152 and Render settings are untouched.
- Validation: 47 API checks and 45 mobile tests passed; workspace type checks,
  public web build, Expo web export and 13 tooling checks passed. Both preview
  launchers return HTTP 200; authenticated admin/Maya requests show six team
  members, four cards and ten enquiries (including six existing enquiries).
  The company integration test
  exercises wrong-phone/unverified/replayed/expired invitations, image ownership,
  tenant/role isolation, assignment validation and paused-card publication denial.
- Chrome visual inspection is pending: CUA reports that the Mac is locked and
  automatic unlock failed. User has been asked to unlock it. Do not claim that
  the new screens have been visually checked until that check is completed.
- Limits: master app is a responsive web workspace in this iteration, not a second
  packaged Android app. Invitations are copy-and-share codes; no automatic message
  is sent. Owners/managers have company-wide scope, not nested reporting lines.
  Company dashboards require network access. Company edits apply to the shared
  record/new drafts; published cards retain their approved snapshots.
- Release stays **4.6.4 / 2026091814**. No APK, version bump, merge or deployment.
  Next: unlock Mac, inspect both Chrome previews, iterate on user feedback, then
  decide on packaging through the protected-main release workflow.

## Previous review milestone — offline wallet and sharing browser review

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
