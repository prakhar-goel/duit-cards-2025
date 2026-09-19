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

1. Open https://chatgpt.com/codex/cloud in Chrome, using the configured Pro account,
   and select **prakhar-goel/duit-cards-2025**.
2. Start new work from current `main`; choose the pushed `codex/...` branch for
   unfinished work. Ask Codex to read `AGENTS.md` and
   `docs/DEVELOPMENT_HANDOFF.md`, implement the change, and run
   `CI=1 EXPO_NO_TELEMETRY=1 npm run verify:cloud:app`.
3. To request a new APK, have Codex run `npm run release:prepare` once and include
   both version files in the PR. This increments the patch version and Android
   versionCode together; it needs no signing credentials or internet access.
4. Review the result and click **Create PR** (or **Update PR**) in the task web
   interface. This uses the GitHub connector even if the terminal has no remote
   or authenticated `gh`. Update the handoff notes before switching devices.
5. Merge after required PR checks and review conversations are resolved. **Merge
   is your release approval.** You can do it from GitHub on your phone.
6. GitHub runs Pilot CI on main. After it passes, **Android staging APK starts
   automatically**, signs a previously unpublished higher version, and publishes
   it to GitHub Releases and the Render download channel. There is no separate
   Run workflow step for normal releases. The shared Maya tester login is retained.
7. Wait for a successful Android staging run, then open
   https://duit-cards-staging.onrender.com/download or select the versioned
   `DUIT-2026-<version>.apk` asset at
   https://github.com/prakhar-goel/duit-cards-2025/releases. Install over the existing
   pilot; do not uninstall merely to update. Camera/sharing/device tests happen
   on the Samsung; CI alone does not prove those behaviors.

### Release safeguards and recovery

Only a successful **push** run of **Pilot CI** on this repository's current
**main** can trigger automatic signing. PR, fork, failed and superseded CI runs
cannot publish. Signing remains in the main-only `android-staging` environment;
ordinary Codex tasks get no signing keys or personal GitHub tokens. Automatic
builds retain Maya prefill and publish only to staging, not the Play Store.

Already published versions skip without rebuilding only after both the immutable
release and shared channel assets match. A partial channel publication triggers a
recovery job that copies verified release assets without rebuilding or accessing
a signing key. Documentation changes and
handoff checkpoints therefore do not generate duplicate APKs. A new version must
increase both version and versionCode. An incomplete existing release fails for
inspection instead of replacing an immutable published APK. If main advances
before checkout, the stale build stops; the newer main CI handles the release.

If a build fails, open its failed run and **Re-run failed jobs** after inspecting
and correcting the cause. For manual builds or retries, use
https://github.com/prakhar-goel/duit-cards-2025/actions/workflows/android-staging.yml
→ **Run workflow**, branch **main**, after its CI passes. Enable **Publish** to
update the shared channel, or leave it off for a build-only artifact (ZIP,
seven-day retention). An immutable APK with different bytes requires a new
version rather than a replacement. Do not call a release complete until the
workflow succeeds and the intended versioned asset exists. If that immutable APK
already exists but the shared page is stale because publication failed, select
**Recover channel** (`recover_channel`) in Run workflow. It verifies the existing
APK/manifest checksums, signing identity provenance, source ancestry and version
before repairing the shared channel. It refuses rollbacks and different APKs
with the same versionCode.

Render hosts the download page and API; GitHub Releases hosts the APK. Source
changes do not update already installed apps. Render can cache release details
for five minutes; a direct versioned GitHub asset avoids Render wake-up time and
keeps the version in the downloaded filename. The stable
`staging-latest/DUIT-2026-Pilot.apk` alias remains for older links.

If terminal commands report no `origin`, unauthenticated `gh`, or a proxy 403,
use the task's **Create PR / Update PR** action before changing the connector.
Do not paste tokens or signing secrets into the task or access its `/workspace`
path from a laptop. Investigate the connector if the web action itself reports
an authorization failure. OpenAI's documented cloud workflow ends with a diff
and a PR handoff; the protected GitHub workflow does the unattended release work.

## Cross-device continuity

`docs/DEVELOPMENT_HANDOFF.md` carries the current objective, branch, tested work,
remaining tasks and release status. Both cloud and desktop agents must read it
when resuming and update it at checkpoints. `npm run handoff` prints it with the
current commit and dirty paths without changing files or using the network.
A new conversation does not automatically inherit another conversation.

Cloud → laptop: use Create PR / Update PR so the branch exists on GitHub. On the
laptop, inspect local changes and fetch, then resume that branch if its PR is open
or current main if merged. Give desktop Codex the PR/branch and ask it to read the
handoff. Cloud → cloud works the same way, without turning the laptop on.

Laptop → phone: update the handoff, commit and push before leaving. Select the
same branch in a new cloud task and ask it to resume from the handoff. If returning
to an older cloud conversation, verify its checkout includes the latest GitHub
commit first. If it cannot refresh, start a new task on the updated branch. Never
use an old cloud snapshot to overwrite newer desktop work. Keep one active editor
per branch; use separate branches for independent simultaneous work.

Unfinished work may use a draft PR. It is backed up and accessible from either
device, but will not sign or release until it is ready, checked and merged.

## Continue the same work on the laptop

Before leaving the laptop, finish a coherent commit and push the focused branch.
Do not assume unsaved/uncommitted work has reached GitHub. Keep any unfinished
notes in the PR description or a committed task-specific document.

In the desktop Codex app, use the **duit-cards-2025** project at
`/Volumes/UserData/prakhargoel/Development/duit/duit-cards-2025`. The
**duit-cards-2018** project is a separate restoration and is not this cloud repo.

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
