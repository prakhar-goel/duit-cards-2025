> **Latest user direction — visual iteration, then stop:** The product is now card-first (Person → Card → Business), with a visual wallet and a separate concise walkthrough. See `VISUAL_ITERATION.md`. The broad goal is paused at the user’s request; earlier pending AI/GitHub work below is historical tracking, not an instruction to continue automatically.

# DUIT 2026 execution record

Editorial date: 18 September 2026. This is evidence for a private pilot, not a production certification.

## Implemented

- Active goal accepted; the modern pilot is on `codex/duit-2026-private-pilot` in the newer repository. The restored app, archive databases, original files and Android identities remain unchanged.
- Verbatim product input is appended. The PRD, scope, primary-source market review, provider plan and data provenance are documented.
- Persistent owner-scoped API, real account authentication, mobile workflows, public shared profiles, recipient draft review, private admin and media controls are implemented together.
- Six labelled fictional business profiles seed real persisted records. Maya has 30 people and 45 meetings; Noah provides a separate account for isolation checks. Seeded activity is not evidence of real customers or demand.
- The private library contains 300 selected historical profiles and 630 distinct copied images. Repeating the import does not duplicate records or media. Archive profiles are not public pilot accounts.
- Real AI adapters are implemented, but application API calls remain disabled pending provider-budget approval and a locally configured key. No paid application API call or public deployment has occurred.
- Setup and launchers support foreground development, persistent phone access, status/stop, and explicitly requested internet access. No real modern-pilot tunnel has been opened during verification.
- The first separately signed ARM64 release installed successfully on the emulator. The final release includes the upload/account-switch fixes and passes APK signature verification. Final native retesting is waiting for the Mac to be unlocked; actual browser-app capture continues meanwhile.

## Evidence recorded so far

| Check                                             | Observed result                                                                                                                       | Local evidence                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| TypeScript across mobile/web and API entry syntax | Passed                                                                                                                                | Terminal execution, 18 September 2026                                        |
| API and provider contract tests                   | 34 passed, including final AI settlement regression                                                                                   | `apps/api/test`; `artifacts/qa/final-unit-integration-tests.txt`             |
| Mobile unit checks                                | 21 passed, including account/server switch regression                                                                                 | `apps/mobile/src/pilot` tests; same final combined test log                  |
| Mobile browser workflows                          | Eight journeys passed: real login, offline capture/single sync, card review/publish/share, second-account isolation/import, reload    | `artifacts/qa/mobile-browser-verification.json`                              |
| Public website/admin browser checks               | Eight checks passed; no page errors or horizontal overflow at 390px and 1440px                                                        | `artifacts/qa/web/verification.json` and 11 viewport captures                |
| Recipient ownership                               | Neutral verification start, private local outbox, matching-email verification, reviewed acceptance persisted                          | API tests and web journey; uniquely named test records cleaned               |
| Android native checks                             | Login, keyboard, people/details, meetings, My Card, gesture-bar spacing, optional permission denial and gallery cancel checked        | `artifacts/qa/native/`                                                       |
| API media boundaries                              | Archive requires admin; public endpoint refuses private assets; non-image publication is rejected                                     | API tests                                                                    |
| Launcher lifecycle                                | Detached persistence, foreground Ctrl+C cleanup, exact process ownership, external-server reuse/stop, mocked tunnel start/stop passed | Agent verification at alternate port 48162; live server48152 left untouched  |
| Public website production build                   | Passed, Vite7.3.6; main JS about87KB gzip                                                                                             | `apps/web/dist`                                                              |
| Video capture                                     | Six browser and nine actual app-web sequences recorded; both narrated videos rendered and checked                                     | Ignored `artifacts/videos/captures` and `artifacts/videos/verification.json` |

No simulated-provider test is reported as a live AI quality test. Emulator permissions are not a claim that physical Samsung camera, microphone, QR scanning, every network or every Android navigation mode has passed.

## Remaining acceptance work

1. Completed: final account-switch/AI-settlement regressions, clean dependency reconstruction, browser production builds and final signed APK. API dependency audit reports zero advisories; remaining tooling findings are documented.
2. Retest affected native paths after the Mac is unlocked. Both videos are complete and visually/structurally checked, using accurately labelled actual app-web recordings. A full listening review was not performed.
3. Product/research milestone bed4eb4 is pushed. The implementation is committed locally at 2b617b7, but GitHub rejected its push because the OAuth token lacks workflow scope for the CI update. Permission refresh was requested. No PR checks or merge are claimed.
4. Obtain the approved AI development budget and server key, then perform real sample jobs and original/result review. This remains required to call the AI portion complete.
5. Supply a real verification delivery provider before claiming self-service external recipient onboarding. The current private test outbox is explicitly labelled and sends no email.

## Reproduction and limits

Use [RUN_PILOT.md](RUN_PILOT.md) for commands and [DEPENDENCY_REVIEW.md](DEPENDENCY_REVIEW.md) for the current dependency findings. Preserve `.local/signing`, `.env.local`, media and the original archive. The goal remains active while its required deliverables or live-AI acceptance are outstanding.

## Handoff

See [DELIVERY.md](DELIVERY.md) for the exact APK hash, video files, current run addresses and remaining external steps. The managed API is running in the background; no internet tunnel is active.
