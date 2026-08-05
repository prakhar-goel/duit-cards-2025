# Duit Cards — Backend Requirements

**Audience:** Backend engineer/agent designing the API, data model, and infrastructure for this product.
**Status of this doc:** Rewritten from scratch against the current mobile app code (previous version was written against an earlier prototype and is substantially out of date — see §0 if a backend already exists).
**Source:** [App.tsx](../apps/mobile/App.tsx), [src/types/social.ts](../apps/mobile/src/types/social.ts), [src/data/](../apps/mobile/src/data/), [src/screens/](../apps/mobile/src/screens/), [src/components/](../apps/mobile/src/components/), [src/onboarding/](../apps/mobile/src/onboarding/), [src/api/](../apps/mobile/src/api/)

---

## 0. If a backend already exists — reconcile before building more

A backend may already exist with `contacts`, `reminders`, `interactions`, and `profile` modules modeled on an **earlier version of this app** (a simple contact list + reminders CRM). The mobile app has since been rebuilt around a different core entity — `Connection` (see §3.1) — with richer fields, no reminders screen, and a different profile concept. If that backend exists:

- Its `contacts` module is the closest match to `Connection` but is missing most of the new fields (business card imagery/theme, meeting metadata, category, exchange type, AI-generated narrative fields — see §3.1).
- Its `reminders` and `interactions` modules correspond to frontend features that no longer exist in the current app (see §3.4).
- Its `profile` module should be checked against the current LinkedIn-style Profile screen (§3.3), which is a different shape than a simple business-card profile.
- Its `onboarding` module is the one piece confirmed still accurate — the mobile app is actively calling it (see §1).

Reconcile the data model against §3 of this doc before adding new endpoints on top of the old assumptions.

## 1. What's already wired to a real backend today

Only onboarding/signup-related integration exists in the client right now. Everything else in the app still runs on local mock data ([src/data/connections.ts](../apps/mobile/src/data/connections.ts)) with no network calls.

**Onboarding AI steps** — [src/onboarding/OnboardingWizard.tsx](../apps/mobile/src/onboarding/OnboardingWizard.tsx) calls [src/api/onboardingApi.ts](../apps/mobile/src/api/onboardingApi.ts), which posts to:

```
POST {EXPO_PUBLIC_API_URL}/onboarding/ai-step
Body: { step: "followup" | "plan", answers: {
  fullName?: string; roleTitle?: string; company?: string;
  website?: string; networkingIntents?: NetworkingIntentId[];
} }
```

- `step: "followup"` must return `{ headline: string; subtitle: string; options: { id: string; emoji: string; label: string }[] }`.
- `step: "plan"` must return `{ bullets: string[] }`.
- The client base URL defaults to `http://localhost:4000/api/v1` (see [.env.example](../apps/mobile/.env.example), overridable via `EXPO_PUBLIC_API_URL`).
- **The client tolerates backend failure** — on any request error it silently falls back to the local mock implementation ([src/onboarding/mockAi.ts](../apps/mobile/src/onboarding/mockAi.ts)) so onboarding never blocks. Don't rely on the client surfacing backend errors to the user here.
- Onboarding completion transitions into [SignupScreen.tsx](../apps/mobile/src/onboarding/SignupScreen.tsx), which calls `POST /auth/signup` through [src/api/authApi.ts](../apps/mobile/src/api/authApi.ts) with the onboarding profile attached. If the user skips signup, or after signup succeeds, the onboarding profile is also cached in `AsyncStorage` for fast boot/offline use.
- Onboarding itself is live in the app again — `App.tsx` gates on `AsyncStorage` + `featureFlags.onboardingWizardV1` and shows `OnboardingWizard` before `MainNavigator` until the user completes or skips it.

Everything below this point (§2 onward) describes what the client will eventually need, based on what's rendered today — none of it has a network call wired up yet except the piece above.

## 2. Product summary (current app)

Duit Cards has shifted from a simple "contact list + reminders" concept to a LinkedIn-adjacent relationship app: a feed of **Connections** (people you exchanged business cards with, in person, at a specific place/time), a **Meetings** timeline view of the same encounters, a **Share** flow for sending your own card over WhatsApp, and a **Profile** page for the user's own presence. Onboarding still personalizes the experience via AI-generated follow-up questions.

The defining product idea, per code comments in [src/types/social.ts](../apps/mobile/src/types/social.ts): *"this is not a social post. It is a record of an in-person meeting: where/when it happened, how cards were exchanged, why the person may matter, and what follow-up should happen next."*

## 3. Core entities

These map directly to types in [src/types/social.ts](../apps/mobile/src/types/social.ts) and the screens that render them.

