# Duit Cards — Backend Requirements

**Audience:** Backend engineer/agent designing the API, data model, and infrastructure for this product.
**Status of this doc:** Requirements and functional spec derived from the Phase 1 frontend prototype. It intentionally does not prescribe API routes, database engine, or framework — those are backend design decisions. Where the frontend already assumes a shape (e.g. onboarding payload), that shape is given as a constraint.
**Source:** [App.tsx](../App.tsx), [src/onboarding/](../src/onboarding/), [docs/onboarding-ai-and-storage.md](onboarding-ai-and-storage.md)

---

## 1. Product summary

Duit Cards is a digital business card + lightweight personal CRM. Users create a shareable digital card, scan or manually add contacts' cards, keep notes/tags/interaction history per contact, and get follow-up reminders. An AI-personalized onboarding flow tailors the experience to the user's role and networking goals.

The current repo is a **frontend-only prototype** (Expo/React Native) with all data hard-coded or stored in `AsyncStorage` on-device. Nothing syncs across devices and there is no authentication. Your job is to design the backend that replaces this mock layer.

## 2. Goals for the backend

1. Replace on-device mock data with a real multi-user backend: accounts, profiles, contacts, reminders sync across devices.
2. Support account creation/login (the prototype has none today — onboarding runs anonymously).
3. Persist the onboarding profile server-side instead of (or in addition to) `AsyncStorage`.
4. Replace the mock AI functions (`getAiFollowUpContent`, `getPlanBullets`) with real LLM-backed endpoints.
5. Support business card capture: OCR/parsing of scanned cards and photo uploads.
6. Support the "My Card" sharing flow: shareable link + QR code that resolves to a public-safe view of the user's card.
7. Support reminders with due dates, urgency, snooze, and (eventually) push notifications.
8. Handle PII responsibly — contact emails/phone numbers, uploaded photos, and personal profile data all need secure storage and transmission.

## 3. Core entities

These map to types already used in the frontend (`App.tsx`, `src/onboarding/state.ts`) plus the account layer the prototype is missing.

### 3.1 Account / User

The prototype has no auth — this must be introduced. Needed fields:
- `id`, `email` (or phone), `authProvider` (email/password, OAuth, magic link — TBD by backend design)
- `createdAt`, `updatedAt`
- `onboardingCompleted: boolean`, `onboardingCompletedAt`

### 3.2 Profile (the user's own digital card — "My Card")

Sourced from `OnboardingProfilePayload` in [state.ts](../src/onboarding/state.ts):

```ts
{
  fullName: string;
  roleTitle: string;
  company: string;
  website: string;
  networkingIntents: NetworkingIntentId[]; // "pitch_product" | "communicate_brand" | "partnerships" | "hire" | "learn_peers" | "investment"
  aiFollowUpChoice: string | null;
  completedAt: string;      // ISO timestamp
  mockAiVersion: string;
}
```

Additional fields implied by the "My Card" screen but not yet modeled client-side (currently hard-coded placeholders — `hello@duitcards.app`, a phone number):
- Public contact fields the user chooses to expose: email, phone, website
- A shareable identifier/slug for the public card URL
- QR code payload (likely just the shareable URL, generated client- or server-side)
- Card visual/theme selection (future; not in prototype yet)

**Constraint:** The onboarding UI is feature-flagged (`onboardingWizardV1` in [featureFlags.ts](../src/onboarding/featureFlags.ts)) and currently writes this payload to two `AsyncStorage` keys on completion *or skip*. The backend needs an endpoint that accepts this exact payload shape so the client swap is a drop-in replacement (see §6).

### 3.3 Contact

From the `Contact` type in [App.tsx](../App.tsx):

```ts
{
  id: string;
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  tags: string[];
  notes: string;
  interactions: string[];   // free-text log entries today; see note below
  lastSeen: string;         // currently a display string like "2 days ago" — backend should store a real timestamp and let the client format it
  favorite: boolean;
}
```

Notes for backend design:
- `interactions` is currently just a list of strings. Real requirement is an **interaction history log** — each entry likely needs its own timestamp, and possibly a type (call, meeting, email, note). Treat the frontend's flat string array as a placeholder for a proper `Interaction` sub-resource (see 3.4).
- `tags` are free-text and per-contact in the prototype. Decide whether tags are global (per-account, reusable, taggable/filterable in aggregate) or ad hoc per-contact strings — the Dashboard's "Tags" filter (`c.tags.length > 0`) suggests users expect to browse/filter by tag, which argues for tags being first-class, queryable objects scoped to the account.
- Contacts belong to an account (owner), not globally shared.
- `favorite` is a simple boolean toggle, surfaced in the Dashboard filter.

### 3.4 Interaction (recommended new entity, implied by "Interaction History" + "Remind me")

Not explicitly modeled in the frontend types yet (currently flattened into `Contact.interactions: string[]`), but the UI section is literally called "Interaction History" and reminders reference a person + a reason. Recommend:

