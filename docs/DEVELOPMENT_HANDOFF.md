# DUIT development handoff

Read this at the start of a resumed cloud or desktop task, together with
`AGENTS.md` and `docs/MOBILE_CLOUD_DEVELOPMENT.md`. GitHub carries code and these
notes between devices; a new conversation does not inherit the old chat.

## Current milestone

- Objective completed: phone-only changes can produce a signed APK automatically
  after a protected PR merge and successful main CI. No laptop or manual APK
  workflow dispatch is required for normal releases.
- Automation PR: https://github.com/prakhar-goel/duit-cards-2025/pull/74 (merged).
- Follow-up PR: https://github.com/prakhar-goel/duit-cards-2025/pull/75,
  branch `codex/release-channel-recovery`; use current `main` after it merges.
  It adds recovery for partial shared-channel publication, with no
  app behavior or version change.
- Latest verified APK: **4.6.3 / Android 2026091813**, source
  `782cdeff384aeb45726f9a7651de3adfbfb0a29c`, published September 19, 2026.
- Automatic run (event `workflow_run`, successful):
  https://github.com/prakhar-goel/duit-cards-2025/actions/runs/35431410263
- Download:
  https://github.com/prakhar-goel/duit-cards-2025/releases/download/v4.6.3-staging/DUIT-2026-4.6.3.apk
- Render release metadata independently confirmed 4.6.3. Actual Samsung installation
  and device interaction testing remain with the tester.
- Product behavior: Instagram-inspired theme is the default. DUIT Original remains
  selectable in My Card → Settings → Appearance. Theme changes preserve app state.
- Validation: initial PR/main CI passed. Recovery follow-up has 13 passing tooling
  tests and parsed workflow YAML; recovery dry-run downloaded and checked the real
  4.6.3 APK/manifest, signing provenance, source ancestry and rollback guard without
  modifying a release. Consult the follow-up PR for its final GitHub CI result.
- Release approval remains the PR merge. No blanket automatic merge is configured.
- The paid-account cloud environment now has the owner-approved read-only GitHub
  and DUIT host allowlist documented in MOBILE_CLOUD_DEVELOPMENT.md. The settings
  were saved and reopened to verify their persistence. No tokens were added.
- Next developer: start the user's next requested change from current main, or
  resume the explicitly provided open PR branch. For a new APK use
  `npm run release:prepare` once (next patch from this version is 4.6.4), update
  these notes and create/update the PR. Do not reuse an outdated cloud snapshot.
- Desktop project: **duit-cards-2025** at
  `/Volumes/UserData/prakhargoel/Development/duit/duit-cards-2025`.
  The separate **duit-cards-2018** restoration is not this repository.

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
