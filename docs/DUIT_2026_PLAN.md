# DUIT 2026 private pilot

## Outcome

Deliver a coherent working product, not a clickable design: a modern Android app, persistent API, admin workspace and instant app-free business profile. Share what you do, remember who you met, and know what to do next. The owner and invited testers are the audience. This is not a public launch.

Repository: `duit-cards-2025`. Feature branch: `codex/duit-2026-private-pilot`. Keep the original restoration and its archive unchanged. Preserve all signing identities; the new pilot has a separate Android package `io.duit.ecards.pilot`.

## Product choices

- Use the existing business pitch / private encounter model. A person can have many meetings, needs, offers and outcomes.
- Refined warm ivory, deep ink/teal, restrained lime, generous whitespace and readable typography. Helpful motion, clear hierarchy, no decorative fake analytics.
- Mobile: Today, People, Capture, Meetings, My card. Search and leads belong to these flows, not a large new navigation layer.
- Shared web profile: owner-approved pitch and contact methods first; save a vCard, express interest, create your own profile and install the app second.
- Sender-entered recipient details remain a private draft. A forwarded link alone never verifies identity. Claiming requires verification and review before a recipient accepts or publishes anything.
- Admin: aggregate activity, searchable user/card inventory, access controls, AI usage and an audit trail. Private relationship notes are not ordinary admin browsing data.
- AI works inside tasks: card extraction, reviewed portrait/card improvement, pitch drafting, notes and commitments, evidence-based retrieval and a follow-up draft. Suggestions never silently become facts or outbound messages.
- Demonstration records are visibly labelled fictional. Historical records are labelled archive, remain private, and do not inflate live usage metrics.
- Keep original media; enhanced versions are separate, reviewable assets. Do not alter card text, invent credentials or beautify identity into another person.
- One-command local startup, device-configurable backend, portable APK, documented private internet access. The Mac must remain running when it hosts services.

## Architecture and ownership

- Keep the npm monorepo, Expo/React Native mobile and Express/Postgres foundation. Add `apps/web` for shared profiles and admin rather than force a mobile bundle into a public page.
- Isolate development in `duit_2026_pilot` and destructive tests in `duit_2026_pilot_test`. Never migrate the supplied archive or earlier prototype database by default.
- API owns authorization, canonical records, published snapshots, claim verification, private assets, usage limits and event accounting. Clients cannot set ownership or administrator status.
- Mobile owns secure session persistence, account-isolated cache, queued offline capture, permissions and native sharing.
- Web owns accessible responsive receiving, claim/review, sign-in and admin interactions. No personal credentials are embedded in bundles.
- Public cards read an approved published snapshot. Editing a draft does not change a live card until another explicit publish.
- AI provider is replaceable, server-side only, with typed task schemas and bounded spend. Missing credentials show an honest unavailable state.
- Local verification mail is an explicit development outbox until a real email service is configured. It is not represented as delivery to a recipient.

## Milestones and evidence

1. **Foundation:** record scope/research/API contracts; isolated databases; auth and ownership; connected shell; developer scripts.
2. **Complete exchange:** create/edit/review/publish/share card; app-free recipient page; lead capture; verified recipient draft claiming; protected admin.
3. **Remember and act:** contact capture, meetings, locations/events, commitments, filters, evidence search, needs/offers and outcomes; offline capture recovery.
4. **Real AI:** configure an approved provider and spending limit; real scan/pitch/note/search/follow-up/image/transcription examples; original/result review and failure handling.
5. **Polish and delivery:** curated private archive and explicitly fictional scenarios; Samsung APK; visual/functional QA; narrated video of the working product; reproducible runbook and focused commits/PRs.

## Acceptance checklist

- Two independently authenticated users cannot read or mutate each other's private contacts, notes, media, drafts, leads or AI jobs; admin scope is tested separately.
- Signed-out recipient can load a published profile, read the pitch, save contact data and submit consented interest. No private note or recipient draft appears in the response.
- Public card remains unchanged after draft edits; unpublish removes access. Claim token possession does not bypass email verification; claims are single-use and ownership-bound.
- Real card creation, person creation, meeting note, commitment completion, search, lead status and profile changes survive reload/restart.
- Phone works with a configurable reachable API, safe-area insets, keyboard, navigation, loading/error/empty states and permission denial.
- Offline notes are visible locally, visibly pending and sync once without duplication; cache is isolated on account switch.
- AI results identify their source and remain reviewable. Unavailable/failed/budget-exhausted states are explicit. No fake provider results pass as real AI.
- Critical web and mobile routes are visually reviewed; browser checks include phone and desktop widths. Android standalone APK installs alongside legacy DUIT.
- Test suite and build evidence, seeded-vs-live data distinctions, required credentials and known limits are documented honestly.
- Final MP4 has intelligible simple-English narration, readable actual product capture, restrained transitions and captions. It explains both the product and what is still a pilot.

## Boundaries

No public launch, paid API use, purchased infrastructure or marketing outreach without appropriate authorization. No automatic external sending. No claims of proven product-market fit or guaranteed revenue. Apple/Google Wallet distribution and App Store release require their real issuer/developer setup; do not ship a decorative Wallet button pretending to work.

The goal is complete only after the deliverables run together and the applicable checklist passes. Missing paid-provider credentials do not justify stopping independent implementation work.
