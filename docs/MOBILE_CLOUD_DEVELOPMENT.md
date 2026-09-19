# Develop DUIT from your laptop or Samsung

Target repository: https://github.com/prakhar-goel/duit-cards-2025

This is the modern pilot, package `io.duit.ecards.pilot`. The restored original
app, archive, and its signing identity remain in the separate restoration folder.
GitHub reported this repository as public at setup time; these changes do not
change its visibility. Do not commit credentials, real account data, uploads,
`.env.local`, `.local`, signing keys, or the historical archive.

## One-time Codex cloud setup

Configured environment: **prakhar-goel/duit-cards-2025**, owned by the intended
ChatGPT Pro account. Sign in to that same account on both devices.

https://chatgpt.com/codex/cloud/settings/environment/6aae227c65cc81918f371168903af48c

The GitHub connector must have access to this repository. Its installation scope
is managed separately in GitHub; the environment selects this one repository.
The `android-staging` secrets have a branch policy allowing only `main`.

For recreation, at https://chatgpt.com/codex/cloud/settings/environments, connect the confirmed GitHub
repository with the minimum available repository scope, then create a DUIT
environment. This requires the owner's authorization of the GitHub connection.

- Repository: `prakhar-goel/duit-cards-2025`.
- Node: 22 (at least 22.12).
- Setup script: `bash scripts/codex-setup.sh --app-only`.
- Maintenance script: `bash scripts/codex-setup.sh --app-only`.
- Verification command: `CI=1 EXPO_NO_TELEMETRY=1 npm run verify:cloud:app`.
- No staging database, production credentials, provider keys, or signing secrets.
- Agent internet access can remain disabled initially. Setup installs dependencies
  with network access. If a task needs new packages, configure only the necessary
  registry access or rebuild the environment after its lockfile change.

The standard environment installs locked npm dependencies without system-package
changes. Maintenance repeats the locked install (using cached packages where
available) so a resumed container matches the selected branch. Cloud app checks
cover build safeguards, type checks, mobile tests and both web builds. **They do
not run database integration tests.** GitHub Pilot CI runs those tests against its
isolated PostgreSQL service, including durable-upload tests; its Typecheck + Build
check must pass for the PR's current commit before merging. Report cloud app
checks and GitHub database checks separately. No Android SDK or private key is
needed in coding tasks.

### Optional full database environment

The full setup remains available with `bash scripts/codex-setup.sh`, maintenance
`bash scripts/codex-maintenance.sh`, and verification `npm run verify:cloud`.
It creates an isolated PostgreSQL instance on loopback port 55432 and only
`duit_2026_pilot_test`, with its URL in ignored `.local/codex-test.env`.
Maintenance restarts it after a cached environment resumes. It never connects
to Neon or modifies hosted staging data. Validate this mode independently before
using it: system-package installation in the current Codex image has not completed
reliably, although the same scripts pass GitHub's root and non-root setup checks.

The cloud image's signed Ubuntu snapshot supplies PostgreSQL. Setup avoids
refreshing unrelated third-party APT sources when that snapshot is present.
Package installation has explicit time limits so a network failure stops setup
instead of appearing to run indefinitely. A timed-out setup is a failure, not a
successful verification; inspect the package error before retrying.

Do not run `setup:pilot`, `seed:pilot`, `initialize-staging.mjs`, or archive import
scripts against cloud staging as part of a coding task.

## Phone workflow (laptop may be off)

1. Open https://chatgpt.com/codex/cloud in Chrome and select **prakhar-goel/duit-cards-2025**.
2. For new work start from current `main`. For unfinished laptop work, explicitly
   select the pushed `codex/...` branch. State the desired behavior and ask Codex
   to preserve the existing product flows and run
   `CI=1 EXPO_NO_TELEMETRY=1 npm run verify:cloud:app`.
3. Review changes and follow up in the same cloud task. Click **Create PR** in the
   task's web interface to publish a focused pull request. This uses the GitHub
   connector even when the agent's terminal has no remote or authenticated `gh`.
4. Let GitHub checks finish. Merge through the PR after required checks pass.
   If mobile behavior changed, update both `apps/mobile/app.json` and Android
   `app/build.gradle` with matching version and increasing versionCode before merge.
5. Wait for Pilot CI on the merged main commit, then open:
   https://github.com/prakhar-goel/duit-cards-2025/actions/workflows/android-staging.yml
6. Choose **Run workflow**, branch **main**. Leave **Publish** off for a trial build.
   Shared Maya login defaults on, preserving the existing tester experience.
7. After success, download the `DUIT-Android-...` artifact, extract its ZIP and
   install the versioned `DUIT-2026-<version>.apk` over your current pilot. Artifacts expire after
   seven days. This is not a Play Store release.
8. For a new version intended for the shared download page, enable **Publish**.
   Existing immutable versioned APKs cannot be replaced: bump the version first.
   Open https://duit-cards-staging.onrender.com/download for the published APK.

For the simplest phone download, enable **Publish** when running the workflow:
open https://github.com/prakhar-goel/duit-cards-2025/releases and select the
`DUIT-2026-<version>.apk` asset in the desired versioned release. This downloads
the APK without an artifact ZIP and keeps its version in the filename. Install
over the existing pilot; do not uninstall it just to update. The stable
`staging-latest/DUIT-2026-Pilot.apk` alias remains available for older links, but
prefer the versioned asset when downloading or retaining test builds.

Render hosts the download page and API; the APK itself is hosted in GitHub
Releases. A source-code change or successful Codex check does not publish an APK.
The full sequence is **Create PR → passing PR checks → merge → passing main CI →
Android staging APK with Publish enabled**. The Render page reads that published
channel and can cache release details for up to five minutes. A direct GitHub
download avoids Render's wake-up time.

If a cloud agent reports no `origin`, unauthenticated `gh`, or a proxy 403, try
the web task's **Create PR** action before changing the connector. These terminal
restrictions are separate from the connector's permissions. Do not paste tokens
or signing secrets into the coding task, or try to access its `/workspace` path
from the laptop. Only investigate/reconnect the connector if the web action
itself fails with an authorization error. The protected APK workflow can be
triggered from GitHub in the phone browser; it does not require terminal access
inside Codex cloud.

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