### 3.1 Connection (the core entity — replaces the old "Contact" concept)

```ts
{
  id: string;
  name: string; role: string; company: string;
  initials: string; photoUrl: string;
  businessCardImageUrl: string;
  businessCardTheme: { backgroundColor: string; accentColor: string; textColor: string };
  dateLabel: string;        // display string, e.g. "Today, 10:30 AM"
  dateBucket: "Today" | "Yesterday" | "This week" | "Older";
  monthYear: string;        // e.g. "May 2026" — used to group the feed
  dateSearchText: string;   // precomputed free-text search blob for date queries
  timeAgo: string;          // e.g. "2h ago"
  city: string; location: string; conferenceName?: string;
  exchangeType: "Shared my card" | "Received their card" | "Both exchanged cards";
  category: "Founder" | "Investor" | "Product" | "Engineering" | "Sales" | "Marketing";
  meetingType: "Conference" | "Coffee" | "Office" | "Dinner" | "Call";
  oneLiner: string;         // short description shown on feed cards
  relevanceShort: string;   // short version of "why this matters" (often empty)
  summary: string;          // "What happened"
  relevance: string;        // "Why this person is relevant"
  nextStep: string;         // "Suggested next step"
  tags: string[];
  contact: { email: string; phone: string };
}
```

**Backend design flag:** `oneLiner`, `relevanceShort`, `summary`, `relevance`, and `nextStep` read like AI-generated relationship insights, not user-typed fields — no UI anywhere lets a user type a "relevance" paragraph. This is the real AI requirement for this app, bigger than the onboarding copy: **given a raw exchange (a scanned/entered card + whatever context is captured about the meeting), generate these narrative fields, plus a suggested `category` and `tags`.** Treat this as the primary new AI/LLM capability to design, separate from and larger than the onboarding-step endpoint in §1. Nothing in the client calls out to generate these today — they're static in mock data — so there's no existing contract to preserve; design it fresh.

`dateLabel`, `timeAgo`, `dateSearchText`, and `monthYear` are all display/search conveniences precomputed client-side against static mock data today. A real backend should store one real `occurredAt` timestamp and either replicate this precomputation server-side (for consistent formatting) or move formatting to the client and only send raw timestamps — recommend the latter to avoid duplicating locale/timezone logic. `dateSearchText` in particular exists to support free-text queries like *"2nd week of Jan"* or *"2 months back"* (see the Date filter panel in [HomeScreen.tsx](../apps/mobile/src/screens/HomeScreen.tsx)) — decide whether this natural-language date matching happens client-side against a real `occurredAt`, or needs a backend/NLP-assisted search endpoint once data volume grows past what the client can filter locally.

### 3.2 Meeting (currently just a projection of Connection — needs a product decision)

```ts
{ id, date, name, company, initials, photoUrl, location, summary, nextStep, type: MeetingType }
```

