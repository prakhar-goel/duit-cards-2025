# DUIT development handoff

Read this at the start of a resumed cloud or desktop task, together with
`AGENTS.md` and `docs/MOBILE_CLOUD_DEVELOPMENT.md`. GitHub carries code and these
notes between devices; a new conversation does not inherit the old chat.

## Current milestone

- Objective: intro and Firebase phone login, guided AI card creation/editing,
  People/Share/My Card navigation, remembered WhatsApp exchanges, meeting filters,
  enquiry inbox, and a versioned staging APK.
- Branch: `codex/phone-onboarding-card-exchange`, based on main `8ef4584`.
  PR has not yet been opened; implementation is being validated before merge.
- Version prepared once: **4.6.4 / Android 2026091814**. Local signed ARM64 build
  succeeded with the existing signing identity and Firebase libraries. This is not
  a published release yet. Latest published remains 4.6.3.
- Validation: 45 API checks passed against `duit_2026_pilot_test` only; 37 mobile
  tests passed; tooling/type checks and mobile/public web builds passed. Intro and
  phone-entry screens were checked in Chrome at 412×915. Final editor changes
  preserve video uploads and reverse-side card images; type checks passed.
- Firebase: project `duit-cards-2025` (101035881110), native/web clients configured,
  existing APK certificate registered, phone enabled, India SMS allowlist and
  effective 20/day verification-SMS quota. User approved narrowing both public
  Firebase keys to authentication services; applied successfully. Gemini key remains
  separate. Actual SMS delivery/device OTP sign-in still needs a device smoke test.
- Render service: `srv-damc5v142hec738h1sq0`; stable origin
  https://duit-cards-staging.onrender.com. Firebase project and bounded AI settings
  saved. Owner added separate `OPENAI_API_KEY` and `GOOGLE_GEMINI_AI_API_KEY`.
  Only OpenAI has a feature adapter. No DutyExchange key was uploaded to Render;
  temporary local copies were removed. Never add server secrets to the APK/repo.
- Application semantics: WhatsApp opens a prepared message; delivery is not known.
  Meeting context goes only to a matching verified phone, private notes stay with
  the sender. Example cards are not invented meetings. Existing email workspaces
  are not automatically claimed by phone-number matching.
- Next: finish final checks, focused commits/push and PR, wait for Pilot CI, merge,
  verify the automatic Android release and Render download metadata, and smoke-test
  live AI with the new key. Update this handoff with actual PR/release status.
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
