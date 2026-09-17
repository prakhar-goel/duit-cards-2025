# DUIT 2026 private pilot

DUIT helps people share a useful business profile, remember where and why they met, and follow through. This repository contains the new pilot. The restored original app and its supplied archive remain separate in `../misc/duit-cards`.

## Run it

Use Node.js **22.12+**, npm and a running local PostgreSQL server.

```sh
npm install
npm run setup:pilot
npm run build:public
npm run phone
npm run seed:pilot
```

`phone` starts a persistent background API and serves the website, shared profiles and admin dashboard. It prints the Mac address, the Wi-Fi phone address and the internet-address status. Close the terminal tab without stopping it; keep the Mac awake. `npm run phone:status` shows current addresses, and `npm run phone:stop` stops this project's managed process.

Open the printed address for the website, `/admin` for the dashboard and `/download` for the APK. Use `.local/credentials.json` for the generated operator and fictional demo credentials. That file, `.env.local`, media, recordings and signing keys are private and ignored by Git.

For an internet connection when needed, run `npm run phone:internet`. This starts a Cloudflare quick tunnel and enables an invitation gate. It does not configure Cloudflare Access; DUIT account permissions still protect private data. Close it with `npm run phone:internet:stop`. See [complete setup, network and recovery instructions](docs/RUN_PILOT.md).

## What works

- **Android app:** Today, People, Capture, Meetings and My Card use the persistent API. People retain repeated meetings, dates, locations, original notes, promises, needs and offers. Capture supports manual entry and optional camera, gallery, audio and foreground location. Account-specific cached data and pending offline captures are isolated.
- **Business profiles:** owners edit and review a six-panel pitch before publication. Published snapshots open without the app, with QR/link/WhatsApp sharing, vCard download and a consented enquiry form. A recipient's starting draft remains private until verification and review.
- **Admin:** scoped statistics, account and published-profile management, audit history, development verification outbox, and a private searchable historical archive. Ordinary admin browsing does not expose personal meeting notes or recordings.
- **AI integration:** real server-side adapters support extraction, drafting, summaries, evidence-based search, transcription and image edits. AI is disabled until a provider key and an approved budget are configured. Mock-provider tests verify contracts; they are not evidence of live model quality.

Six fictional public profiles, their event/meeting activity and generated portraits are labelled as demo data. The curated historical library contains 300 selected profiles and 630 distinct copied images. Historical profiles are not public pilot accounts or current growth metrics. See [data provenance](docs/DEMO_DATA.md).

## Project structure

| Path            | Purpose                                                                    |
| --------------- | -------------------------------------------------------------------------- |
| `apps/mobile`   | Expo 54 / React Native 0.81 standalone Android app and development preview |
| `apps/api`      | Express / PostgreSQL API, ownership rules, media and provider adapters     |
| `apps/web`      | React / Vite shared-profile website, landing page and admin dashboard      |
| `scripts`       | Setup, persistent launcher, seed/import, Android build and verification    |
| `scripts/video` | Narrated walkthrough scripts and reproducible renderer                     |
| `docs`          | Product inputs, decisions, research, API and verification evidence         |

Local databases are `duit_2026_pilot` and the strictly guarded `duit_2026_pilot_test`. Setup and tests reject the legacy database names. The current app entry is `apps/mobile/src/pilot`; earlier prototype screens remain in the repository for reference and are not the active product.

## Develop, verify, build

```sh
npm run dev             # API + Vite + Expo
npm run typecheck
npm run test            # mobile unit checks + isolated API/provider tests
npm run build:public    # website served by the API
npm run build:web       # mobile browser export
npm run test:web        # real running-server browser journeys; requires seeded pilot
npm run build:apk       # signed ARM64 APK for Samsung S25 Ultra
```

Browser verification uses Playwright: install its Chromium with `npx playwright install chromium`, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to a compatible installed executable. Tests create uniquely named fixtures and remove those exact records. The API tests require `TEST_DATABASE_URL` ending in `/duit_2026_pilot_test`.

The APK is `artifacts/DUIT-2026-Pilot.apk`, package `io.duit.ecards.pilot`. Preserve `.local/signing` for future updates. This identity does not replace the old DUIT app. The app has a server-address setting, so Wi-Fi or tunnel changes do not require rebuilding it.

## Pilot boundaries

- Live AI/provider quality remains unverified until the owner approves the provider budget and supplies a server key. Manual workflows remain available. See [AI provider plan](docs/AI_PROVIDER_PLAN.md).
- Recipient verification currently uses an explicitly labelled private local outbox. No email is delivered. External self-service onboarding requires a real delivery provider.
- Android emulator validation is recorded; physical Samsung camera/QR/audio testing and iOS distribution remain separate checks. There is no claimed App Store release, Wallet pass, automatic CRM sync, or automatic outbound messaging.
- The current build is a private pilot. See [dependency review](docs/DEPENDENCY_REVIEW.md) and [execution evidence](docs/DUIT_2026_PROGRESS.md) for known limits rather than treating a successful demo as a production certification.

[Delivery and private videos](docs/DELIVERY.md) · [Product requirements](docs/PRD.md) · [Verbatim user inputs](docs/PRODUCT_INPUT_LOG.md) · [Implementation plan](docs/DUIT_2026_PLAN.md) · [Market research](docs/DUIT_2026_MARKET_RESEARCH.md) · [API contract](docs/API_PILOT.md) · [Walkthrough storyboard](docs/WALKTHROUGH_STORYBOARD.md)