```
Interaction {
  id, contactId, accountId
  type: enum (met, call, email, note, other) — TBD, not constrained by frontend yet
  summary: string
  occurredAt: timestamp
  createdAt: timestamp
}
```

### 3.5 Reminder

From the `Reminder` type in [App.tsx](../App.tsx):

```ts
{
  id: string;
  title: string;
  person: string;       // currently a display name string, not a contact id — should become a real contactId foreign key
  dueIn: string;         // currently a display string ("Today", "Tomorrow", "In 3 days") — backend must store a real dueAt timestamp
  urgency: "High" | "Medium" | "Low";
  completed: boolean;
}
```

Backend must:
- Store `dueAt` as a real timestamp; urgency can be either user-set or derived (e.g. server computes High/Medium/Low from time-to-due).
- Support "snooze" (the UI has a Snooze button, currently a no-op) — needs a way to push `dueAt` forward.
- Support "complete" (UI already removes the reminder from the list on complete — needs a persisted `completed`/`completedAt`).
- Link `person` to a real `contactId`, not a free-text name.

### 3.6 Onboarding AI interaction (session-scoped, not necessarily persisted long-term)

See §5.5 — the AI follow-up step and plan-summary step are currently pure client-side functions and need to become real API calls.

## 4. Functional requirements by screen/feature

### 4.1 Auth (new — not in prototype)
- Sign-up / login. The prototype currently lets users go through onboarding with zero authentication, so decide where auth is inserted in the funnel (before onboarding, after onboarding, or account creation deferred until the user wants to sync/share — product decision, flag as open question).
- Session/token management for the mobile app (e.g. JWT + refresh token), since this is a long-lived mobile session, not a browser.

### 4.2 Onboarding
- `POST` endpoint to persist the completed (or skipped) onboarding profile payload — same shape as `OnboardingProfilePayload` (§3.2). Must accept skip (partial/empty answers) as a valid completion state, since the UI's Skip button calls the same completion handler with whatever was filled in.
- AI follow-up step: given the partial form (name, role, company, website, networking intents so far), return a personalized headline/subtitle/options set. See §5.5 for the exact shape to preserve compatibility with `getAiFollowUpContent`.
- Plan summary step: given the full form, return an ordered list of personalized "we'll help you..." bullets (replaces `getPlanBullets`).
- Idempotency: user can skip at any step; the payload sent on skip only contains whatever fields were completed — backend must accept partial profiles (all fields besides completion metadata should be treated as optional/nullable).

### 4.3 Dashboard (Home)
- List contacts for the authenticated user, with:
  - Text search across name + company (client currently does this locally; for real scale, backend should support a search query param).
  - Filter by Recent (default/chronological), Favorites (`favorite = true`), Tags (contacts with ≥1 tag, or filter by a specific tag — UI currently only implements "has any tag").
- Needs pagination once contact lists grow beyond prototype scale.

### 4.4 Add Card
- **Manual entry**: create a contact from name/role/company/email/phone fields.
- **Scan card (OCR)**: the UI has a scanner mock only — no backend today. Real requirement: accept a photo of a business card, run OCR/parsing (own model, or third-party vision/OCR API), and return structured fields (name, role, company, email, phone) for the user to confirm/edit before saving. This is the most significant new backend capability — needs image upload, temp storage, an OCR/LLM extraction step, and a confidence/edit UX contract (return best-guess fields; user can correct in the form before submit).
- **Upload photo**: currently UI-only ("Upload Photo" button, no-op). Needs file upload (likely same pipeline as scan-card, or attaching a photo to a contact record without OCR).
- All of the above ultimately call **create contact**.

### 4.5 Contact Detail
- Fetch single contact by id (must be scoped to the owning account — no cross-account access).
- Edit notes, tags, favorite status (UI shows these but doesn't yet wire up editing — assume it's coming).
- Add interaction history entries.
- "Remind me" action: creates a new `Reminder` linked to this contact (UI button exists, not yet wired to any handler).

### 4.6 Reminders
- List reminders for the user, sorted by urgency (client currently sorts High → Medium → Low; consider also sorting/tie-breaking by `dueAt`).
- Snooze a reminder (push `dueAt` forward — exact increment is a product decision, e.g. +1 day).
- Complete a reminder (mark done, remove from active list).
- Future: push notifications when a reminder becomes due — needs device push token registration (APNs/FCM via Expo push service) and a scheduling/dispatch mechanism server-side.

### 4.7 My Card
- Fetch/update the current user's own profile (pre-populated from onboarding).
- Generate a shareable link and QR code for the card. QR currently mocked with a static icon — real requirement is: a public URL (e.g. `duitcards.app/u/{slug}`) encoded into a QR image, and a public-safe read-only endpoint that serves the card's public fields to anyone with the link (no auth required for the *viewer*, but the profile owner controls what's public).
- "Share Link" action — likely just copies/shares the same public URL; confirm whether any tracking (who viewed/scanned the card) is wanted (not in current UI, flag as open question — could feed back into the CRM concept, e.g. "X viewed your card").

