# Duit Cards 2025

Duit Cards helps professionals make introductions memorable and actionable. It combines an AI-crafted public pitch and CTA with private relationship memory and a relevance feed.

This repository is a monorepo for the Duit Cards 2025 product. It contains the **Expo + React Native mobile app** in `apps/mobile` and an **Express + PostgreSQL API** in `apps/api`.

## Repository Structure

```text
apps/
  mobile/        Expo + React Native app for iOS, Android, and web preview
  api/           Express API and PostgreSQL-backed MVP domain
docs/            Product, backend, onboarding, and delivery documentation
packages/        Shared packages will live here as backend/common code is added
```

Key product documents:

- [Product requirements document](docs/PRD.md)
- [Verbatim product input log](docs/PRODUCT_INPUT_LOG.md)

## Product Vision

Duit serves both sides of a professional introduction:

- **When sharing:** turn a card into a short, engaging pitch that explains the owner's value and invites a clear next action.
- **When receiving:** preserve the person and encounter, then resurface who is relevant to something the user needs or can offer now.

Duit structures and presents the user's or company's pitch. Duit is the platform—not the subject of that pitch.

## Current Scope (Phase 1)

The mobile relationship screens still use prototype mock data while their API integration is designed. Onboarding signup and AI steps already call the API, and the backend now implements the two core MVP loops.

### API MVP

- Authentication and persisted onboarding profiles
- Owner-approved six-panel pitch drafts and published cards
- App-free public card retrieval, CTA events, consented lead capture, and lead inbox
- People, repeatable encounters, preserved original notes, commitments, and AI-assisted recap/follow-up drafts
- Needs/offers and an explainable private feed for due commitments and relevant people

The API defaults to `postgresql://duit@localhost:5432/2026_duit_cards`. Copy [`apps/api/.env.example`](apps/api/.env.example) to a local `.env` only when overriding that development configuration. The server migrates its schema safely on startup.

### Implemented Screens

- Onboarding Wizard (new)
  - Minimal, Google-inspired flow: name first, then personalized copy
  - Role, company, optional website, networking intents (multi-select)
  - Mock “AI” step + plan summary (replace with API; see `docs/onboarding-ai-and-storage.md`)
  - Saves profile JSON locally on complete or skip; feature-flag controlled
- Home Dashboard
  - Search contacts
  - Filter by `Recent`, `Favorites`, and `Tags`
  - Floating add action
- Add Card
  - Scan card mock UI
  - Manual card entry form
  - Upload photo CTA (UI only)
- Contact Detail
  - Card-style profile preview
  - Notes, tags, and interaction history
  - Remind me action
- Reminders
  - Follow-up list sorted by urgency
  - Snooze and complete actions
- My Card
  - Personal digital card preview
  - QR mock and share actions

## Design Direction

- Clean, minimal, modern UI
- Generous spacing and rounded corners
- Soft shadows and clear hierarchy
- Fast, lightweight interactions

## Tech Stack

- Expo SDK 54
- React Native 0.81
- React 19 + TypeScript
- React Navigation (Bottom Tabs + Native Stack)
- `react-native-safe-area-context`
- `react-native-screens`
- `expo-linear-gradient` (onboarding backgrounds)

## Getting Started

### 1) Prerequisites

- Node.js 18+ recommended
- npm
- Expo Go app on your phone (optional but recommended for quick testing)

### 2) Install dependencies

```bash
npm install
```

### 3) Run the app

Start the complete local development surface with Duit's dedicated high port
range:

```bash
npm run dev
```

This starts Expo for mobile and web, selects an available port starting at
`48151`, configures the client API port starting at `48152`, and prints all
local/LAN URLs plus a scannable Expo Go QR code in the terminal. The API starts
alongside the mobile development server. Override the
preferred ports when needed:

```bash
DUIT_MOBILE_PORT=49151 DUIT_API_PORT=49152 npm run dev
```

The lower-level Expo command remains available:

```bash
npm run start
```

Then choose one target:

- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan the QR code with Expo Go on a physical device

You can also run directly:

```bash
npm run ios
npm run android
npm run web
```

You can also target the mobile workspace explicitly:

```bash
npm run start --workspace @duit/mobile
```

## Available Scripts

- `npm run start` - Start Expo dev server
- `npm run api` - Start the API only (default `http://localhost:4000/api/v1`)
- `npm run ios` - Launch on iOS
- `npm run android` - Launch on Android
- `npm run web` - Launch web preview
- `npm run test` - Run unit tests (Vitest)
- `npm run typecheck` - Run TypeScript checks
- `npm run build:web` - Export static web build to `apps/mobile/dist/`
- `npm run ci:verify` - Run tests + typecheck + web export validation

## Feature Flags

- `apps/mobile/src/onboarding/featureFlags.ts`
  - `onboardingWizardV1`: controls whether onboarding is shown for users who have not completed it yet.

## Onboarding + AI notes

- See [docs/onboarding-ai-and-storage.md](docs/onboarding-ai-and-storage.md) for wiring real LLMs, website enrichment, and production storage.
- See [docs/backend-requirements.md](docs/backend-requirements.md) for the current backend requirements derived from the mobile code.

## Project Notes

- This is a **prototype**, not production-ready.
- Backend integration is partial: onboarding AI/signup client calls are live, while most existing relationship screens still use mock/static data.

## Next Suggested Steps (Phase 2)

- Wire the relationship screens to the people, encounter, and feed endpoints
- Build the owner card editor and app-free public card view against the card APIs
- Add QR/Wallet pass generation and notifications

## Repository

GitHub: [git@github.com:prakhar-goel/duit-cards-2025.git](git@github.com:prakhar-goel/duit-cards-2025.git)
