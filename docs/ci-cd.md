# CI/CD for Mobile Delivery

## Branching model

- `main` is the only long-lived branch and the repository default.
- All implementation and documentation work uses a short-lived, descriptive branch.
- Codex-created branches use the `codex/` prefix, such as `codex/capture-flow`.
- Changes reach `main` through a pull request with required checks passing.
- Merged branches are deleted automatically; releases are represented by version tags and EAS build profiles rather than permanent Git branches.

## Workflows

- `/.github/workflows/ci.yml`
  - Runs on pull requests and pushes to `main`.
  - Security gate: dependency review fails on new high severity runtime dependencies.
  - Quality gates: install, typecheck, and web smoke build.
  - Uploads `apps/mobile/dist` artifact for quick inspection.
- `/.github/workflows/release.yml`
  - Manual release trigger (`workflow_dispatch`).
  - Validates required secrets before starting release build.
  - Runs typecheck then triggers EAS cloud build from `apps/mobile`.

## Required Secrets

- `EXPO_TOKEN`
  - Expo access token used by `expo/expo-github-action`.
  - Scope it to minimum org/project permissions required to run EAS builds.
  - Never echo this token in scripts.

## Environment Variables

- `EXPO_NO_TELEMETRY=1`
  - Reduces noise and telemetry in CI logs.
- `CI=true`
  - Ensures CI-safe behavior in tooling.

## Log Hygiene and Security Notes

- Do not print secrets or write them to artifacts.
- Keep release logs focused on build status and profile/platform metadata only.
- Keep artifact retention short (`7` days) for smoke build outputs.

## Rollback

If instability appears after rollout:

1. Disable workflow files by renaming with `.disabled` suffix or reverting the commit.
2. Re-enable only `ci.yml` first.
3. Re-enable `release.yml` after confirming secret setup and successful dry run.
