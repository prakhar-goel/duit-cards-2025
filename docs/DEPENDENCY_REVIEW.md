# DUIT private pilot dependency and security review

Reviewed on 18 September 2026 (India time). This is a bounded review of the private pilot, not a penetration test or a claim that the application has no vulnerabilities. No paid AI requests, public tunnel, or active-server restart was performed for this review.

## Reproducing the dependency check

Run from the repository root after a clean, reproducible install:

```sh
npm ci
npm audit --workspace @duit/api --omit=dev
npm audit --omit=dev
npm run test:api
```

An npm audit exit code of 1 can mean reported advisories; a registry/DNS error is an unavailable audit, not a clean result. Counts below are npm's vulnerable-package counts, including parent packages affected by vulnerable dependencies, rather than counts of distinct bugs.

The completed audits before and after the clean dependency reconciliation reported:

| Scope                                              | Moderate | High | Critical | Total |
| -------------------------------------------------- | -------: | ---: | -------: | ----: |
| API production workspace, before                   |        1 |    0 |        0 |     1 |
| API production workspace, after                    |        0 |    0 |        0 |     0 |
| Entire production-labelled workspace graph, before |       15 |    8 |        0 |    23 |
| Entire production-labelled workspace graph, after  |       11 |    8 |        0 |    19 |

The entire workspace includes Expo's development and build toolchain because Expo is declared as a mobile dependency. Those findings must not be presented as 19 vulnerabilities in the upload API. They also must not simply be ignored: build machines and development servers are part of the project.

## API dependency: qs

The audited installation resolved `qs@6.15.3` through Express 5.2.1 and body-parser 2.3.0. Both current advisories are fixed in **6.16.0**: [array-limit bypass](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx) and [unsafe isBuffer call during stringify](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g).

Applied narrow root override:

```json
"qs": "6.16.0"
```

This is within Express's `^6.14.0` and body-parser's `^6.15.2` declared ranges. After the coordinator's clean install, both the lockfile and installed dependency resolve 6.16.0. The subsequent API production audit reported zero known advisories, and the isolated API/provider suite passed 34 tests. This is a dated dependency-audit result, not proof of complete application security. No API source dependency was added directly.

Current API code installs only JSON body parsing, leaves Express's simple query parser enabled, and does not call `qs.stringify` on request data. The specific advisory preconditions were not found in application code. Updating the dependency is still appropriate defense in depth.

## Expo 54 / Metro image-size

The inspected path is Expo 54.0.36 → `@expo/metro@54.2.0` → `metro@0.83.3` → `image-size@1.2.1`. The [ICNS advisory](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr) and [JXL/HEIF advisory](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq) concern malformed image buffers that can hang a Node process. The reviewed advisories mark versions through 2.0.2 as affected and do not name a patched image-size release.

Do not force a generic image-size 2.x override. Besides not resolving the reported affected range, Metro's current code expects the 1.x callable export. An API change could break bundling without actually removing the security issue.

