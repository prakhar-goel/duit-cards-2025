# Repository Working Instructions

## Product input log

- Maintain `docs/PRODUCT_INPUT_LOG.md` as an append-only record of the user's product and PRD prompts and inputs.
- At the start of any turn containing new product direction, product feedback, product decisions, use cases, positioning, market input, MVP scope, or PRD changes, append the user's exact wording before editing derived product documents or code.
- Record one ISO 8601 timestamp per entry in the `Asia/Kolkata` timezone. Obtain the timestamp from the system clock; do not estimate or invent it.
- Preserve wording, spelling, punctuation, links, and line breaks. Do not summarize, interpret, correct, or mix assistant-authored conclusions into the log.
- Do not log execution-only messages such as requests to run commands, commit, push, merge, or report status unless they also contain product or PRD input.
- Never rewrite or reorder existing entries. Corrections or clarifications must be appended as new entries.
- After a completed repository milestone, create a focused commit and push the current branch. Product-log updates must be included in the same milestone commit or in a dedicated documentation commit.

## Product document precedence

- `docs/PRODUCT_INPUT_LOG.md` is the verbatim source record of user input.
- `docs/PRD.md` is the interpreted and structured product source of truth.
- When the documents conflict, do not silently change the input log. Reconcile the PRD through an explicit product decision and retain the original input history.

## Git workflow

- Use `main` as the only long-lived development branch. Create focused pull requests into `main`; do not recreate permanent `develop`, `staging`, release, or hotfix branches.
- Before changing repository files, create or switch to a short-lived branch whose name describes the work. Use the `codex/` prefix for Codex-created branches, for example `codex/capture-flow` or `codex/dependency-security-updates`.
- Keep each branch and pull request focused on one coherent milestone. Avoid generic, numbered, or screen-version branch names when a concise work description is available.
- Whenever a commit is created, push it to the current remote branch in the same workflow.
- Do not leave a successful local commit unpushed unless pushing is blocked or the user explicitly asks not to push; report either exception clearly.
- In Codex cloud, terminal Git/`gh` access may be unavailable even when the GitHub
  connector works. Use the task's **Create PR** web action for handoff (or direct
  the user to click it). A missing `origin`, unauthenticated `gh`, or proxy 403
  alone does not mean the connector needs reconnecting. Do not ask the user to
  push a cloud-only `/workspace/...` directory from their laptop or copy GitHub
  tokens into the cloud environment.
- Merge through a pull request after required checks pass, then delete the short-lived branch.

## Laptop and mobile cloud development

- Read `docs/DEVELOPMENT_HANDOFF.md` at the start of resumed work and update it
  before every device handoff or completed implementation milestone. Record the
  objective, branch/PR, changes, actual validation, unresolved issues, release
  status and next steps; never secrets. `npm run handoff` prints a read-only local
  snapshot. Verify the latest GitHub state before editing an old cloud snapshot.
- Read `docs/MOBILE_CLOUD_DEVELOPMENT.md` when working from Codex cloud or handing
  work between devices. The standard cloud environment uses
  `CI=1 EXPO_NO_TELEMETRY=1 npm run verify:cloud:app` for tooling, type checks,
  mobile tests and web builds. It has no database. Database integration tests
  must pass in GitHub Pilot CI before merging; report them separately from cloud
  app checks. `npm run verify:cloud` is for an optional full environment with a
  disposable local PostgreSQL instance.
- The optional full cloud environment uses only a disposable local test database,
  never the hosted staging database or historical archive. The standard cloud
  environment has no database. Do not run staging initializers or seeders.
- Keep work on one focused branch, push coherent changes for handoff, and fetch
  before resuming on another device. Never discard uncommitted work or force-push
  to make devices agree. Desktop conversations do not automatically follow Git.
- Signed APKs are built with `Android staging APK` from protected main after its
  Pilot CI succeeds. A new version automatically builds and publishes; already
  published versions skip. Use `npm run release:prepare` once per requested new
  APK to increment aligned app.json/Android versions on the feature branch. Do not
  bump versions for handoff-only or documentation-only commits. PR checks and
  branch publication alone do not release; merging is the approval boundary.
  Never generate a replacement signing key or give signing credentials or GitHub
  tokens to ordinary cloud tasks. Only report an APK as published after verifying
  the successful workflow and its versioned GitHub Release.