In [src/data/connections.ts:441](../apps/mobile/src/data/connections.ts#L441), `meetings` is a straight `.map()` over `connections` — every connection produces exactly one meeting, with the same id. **This needs a product decision before backend design:** is `Meeting` a genuinely separate, repeatable entity (a connection could have multiple meetings over time — coffee today, a call next month), or is the Meetings tab just an alternate view/filter over the same Connection records? The current mock data is consistent with either interpretation. If meetings should support a real history (multiple touchpoints per relationship), design `Meeting` as its own table with a `connectionId` foreign key, not a derived view — this also gives you a natural home for what used to be called "interaction history" (see §3.4).

### 3.3 Profile (LinkedIn-style — not the same as onboarding profile)

[ProfileScreen.tsx](../apps/mobile/src/screens/ProfileScreen.tsx) currently hardcodes: full name, headline (one line), cover photo, avatar, location + connection count, an "Open to" pill and "Add profile section" button (both no-ops), and an About paragraph. None of this reads from the onboarding payload in `AsyncStorage` — the two are currently disconnected in the code. Needed fields once wired to a real account:

```
Profile {
  fullName, headline, coverPhotoUrl, avatarUrl,
  location, connectionsCount (likely derived: count of this user's Connections),
  openToStatus (structure TBD — button exists, no behavior yet),
  aboutText,
  profileSections: [] (structure TBD — "Add profile section" is a stub)
}
```

Decide whether this should simply *be* the onboarding profile enriched over time, or a genuinely separate "public profile" object — right now they're two disconnected concepts in the same app and only one (onboarding) has any persistence at all (local-only).

### 3.4 BusinessCard ("My Cards" — the user's own card personas)

New concept, not in any earlier version of this app. From [src/types/social.ts](../apps/mobile/src/types/social.ts) and rendered in [MyCardsSection.tsx](../apps/mobile/src/components/MyCardsSection.tsx) (horizontal strip at the top of the Home feed):

```ts
{ id: string; title: string; subtitle: string; accentColor: string; imageUrl: string }
```

Mock data shows a user maintaining multiple personas (e.g. "Designer," "Engineer," "Founder") each shareable independently. The UI has "Manage" and per-card "Share" affordances, plus an "Add Card" CTA — **all three are currently no-ops with no navigation wired**. This is the natural place for a real card-creation flow (replacing the old scan/manual-entry concept from the previous prototype) once built.

### 3.5 What's gone from the previous prototype (don't build against the old doc)

- **Reminders** — no screen, no type, no snooze/complete anywhere in the current app. If this is coming back, it needs a fresh product spec; don't resurrect the old `Reminder` type as-is.
- **Interaction history (multiple timestamped log entries per contact)** — `Connection` only carries a single `summary`/`nextStep`, not a log. See the Meeting-vs-Connection note in §3.2 — if interaction history returns, it likely belongs as multiple `Meeting` rows per connection rather than a separate entity.
- **Add Card scan/manual-entry screen** — no longer exists as a screen. The concept survives only as an inert "Add Card" button in §3.4.

## 4. Functional requirements by screen

### 4.1 Onboarding
Already has a partial contract — see §1. Remaining work: implement the real signup/profile endpoint and decide how local onboarding cache reconciles with server state after login.

### 4.2 Home (feed)
[HomeScreen.tsx](../apps/mobile/src/screens/HomeScreen.tsx) is the most complex screen in the app. All of the following is currently client-side filtering over the full mock `connections` array — a real backend should support these as query parameters once data volume makes client-side filtering impractical:

- **Sort**: Recent (default), Name, Most relevant (currently: tag count descending, then name — a placeholder heuristic worth replacing with something real once relevance is AI-generated per §3.1).
- **Quick filters**: Today, This week, Conference, Founder, Investor, Nearby (hardcoded to `city === "Jakarta"` today — real geolocation is implied but not implemented).
- **Exchange direction**: Shared by me / Received by me (OR within group).
- **Date range**: Today/Yesterday/This week, plus free-text natural-language query (see §3.1 note on `dateSearchText`).
- **City** and **Conference/Event**: multi-select from derived unique values, plus free-text.
- **Person/Category**: multi-select over `category`.
- **Connection triage/placement**: every connection has an implicit `primary` / `lessImportant` / `hidden` state (default `primary`), settable via a per-connection action sheet ("Move to less important," "Hide contact"). This is per-user, per-connection state and needs persistence — it's currently only in React state and resets on app reload.
- **My Cards strip**: renders `BusinessCard[]` (§3.4) at the top of the feed.

### 4.3 Connection Detail
[ConnectionDetailScreen.tsx](../apps/mobile/src/screens/ConnectionDetailScreen.tsx) is read-only today — fetch-by-id only, no edit affordances anywhere in the UI (no edit button, no note-taking field). If editing is wanted, it isn't speced by the current UI at all — flag as an open question rather than assuming a shape.

### 4.4 Meetings
[MeetingsScreen.tsx](../apps/mobile/src/screens/MeetingsScreen.tsx) — list/timeline of meetings with a type filter (All/Conference/Coffee/Office/Dinner/Call). See §3.2 for the entity-design question this depends on.

### 4.5 Share
[ShareScreen.tsx](../apps/mobile/src/screens/ShareScreen.tsx) — currently:
- Hardcoded card URL (`https://duit.cards/prakhar`) and hardcoded user identity (name/role) — needs to become the authenticated user's real shareable link.
- A decorative QR icon (not a real generated QR code from the URL).
- A WhatsApp share flow: user enters a recipient phone number, client deep-links to `https://wa.me/{digits}?text={message}` — this needs no backend involvement itself (it's a client-side `Linking.openURL` call), but the **card URL it shares** needs a real public-safe endpoint behind it — i.e. someone opening `duit.cards/{slug}` needs a server response with that user's public card info, no auth required for the viewer.

### 4.6 Profile
See §3.3. Every action on this screen ("Open to," "Add profile section") is currently a no-op — no backend contract exists yet because the UI doesn't do anything with them.

## 5. Cross-cutting / non-functional requirements

### 5.1 Multi-device sync
Still entirely local — only onboarding AI-step calls touch a network at all (§1). Contacts/connections, triage placement, and profile are all in-memory or `AsyncStorage`. The core value of a backend remains: sync across devices, with local storage as cache, not source of truth.

### 5.2 PII and data sensitivity
Connections carry third-party personal data (name, email, phone, employer) collected about people who aren't the app's own users. Same guidance as before: encrypt at rest/in transit, support data export/deletion, treat this as a real privacy/compliance surface, not just a CRUD dataset.

### 5.3 File/image handling
Needed for: connection photos, business card scan images, business-card-theme assets, Profile cover photo/avatar, and per-persona `BusinessCard` images (§3.4). All currently point at static Unsplash URLs in mock data. Needs object storage + upload endpoints once any of the "Add Card," "Manage cards," or profile-photo-editing flows are built (none are wired yet — see §3.4, §4.6).

### 5.4 AI/LLM integration
Two distinct needs, different in scale:

1. **Onboarding AI steps** (§1) — already has a live contract the client depends on (with graceful local fallback on failure). Keep the response shapes stable: `{ headline, subtitle, options }` for `followup`, `{ bullets }` for `plan`.
2. **Connection insight generation** (§3.1) — not wired to anything yet, but implied by the data model itself (`oneLiner`, `relevanceShort`, `summary`, `relevance`, `nextStep`, likely `category`/`tags` suggestions too). This is the larger, unbuilt piece: given raw input from a card exchange (scanned card fields + whatever meeting context gets captured — location, event, conversation notes), generate these fields. No OCR/scan UI currently exists in the app to feed this pipeline (see §3.5) — that needs to be designed alongside this, since right now there's no client entry point that produces the raw input this AI step would consume.

### 5.5 API shape compatibility note
Prefer designing request/response bodies to match the TypeScript types in [src/types/social.ts](../apps/mobile/src/types/social.ts) directly (`Connection`, `Meeting`, `BusinessCard`) rather than inventing new field names, the same way the onboarding endpoint already matches `OnboardingForm`/`mockAi.ts`'s shapes. Where the client currently precomputes display strings (`dateLabel`, `timeAgo`, `dateSearchText`), prefer sending raw data (timestamps) and letting formatting logic move to the client rather than replicating it server-side — these were prototype conveniences, not a contract worth preserving.

### 5.6 Environments / secrets
[.env.example](../apps/mobile/.env.example) establishes the pattern: `EXPO_PUBLIC_API_URL` for the API base (including version prefix, e.g. `/api/v1`), `.env` gitignored, `.env.example` tracked. Follow the same discipline for any new env vars (LLM provider keys, OCR/vision provider keys, object storage credentials) — see [docs/ci-cd.md](ci-cd.md) for existing secret-hygiene conventions in this repo.

## 6. Suggested build order

1. ~~Onboarding AI-step endpoint~~ — done, client already calls it (§1).
2. Auth/signup backend for the existing `SignupScreen` contract, including profile persistence and token issuance.
3. Settle the Meeting-vs-Connection data model question (§3.2) — this blocks designing Connections and Meetings correctly together.
4. Connections CRUD + the filter/sort/search parameters in §4.2, replacing [src/data/connections.ts](../apps/mobile/src/data/connections.ts) and [src/data/socialRepository.ts](../apps/mobile/src/data/socialRepository.ts) as the data source.
5. Connection triage/placement persistence (primary/lessImportant/hidden).
6. Public share-link endpoint for the Share screen (§4.5), plus real QR generation.
7. Profile backend (§3.3, §4.6) — after deciding its relationship to the onboarding profile.
8. BusinessCard ("My Cards") CRUD (§3.4) — currently the least-built-out area of the UI (every action is a no-op), so lowest urgency unless product prioritizes it.
9. Connection-insight AI generation + whatever capture flow (scan/manual entry) feeds it (§5.4 item 2) — the largest net-new capability, and the one with no existing UI entry point to build against yet.

## 7. Open questions for backend design to account for

- **If a backend already exists** (`contacts`/`reminders`/`interactions`/`profile` modules) — see §0. Reconcile against the current `Connection` model before extending it.
- Is `Meeting` a separate repeatable entity or a view over `Connection`? (§3.2) — blocks several downstream decisions including whether "interaction history" comes back.
- Is `Profile` (§3.3) the same object as the onboarding profile, evolved over time, or a separate "public profile" the user edits independently?
- Are Reminders and per-contact interaction history coming back as features? If so, they need a fresh spec — don't resurrect the old prototype's shapes.
- What does "Nearby" actually need — real device geolocation, or just a user-set home city?
- Should Share-link views be tracked and surfaced back to the owner (e.g. "3 people viewed your card")?
- What does "Add profile section" / "Open to" do, product-wise? No UI behavior exists yet to design against.
- OCR/vision provider and capture flow for feeding the connection-insight AI step (§5.4) — currently nothing in the client produces the raw input this would consume.
