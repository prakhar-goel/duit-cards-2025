# DUIT development handoff

Read this at the start of a resumed cloud or desktop task, together with
`AGENTS.md` and `docs/MOBILE_CLOUD_DEVELOPMENT.md`. GitHub carries code and these
notes between devices; a new conversation does not inherit the old chat.

## Current milestone

- Objective: phone-only development with automatic signed APK publication after
  a versioned change merges and main CI passes, plus reliable cloud/desktop handoff.
- Working branch: `codex/automatic-apk-delivery` (use `main` after this PR merges).
- Previous published APK: 4.6.2, source `9808b718e3ba2440a4341349569f57223f18ee1d`.
- Product behavior: Instagram-inspired theme is the default. DUIT Original remains
  selectable in My Card → Settings → Appearance. Theme changes preserve app state.
- This milestone adds release automation and handoff tooling; no new product screens.
- Prepared release: 4.6.3 / Android 2026091813, for end-to-end automation validation.
  Publication is pending PR merge and CI; this version is not yet claimed released.
- Local validation: 10 tooling tests passed; workflow YAML parsed; manual and
  automatic preflight passed against actual GitHub main CI/release metadata using
  read-only API calls. Version preparation and the handoff command were exercised.
- Next: finish PR checks/review, merge, verify automatic workflow_run publication,
  then record the successful release/run links here.

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
