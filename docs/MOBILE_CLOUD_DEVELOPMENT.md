# Develop DUIT from your laptop or Samsung

Target repository: https://github.com/prakhar-goel/duit-cards-2025

This is the modern pilot, package `io.duit.ecards.pilot`. The restored original
app, archive, and its signing identity remain in the separate restoration folder.
GitHub reported this repository as public at setup time; these changes do not
change its visibility. Do not commit credentials, real account data, uploads,
`.env.local`, `.local`, signing keys, or the historical archive.

## One-time Codex cloud setup

Configured environment: **DUIT — cloud development**

https://chatgpt.com/codex/cloud/settings/environment/6aae123771c081919861dab327d63a9a

The GitHub connector is authorized for this repository only, and the
`android-staging` secrets are configured with a branch policy allowing only `main`.

For recreation, at https://chatgpt.com/codex/cloud/settings/environments, connect the confirmed GitHub
repository with the minimum available repository scope, then create a DUIT
environment. This requires the owner's authorization of the GitHub connection.

- Repository: `prakhar-goel/duit-cards-2025`.
- Node: 22 (at least 22.12).
- Setup script: `bash scripts/codex-setup.sh`.
- Maintenance script: `bash scripts/codex-maintenance.sh`.
- Verification command: `npm run verify:cloud`.
- No staging database, production credentials, provider keys, or signing secrets.
- Agent internet access can remain disabled initially. Setup installs dependencies
  with network access. If a task needs new packages, configure only the necessary
  registry access or rebuild the environment after its lockfile change.

The setup creates an isolated PostgreSQL instance on loopback port 55432 and only
`duit_2026_pilot_test`. It persists its URL in ignored `.local/codex-test.env`.
Maintenance restarts that instance after a cached environment resumes. It neither
connects to Neon nor restores, seeds, or modifies the hosted staging data.
`npm run verify:cloud` runs build safeguards, type checks, mobile/API tests and
both web builds. No Android SDK or private key is needed in coding tasks.

Do not run `setup:pilot`, `seed:pilot`, `initialize-staging.mjs`, or archive import
scripts against cloud staging as part of a coding task.

## Phone workflow (laptop may be off)

1. Open https://chatgpt.com/codex/cloud in Chrome and select **DUIT — cloud development**.
2. For new work start from current `main`. For unfinished laptop work, explicitly
   select the pushed `codex/...` branch. State the desired behavior and ask Codex
   to preserve the existing product flows and run `npm run verify:cloud`.
3. Review changes and follow up in the same cloud task. Open a focused pull request.
4. Let GitHub checks finish. Merge through the PR after required checks pass.
   If mobile behavior changed, update both `apps/mobile/app.json` and Android
   `app/build.gradle` with matching version and increasing versionCode before merge.
5. Wait for Pilot CI on the merged main commit, then open:
   https://github.com/prakhar-goel/duit-cards-2025/actions/workflows/android-staging.yml
6. Choose **Run workflow**, branch **main**. Leave **Publish** off for a trial build.
   Shared Maya login defaults on, preserving the existing tester experience.
7. After success, download the `DUIT-Android-...` artifact, extract its ZIP and
   install `DUIT-2026-Pilot.apk` over your current pilot. Artifacts expire after
   seven days. This is not a Play Store release.
8. For a new version intended for the shared download page, enable **Publish**.
   Existing immutable versioned APKs cannot be replaced: bump the version first.
   Open https://duit-cards-staging.onrender.com/download for the published APK.

A new Codex task does not automatically inherit desktop conversations or unpushed
files. Give it the branch, current objective, and relevant documentation. No
remote connection to the laptop is needed for this workflow. Actual Android
camera/sharing/device tests happen on the Samsung; passing CI is not proof of
physical-device behavior. Render Free may need time to wake up.

## Continue the same work on the laptop

Before leaving the laptop, finish a coherent commit and push the focused branch.
Do not assume unsaved/uncommitted work has reached GitHub. Keep any unfinished
notes in the PR description or a committed task-specific document.

On return, first inspect local changes:

```sh
git status --short
git fetch origin
```

With a clean worktree, resume an existing branch:

```sh
git switch codex/your-task
git pull --ff-only origin codex/your-task
```

For a branch first created in the cloud, use
`git switch --track origin/codex/your-task`. After the task has merged, use
`git switch main` followed by `git pull --ff-only origin main` and start the next
short-lived branch. If Git reports a conflict, diverged history, or local edits,
stop and reconcile those changes; do not force-push, reset, or discard them.
Avoid simultaneous edits to one branch from the laptop and a running cloud task.
To keep the exact same cloud conversation on the laptop, reopen Codex cloud in
its browser; to use desktop Codex, open the synced checkout and supply the PR/task
handoff. Source synchronization and conversation continuity are separate.

## Signed builds and access

Create a GitHub Actions environment named `android-staging`, restricted to the
`main` branch. Required encrypted environment secrets:

- `DUIT_KEYSTORE_BASE64`: base64 of the existing `.local/signing/duit-pilot.jks`.
- `DUIT_STORE_PASSWORD`, `DUIT_KEY_PASSWORD`: the existing signing passwords.
- `DUIT_SIGNING_CERT_SHA256`: SHA-256 certificate digest of the installed identity.
- `DUIT_DEMO_EMAIL`, `DUIT_DEMO_PASSWORD`: only the shared Maya tester login.

Do not upload secrets until the owner approves this destination and purpose.
Never put the operator login or database URL in these build secrets. The shared
Maya credentials become extractable from any prefilled APK by design, as in the
existing release; they must never protect owner capabilities or real private data.

Only protected main executes the signing workflow. It requires successful Pilot
CI for the exact source commit, reconstructs signing paths on the runner, verifies
certificate/package/version/server/source provenance, and removes signing files
at job end. Fork PR checks do not receive signing credentials. Maintainers able
to change approved main workflows are trusted with the signing environment.

Build logs and environment secrets are not downloadable artifacts. Only the APK
and non-secret provenance manifest are uploaded. Preserve an independent private
backup of the signing identity. Missing signing material fails closed rather than
creating a key that would break updates.

`Mobile Release` is the older EAS workflow, not this staging delivery path. No
EXPO_TOKEN or EAS subscription is needed for `Android staging APK`.

## Hosting and rollback

Existing Render + Neon staging remains authoritative. Do not add Vercel or a new
backend merely to enable phone coding. The same stable API is used from the Mac
and Samsung. Backend deployments follow Render's configured main/checks policy;
check deployment status before testing changed API behavior.

APK build artifacts are snapshots; `staging-latest` is the shared delivery channel.
For Android rollback, an older versionCode may be rejected without uninstalling
(and losing local app state); prefer rebuilding reverted source as a new higher
version. Backend code rollback does not undo a database migration. Preserve hosted
data and plan schema changes separately.

## Verification status

Infrastructure scripts and workflow definitions must pass CI before activation.
The first signed cloud build requires configured environment secrets. The Codex
cloud connection/environment and physical Samsung installation must each be
verified separately; a repository commit alone does not make those steps complete.