There is a better maintenance candidate: upstream [Metro 0.83.8](https://github.com/react/metro/releases/tag/v0.83.8) replaces image-size with maintained vendored parsers. Expo 54's wrapper pins its Metro packages to 0.83.3, so using that fix requires a coordinated Metro-family update, not an isolated image-size override. Such an update should keep all `metro-*` packages aligned, pass Expo compatibility checks, export web/Android bundles, rebuild the signed APK, and complete device/deep-link regression checks. That combination has **not** been validated by this audit. No forced Expo SDK major upgrade was applied.

Until a tested maintenance update is integrated:

- Expose the packaged API/static web server only. Keep Metro, Expo development tools and Vite off public tunnels.
- Bundle reviewed repository assets. Do not copy arbitrary uploaded files into the app's build asset directories or run build tools over the private archive.
- Keep runtime uploads in the private media directory. The API validates bounded JPEG/PNG/WebP or audio uploads and does not import image-size or Metro. Native/browser image display is a separate implementation surface; this does not claim those decoders are vulnerability-free.

## Other remaining dependency findings

The earlier graph pulled `decode-uri-component@0.2.2` through `query-string@7.1.3` and React Navigation core 7.17.2. The [malformed percent-encoding CPU advisory](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) is fixed in 0.5.0. A blind override is unsuitable: [0.5.0's package](https://raw.githubusercontent.com/SamVerschueren/decode-uri-component/v0.5.0/package.json) is ESM, while the installed query-string expects a CommonJS callable. The coordinator's clean install resolved the compatible React Navigation core 7.22.1 maintenance version instead. The subsequent audit no longer reports this chain. No ESM override was forced. Android link and web navigation checks remain part of release verification; this was not treated as a harmless build-only dependency.

`uuid@7.0.3` also appears through `xcode@3.0.1` → Expo config plugins. The [buffer bounds advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq) is fixed in uuid 11.1.1. The path inspected is native project tooling, not the API's ID generation (which uses Node's `crypto.randomUUID`). Do not force uuid across several major versions under xcode without its own compatibility check. Keep native project inputs trusted and address this in the native tooling maintenance upgrade.

## API review and regression checks

The isolated suite passed **34 tests** after three concrete fixes from this review:

1. Signup and login now reject passwords beyond 72 UTF-8 bytes. bcrypt otherwise truncates silently; counting characters alone was insufficient. Tests accept exactly 72 bytes in ASCII and multibyte text and reject longer passwords sharing the same valid prefix. The limit follows [bcrypt's own guidance](https://github.com/dcodeIO/bcrypt.js#security-considerations).
2. Card publication now requires referenced private portrait/cover assets to have an image MIME type. An owned voice note cannot become public card artwork. Tests assert rejection, continued public denial of the recording, and preservation of the last reviewed public snapshot. Panels currently contain text only; they have no image publication field.

3. The AI execution boundary now separates provider failures from database settlement failures. A successful provider response followed by a failed billing transaction retains its reservation and known cost evidence for review instead of treating the request as uncharged. The regression test uses a real PostgreSQL trigger to reject a successful settlement after a mocked provider response, then verifies retained funds, preserved cost evidence and no repeated provider call. The trigger is removed during cleanup. AI remains disabled until credentials and a spending limit are explicitly enabled.

Existing checks cover owner isolation, reviewed immutable publication, private lead records, explicit event deduplication, claim verification and matching account email, invitation-only signup, refresh rotation/logout, private media denial even for another account or an operator, approved image exposure, escaped server-rendered card content, scoped static traversal denial, APK HEAD responses, and JSON API errors. AI provider calls are mocked; tests cover budget reservation concurrency and uncertain provider charges.

Remaining limitations of this review and pilot:

- Verification delivery uses a clearly labelled private local outbox; no real email provider is configured. A token in the outbox is a verification secret, not an email sent to a mailbox.
- Rate limits are in memory and reset on restart. Behind the current local tunnel, users share the proxy's IP bucket; there is no distributed rate-limit service or blindly trusted forwarded IP header.
- Published image responses can remain in browser caches for up to five minutes after unpublishing. This is not a promise of immediate erasure from a recipient's device.
- No automated end-to-end external penetration test, fuzzing campaign, cloud identity review, or independent audit of Android/native OS libraries was performed.

## Final reconciliation record

Final inspected versions: qs 6.16.0; React Navigation core 7.22.1; Metro 0.83.3; image-size 1.2.1; xcode 3.0.1; uuid 7.0.3. The API-only production audit completed with exit code 0 and zero reported advisories. The whole-workspace production audit completed with exit code 1 and 19 vulnerable-package findings (8 high, 11 moderate), all recorded above by dependency chain. The isolated API/provider command completed with 34 passed and zero failed tests. Its intentional injected PostgreSQL failure appears once in test output; it is the expected fault-injection case, not an unhandled test failure. No active server was restarted, and no provider was contacted.