## 5. Cross-cutting / non-functional requirements

### 5.1 Multi-device sync
Everything is local-only today (`AsyncStorage`). The core value of a backend here is that contacts, reminders, and profile data sync across the user's devices — design the API as the source of truth, with the client treating local storage as a cache, not the record of truth.

### 5.2 PII and data sensitivity
Contacts include third-party personal data (names, emails, phone numbers) collected without those third parties' direct consent to *this app* — this is a real privacy/compliance consideration (contact data is being stored about people who aren't the app's users). At minimum:
- Encrypt PII at rest and in transit.
- Support account data export/deletion (GDPR/CCPA-style rights), including a "delete my contacts" / "delete my account" flow — not in the current UI, but standard for apps that store personal data about a network of people.
- [docs/onboarding-ai-and-storage.md](onboarding-ai-and-storage.md) already flags: *"treat PII as sensitive: prefer encrypted local storage and/or server-side profiles tied to authenticated users."*

### 5.3 File/image handling
Needed for: card-scan photos, uploaded contact photos, and potentially a profile photo for "My Card" (not in current UI but common for this product category — confirm with product). Needs object storage (S3-compatible or similar), size/type limits, and a CDN or signed-URL delivery path for the client.

### 5.4 AI/LLM integration
Two mock functions to replace, both currently pure and synchronous client-side ([mockAi.ts](../src/onboarding/mockAi.ts)):

1. `getAiFollowUpContent(form)` → `{ headline: string; subtitle: string; options: {id, emoji, label}[] }` — personalizes a follow-up question based on the user's networking intents so far. Needs to become e.g. `POST /onboarding/ai-step` with `{ step: "followup", answers: OnboardingForm }`, returning the same shape. [onboarding-ai-and-storage.md](onboarding-ai-and-storage.md) already sketches this as a JSON-schema-constrained LLM call (OpenAI-style example included) — reuse that shape.
2. `getPlanBullets(form)` → `string[]` (max 6) — personalized "here's how we'll help you" summary. Same treatment, `step: "plan"`.
3. **Card-scan OCR/extraction** (§4.4) — new AI/vision capability not covered in existing docs, needed for the "Scan Card" feature to become real.

Guidance already in the repo: validate LLM output with a schema (e.g. Zod) before returning to the client; never forward arbitrary client-supplied URLs for server-side scraping without safeguards; cache expensive calls where sensible (e.g. by input hash) to control cost.

### 5.5 API shape compatibility note
To minimize frontend rework, prefer designing endpoints so the request/response bodies match the TypeScript types already defined in [App.tsx](../App.tsx) and [src/onboarding/state.ts](../src/onboarding/state.ts) (`Contact`, `Reminder`, `OnboardingForm`, `OnboardingProfilePayload`) rather than inventing new field names — treat those types as the contract to design against, adding real timestamps/foreign keys where the prototype used display strings (`lastSeen`, `dueIn`) or free text (`person`, `interactions`).

### 5.6 Environments / secrets
The project already has CI/CD conventions worth following for backend secrets — see [docs/ci-cd.md](ci-cd.md): don't print secrets to logs, scope tokens minimally, short-lived artifact retention. Apply the same discipline to backend API keys (LLM provider keys, OCR/vision provider keys, push notification credentials).

## 6. Migration path from the current prototype

1. Stand up auth + account creation.
2. Add a profile endpoint matching `OnboardingProfilePayload` exactly; swap the two `AsyncStorage.setItem` calls in `App.tsx`'s `handleCompleteOnboarding` for an API call, keeping local storage as an offline cache/fast-boot hint (`ONBOARDING_COMPLETED_KEY` pattern can stay as a local "don't show onboarding again" cache warmed from the server).
3. Replace `mockAi.ts` functions with API calls of the same signature (async now).
4. Replace the hard-coded `CONTACTS` / `INITIAL_REMINDERS` arrays with fetches from the new contacts/reminders endpoints.
5. Wire up the currently-inert UI actions (Save Card, Upload Photo, Remind me, Snooze, Complete, Share Link) to real endpoints.
6. Add the card-scan OCR pipeline last — it's the largest net-new backend capability (image upload + AI extraction) and isn't blocking the rest of the sync/CRUD work.

## 7. Open product questions for the backend design to account for

- Where does auth sit relative to onboarding — required before, or deferred until sync/sharing is needed?
- Are tags global per-account (reusable, filterable) or freeform per-contact?
- Should "My Card" views/scans be tracked and fed back to the owner (e.g. "3 people viewed your card this week")? Would extend the CRM concept but isn't in the current UI.
- What OCR/vision provider for card scanning, and what's the acceptable latency/cost budget?
- Push notification requirements for reminders — timing rules (e.g. notify at 9am on due date?), not yet specified.
- Data retention/export/deletion policy for contact PII (see §5.2).
