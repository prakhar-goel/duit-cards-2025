# Duit Cards 2025 - Product Requirements Document

| Field | Value |
| --- | --- |
| Document status | Draft for product review |
| Version | 0.1 |
| Last updated | 2026-08-04 |
| Product stage | Pre-MVP prototype |
| Product owner | Prakhar Goel |
| Intended readers | Product, design, engineering, go-to-market, advisors |
| Source of truth | This document for product intent; `backend-requirements.md` for current implementation observations |

## 1. Executive summary

Duit Cards is a mobile relationship-memory product for professionals who meet people in person. It helps a user capture who they met, preserve the context of the encounter, understand why the relationship may matter, and complete an appropriate follow-up.

The product is not primarily a digital business-card designer, a social network, or a traditional sales CRM. Its proposed wedge is the short period immediately after a professional encounter, when valuable context is fresh but is normally lost across paper cards, phone contacts, LinkedIn connections, notes, and memory.

The MVP should prove one core behavioral loop:

> A user captures a real person and encounter in under 45 seconds, trusts the organized result, and returns to complete a follow-up.

The current prototype demonstrates the destination experience - connection feed, connection details, meeting timeline, card sharing, onboarding and profile - but it does not yet support the complete capture-to-follow-up loop. The MVP should prioritize that loop over advanced filters, multiple card personas, social-profile features, or enterprise administration.

## 2. Document conventions

- **Committed:** included in the proposed MVP unless product review changes it.
- **Hypothesis:** a reasoned assumption requiring user or market validation.
- **Open decision:** a choice that materially changes scope, positioning, or architecture.
- **Later:** intentionally excluded from MVP, not rejected forever.

Market figures in this document are planning inputs, not audited forecasts. Third-party market reports use inconsistent definitions of "digital business card," so the bottom-up model is more useful for decisions than a single headline number.

## 3. Product vision

### 3.1 Vision

Make every meaningful professional encounter easy to remember and act on.

### 3.2 Product promise

> Meet someone. Capture the moment. Follow up with confidence.

### 3.3 Positioning statement

For professionals who meet valuable people at events, offices and informal meetings, Duit Cards is a mobile relationship-memory tool that turns a card exchange and a few seconds of context into an organized contact, an encounter history and a useful next step. Unlike digital card apps that stop at sharing details or CRMs that require heavy data entry, Duit is designed around the real-world moment of meeting.

### 3.4 Product principles

1. **The encounter is the atomic moment.** Preserve where, when, why and what happened, not only contact fields.
2. **Capture first, organize second.** The user should not complete a CRM form while standing at an event.
3. **AI proposes; the user confirms.** Facts and suggested interpretation must remain distinguishable and editable.
4. **Follow-up is part of capture.** A saved contact without a next action is an incomplete product outcome.
5. **Private by default.** Third-party contact and meeting data is sensitive and must never become public accidentally.
6. **Useful with one user.** The product must deliver value before network effects or team adoption.
7. **Interoperable, not captive.** Users should be able to export contacts and eventually synchronize with tools they already use.

## 4. Problem definition

### 4.1 User problem

Professionals often collect a name, card, LinkedIn connection or phone number without preserving the context that made the encounter valuable. Days later they may remember the person but not the conversation, intended introduction, promised follow-up or reason to reconnect.

Existing behaviors fragment the record:

- Paper and digital cards preserve identity but usually not context.
- Phone contacts preserve fields but not relationship history.
- LinkedIn preserves a network but is optimized for identity, content and messaging.
- Notes preserve context but are disconnected from the person and follow-up.
- Traditional CRMs are optimized for organizational sales processes and require more structure than an individual wants at the moment of meeting.

### 4.2 Core jobs to be done

When I meet someone professionally, I want to capture their identity and the important context quickly, so I can remember why the relationship matters and take the right next step later.

Supporting jobs:

- When someone asks for my details, I want to share a polished card without requiring them to install an app.
- After an event, I want to see whom I met and which follow-ups are due.
- Before meeting someone again, I want a concise reminder of our history.
- When my network grows, I want to retrieve people by name, company, event, place, category or context.

### 4.3 Current alternatives

- Exchange a paper card and keep it physically.
- Add a phone contact manually.
- Connect on LinkedIn and rely on memory.
- Take a photograph of a card.
- Add a note in Apple Notes, Google Keep or WhatsApp.
- Scan into CamCard or another card scanner.
- Store the person in a personal CRM such as Dex.
- Create a lead in HubSpot, Salesforce or another team CRM.

### 4.4 Why now

- Multimodal OCR and language models can reduce the work of structuring cards and short notes.
- QR links and mobile wallets make app-free card sharing normal.
- Competitors have validated willingness to pay for digital cards, scanning, enrichment and contact workflows.
- The market remains fragmented between card exchange, contact capture, relationship memory and sales CRM.

## 5. Target market and personas

### 5.1 Proposed beachhead segment

**Hypothesis:** English-speaking founders, independent consultants and business-development professionals in India and Southeast Asia who attend at least two professional events or external meetings per month.

Why this segment:

- Encounters are frequent enough for the problem to recur.
- The user personally owns the relationship and follow-up.
- Traditional CRMs may be unavailable, burdensome or reserved for qualified sales leads.
- A mobile-first workflow fits the physical context.
- India and Southeast Asia provide an accessible initial network for founder-led discovery, but geography remains an open decision.

### 5.2 Primary persona - The network-driven operator

**Example:** founder, consultant, partnerships lead or agency owner.

- Meets 10-40 new professional contacts in an active month.
- Uses WhatsApp and LinkedIn heavily.
- Has no consistent system after an event.
- Values warm introductions, partnerships and opportunities that may not belong in a sales pipeline.
- Needs low-friction capture and reminders more than elaborate analytics.

### 5.3 Secondary persona - The event-based seller

- Attends conferences, trade shows or customer meetings.
- Captures leads for eventual CRM entry.
- Needs card scanning, qualifiers and rapid follow-up.
- May become a team buyer later, but enterprise lead capture is not the initial MVP.

### 5.4 Secondary persona - The ecosystem professional

- Investor, recruiter, community leader or accelerator operator.
- Meets people whose relevance may emerge months later.
- Values context, retrieval and relationship history over immediate pipeline movement.

### 5.5 Anti-personas for MVP

- Large sales teams requiring territory, pipeline, permissions and compliance administration.
- Consumers managing primarily friends and family.
- Users who only need a static QR business card.
- Event organizers seeking attendee registration and badge infrastructure.

## 6. Market and competitive context

### 6.1 Category evidence

Published estimates vary significantly because some reports include NFC products, enterprise card management or adjacent services. Directionally:

- Mordor Intelligence estimates the digital business card category at about **USD 199 million in 2025**, growing to about **USD 332 million by 2031** ([source](https://www.mordorintelligence.com/industry-reports/digital-business-card-market)).
- 6Wresearch estimates approximately **USD 0.2 billion in 2025** and more than **USD 1.1 billion by 2032**, a materially higher growth forecast ([source](https://www.6wresearch.com/market-takeaways-view/how-big-is-the-digital-business-card-market)).
- LinkedIn reported more than **1.3 billion professionals** across more than 200 countries and territories in 2026. This is a broad indicator of the professional identity/networking population, not Duit's addressable market by itself ([source](https://news.linkedin.com/2026/linkedin-reaches-the-milestone-of-100-million-users-in-brazil)).

Conclusion: a real paid category exists, but top-down reports are too definition-sensitive to drive the plan alone. Duit also overlaps personal CRM and event lead capture, so its eventual opportunity could be broader than digital-card revenue if the follow-up loop is differentiated.

### 6.2 Competitive landscape

| Product/category | Strongest job | Current evidence | Gap Duit can target |
| --- | --- | --- | --- |
| Blinq | Digital cards, universal scanning, enrichment and team lead capture | Premium includes scanner, AI notetaker and enrichment; business includes CRM integration and event attribution ([source](https://blinq.me/pricing)) | A calmer individual workflow centered on encounter memory and follow-through rather than card branding/team administration |
| HiHello | Polished card sharing and enterprise identity management | Free and paid individual cards, scanning, analytics, team templates and directory sync ([source](https://www.hihello.com/pricing)) | Richer private meeting context and a relationship timeline |
| Popl | Event lead capture and CRM-connected team workflows | Positions around event capture, lead management and CRM integrations ([source](https://popl.co/pages/pricing)) | Individual-owned relationships that are not yet formal sales leads |
| CamCard | Fast multilingual card OCR and contact capture | Captures from paper cards, QR codes, signatures and imports ([source](https://www.camcard.com/?lang=en)) | Capture plus meaning, encounter context and follow-up behavior |
| Dex | Personal relationship management | Keep-in-touch reminders, notes and unified timeline ([source](https://getdex.com/product/)) | Mobile-first capture at the physical meeting and digital-card exchange |
| HubSpot and traditional CRM | Structured customer data, pipeline and team automation | Free contact/deal/task management with paid sales functionality ([source](https://www.hubspot.com/products/crm)) | Lightweight pre-CRM relationships and dramatically lower entry effort |
| LinkedIn / phone contacts / notes | Existing identity, communication and storage habits | Ubiquitous substitutes with no additional subscription | A purpose-built synthesis of person, encounter and next action |

### 6.3 Strategic interpretation

Digital-card features are becoming table stakes. Blinq and HiHello already offer strong free sharing products, while scanning and AI enrichment are moving into paid tiers. Competing on card aesthetics, NFC or QR generation alone is unlikely to create durable differentiation.

Duit's proposed defensible workflow is:

1. Capture the person through whichever mechanism is available.
2. Capture a tiny amount of situational context.
3. Convert it into a trustworthy relationship memory.
4. Make the next action easy to complete.
5. Accumulate a private, useful encounter history over time.

The moat, if one develops, would come from habitual use, longitudinal relationship context, personalized follow-up quality and interoperability - not from QR technology.

## 7. TAM, SAM and SOM

### 7.1 Methodology

Both top-down and bottom-up views are retained. The model should be revised after pricing interviews, retention data and a geographic launch decision.

### 7.2 Top-down category TAM

The narrow digital-business-card software market is approximately **USD 200-230 million annually in 2025** across multiple reports. Treat this as evidence of existing spend, not as the full market for relationship memory.

### 7.3 Bottom-up opportunity envelope

Planning assumptions, not external facts:

- Broad professional network population: 1.3 billion LinkedIn members.
- High-frequency networking subset: assume 5-8%.
- Potential relevant users: approximately 65-104 million.
- Mature blended annual revenue per paid user: assume USD 48-72.

This produces a theoretical global opportunity envelope of roughly **USD 3.1-7.5 billion annually**. It is intentionally broad and includes users who will never pay, regions Duit may not serve, and spend currently captured by adjacent categories. It must not be presented externally as a validated market size.

### 7.4 Initial SAM hypothesis

**Hypothesis:** 5 million reachable, mobile-first, English-speaking network-driven professionals across the selected India/Southeast Asia beachhead at a localized annual paid value of USD 36-48.

Planning SAM: **USD 180-240 million annually.**

This figure requires validation through:

- Geographic professional and event-participation data.
- Segment-specific willingness-to-pay interviews.
- Acquisition-channel reach and cost.
- Conversion and retention from an actual free product.

### 7.5 Three-year SOM target scenario

An execution target rather than a market claim:

- 100,000 registered users.
- 30,000 monthly active users.
- 5,000 paid individual users.
- USD 48 blended annual revenue per paid user.
- Approximately **USD 240,000 individual-subscription ARR**, excluding team revenue.

The strategic objective of the first year is retention proof, not revenue scale. A smaller base with repeated capture and follow-up behavior is more valuable than a large base of one-time QR-card creators.

## 8. Product goals and non-goals

### 8.1 MVP goals

1. Enable a new user to create and share one credible digital card.
2. Enable capture of a real person and encounter in under 45 seconds after initial setup.
3. Produce an editable, trustworthy summary and next-step suggestion.
4. Help the user complete a follow-up through an existing communication app.
5. Preserve a searchable timeline across repeated encounters with the same person.
6. Validate that users return because of relationship memory and follow-up, not only card sharing.

### 8.2 Non-goals for MVP

- Full sales CRM, deals, pipelines, forecasting or email campaigns.
- Social feed, public posting, followers or connection requests.
- Enterprise directory provisioning, SSO or brand administration.
- Event registration, badge printing or attendee management.
- Automated relationship scoring presented as objective truth.
- Multiple personal card personas.
- Nearby-contact discovery or background location tracking.
- Natural-language search across every field.
- Fully automated outreach without user confirmation.

## 9. MVP experience and information architecture

### 9.1 Recommended primary navigation

| Area | Purpose |
| --- | --- |
| Today | Due follow-ups, recent encounters and the primary capture action |
| People | Searchable people list and relationship history |
| Capture | Camera/manual capture entry point; may be a central action rather than a tab |
| My Card | View, edit and share the user's public card |
| Settings | Account, privacy, export and notification controls |

The current standalone Meetings tab should become a timeline within a person and an optional global activity view later. The current LinkedIn-style Profile and Share screens should converge into **My Card** for MVP.

### 9.2 Core loop

1. User creates an account and one personal card.
2. User shares their card or captures someone they met.
3. Duit creates or matches a person.
4. User records minimal encounter context.
5. Duit suggests structured fields, summary, tags and a next step.
6. User reviews and saves.
7. Duit surfaces the follow-up at the appropriate time.
8. User acts through WhatsApp, email or phone and marks it complete.
9. Future encounters append to the same relationship timeline.

## 10. Use cases

### UC-01 - Onboard and create my card

**Actor:** New user  
**Trigger:** First app launch  
**Precondition:** None

**Main flow:**

1. User enters name, role, company and optional website.
2. User creates an account.
3. Duit creates an editable personal card and unique public slug.
4. User previews the public result.
5. User can share immediately.

**Success outcome:** A shareable card exists within three minutes.  
**Exceptions:** User may defer optional profile fields; slug collision requires alternatives.

### UC-02 - Share my card in person

**Actor:** Authenticated user  
**Trigger:** Another person asks for contact details

**Main flow:**

1. User opens My Card through a persistent shortcut.
2. App displays a real QR code and native share action.
3. Recipient opens the public card without installing Duit.
4. Recipient can save a vCard or share their details back.
5. If the recipient shares details back, Duit offers to create an encounter.

**Success outcome:** The recipient receives usable contact details in under 15 seconds.

### UC-03 - Capture a paper business card

**Actor:** Authenticated user  
**Trigger:** User receives a paper card

**Main flow:**

1. User photographs the card.
2. Duit extracts name, company, title, email, phone and website.
3. Duit checks for a likely existing person.
4. User corrects any uncertain fields.
5. User continues to encounter context.

**Success outcome:** A reliable draft contact is created without retyping the full card.  
**Fallback:** Manual entry is always available if scanning fails.

### UC-04 - Record encounter context quickly

**Actor:** Authenticated user  
**Trigger:** Contact details have been captured or entered

**Main flow:**

1. Date and approximate location default automatically with permission.
2. User optionally selects event or encounter type.
3. User records one short text or voice note about the conversation.
4. User optionally states a promised or desired next action.
5. Duit generates an editable summary and follow-up suggestion.
6. User confirms and saves.

**Success outcome:** Person and encounter are safely saved in under 45 seconds.  
**Privacy:** Location must be optional and transparent.

### UC-05 - Review AI suggestions

**Actor:** Authenticated user  
**Trigger:** OCR or encounter processing completes

**Main flow:**

1. App visually distinguishes extracted facts from generated suggestions.
2. Low-confidence OCR fields are highlighted.
3. User edits or accepts summary, tags and next step.
4. Original user note remains accessible.
5. User saves the reviewed record.

**Success outcome:** User understands what came from them versus AI and retains control.

### UC-06 - Complete a follow-up

**Actor:** Authenticated user  
**Trigger:** Follow-up is due or user opens a person

**Main flow:**

1. Duit surfaces the due action.
2. User opens WhatsApp, email or phone with the relevant recipient selected.
3. Duit may suggest message copy, but never sends automatically in MVP.
4. User returns and marks the action complete or snoozes it.
5. Completion appears in the relationship timeline.

**Success outcome:** A real follow-up is completed and recorded.

### UC-07 - Remember someone later

**Actor:** Returning user  
**Trigger:** User wants to find a person or prepare for a meeting

**Main flow:**

1. User searches by name, company, event or note text.
2. User opens the person.
3. Duit shows identity, previous encounters, notes and follow-ups chronologically.
4. User initiates a new follow-up or adds another encounter.

**Success outcome:** The user reconstructs the relationship without searching multiple apps.

### UC-08 - Meet the same person again

**Actor:** Returning user  
**Trigger:** New capture appears to match an existing person

**Main flow:**

1. Duit suggests a possible duplicate using email, phone and name/company similarity.
2. User confirms the match or creates a separate person.
3. A new encounter is appended without overwriting previous context.
4. Follow-up suggestions consider the history.

**Success outcome:** One person has a coherent multi-encounter timeline.

### UC-09 - Control and export my data

**Actor:** Authenticated user  
**Trigger:** User opens privacy/settings

**Main flow:**

1. User reviews permissions and AI-processing disclosures.
2. User exports people and encounters in a portable format.
3. User can delete a person, uploaded card image or their entire account.

**Success outcome:** The user retains meaningful control over personal and third-party data.

## 11. Functional requirements

### 11.1 Identity and authentication

- **FR-AUTH-01:** User can sign up, log in, log out and restore an authenticated session.
- **FR-AUTH-02:** Email verification and password reset are required before public launch.
- **FR-AUTH-03:** Onboarding data must populate the user's editable profile/card instead of creating a disconnected object.
- **FR-AUTH-04:** Skipping signup may remain available in internal builds, but production data sync requires an account.

### 11.2 My Card and public sharing

- **FR-CARD-01:** MVP supports one card per user.
- **FR-CARD-02:** User can edit name, role, company, photo, contact methods, links and slug.
- **FR-CARD-03:** App generates a scannable QR code for the HTTPS public URL.
- **FR-CARD-04:** Public card works without login or app installation.
- **FR-CARD-05:** Viewer can download a standards-compatible vCard.
- **FR-CARD-06:** App supports the native share sheet; WhatsApp is an additional channel.
- **FR-CARD-07:** User controls which fields are public.

### 11.3 People and capture

- **FR-PEOPLE-01:** User can create a person manually.
- **FR-PEOPLE-02:** User can capture the front of a business card; back-side capture may be added if research shows demand.
- **FR-PEOPLE-03:** OCR output is always reviewed before becoming canonical data.
- **FR-PEOPLE-04:** User can edit and delete people.
- **FR-PEOPLE-05:** System detects likely duplicates and asks the user rather than merging silently.
- **FR-PEOPLE-06:** User can search by name, company, title, event and note text.

### 11.4 Encounters

- **FR-ENC-01:** Every capture can create an encounter linked to one person.
- **FR-ENC-02:** Encounter stores occurred-at time, optional place/event, type, original note and optional card image.
- **FR-ENC-03:** A person may have many encounters.
- **FR-ENC-04:** User can add, edit and delete an encounter independently of the person.
- **FR-ENC-05:** App displays encounters in chronological order.

### 11.5 AI assistance

- **FR-AI-01:** AI may suggest a concise summary, relevance statement, tags and next action from user-provided context.
- **FR-AI-02:** Generated content remains editable and is labeled during review.
- **FR-AI-03:** The system must not infer sensitive traits or unsupported personal claims.
- **FR-AI-04:** Failure must not prevent manual capture and save.
- **FR-AI-05:** User can regenerate, dismiss or save without AI suggestions.
- **FR-AI-06:** Model/provider version and provenance are recorded for generated content.

### 11.6 Follow-ups

- **FR-FU-01:** User can create a follow-up with action, due time and optional channel.
- **FR-FU-02:** User can complete, edit, snooze or delete it.
- **FR-FU-03:** Due follow-ups appear in Today and may trigger an opt-in local notification.
- **FR-FU-04:** App can open WhatsApp, email or phone, but does not send automatically in MVP.
- **FR-FU-05:** Follow-up completion is recorded in the relationship timeline.

### 11.7 Offline and synchronization

- **FR-SYNC-01:** Recently used people and unsent captures remain available offline.
- **FR-SYNC-02:** A capture made offline queues for synchronization.
- **FR-SYNC-03:** User-visible status distinguishes saved locally, syncing and failed.
- **FR-SYNC-04:** Server becomes source of truth after authentication; local storage is a cache and offline queue.

## 12. Domain model decision

The existing prototype's `Connection` type conflates a person with one encounter. The MVP should use the following conceptual model:

```text
User 1 ---- 1 Profile
User 1 ---- 1 UserCard (MVP)
User 1 ---- * Person
Person 1 -- * Encounter
Person 1 -- * FollowUp
Encounter 1 - 0..* FollowUp
```

Definitions:

- **Person:** stable identity and private contact fields belonging to the user's address book.
- **Encounter:** a time-bound interaction with that person.
- **FollowUp:** an actionable commitment associated with the person and optionally an encounter.
- **UserCard:** the user's intentionally public, shareable identity.
- **Profile:** private account preferences and defaults; it may supply UserCard fields but should not be treated as identical to public data.

This is a product decision with architectural consequences and should be settled before backend CRUD is implemented.

## 13. UX requirements

### 13.1 Capture speed budget

- Camera available within one tap from the primary screen.
- Photograph-to-review target: under 5 seconds on a typical supported connection.
- Minimum required user input after OCR: zero fields if the extraction is correct, plus one optional context note.
- End-to-end save target after opening capture: median under 45 seconds.
- Manual fallback must be obvious and usable offline.

### 13.2 Home/Today design

Priority order:

1. Primary capture action.
2. Follow-ups due or overdue.
3. Recent encounters.
4. Search.
5. Secondary organization controls.

The current prototype's advanced filters and primary/less-important/hidden buckets should not dominate MVP Home. They can return after observed datasets justify them.

### 13.3 Empty states

- First-run empty state should lead directly to sharing My Card or capturing the first person.
- No-follow-up state should show recent people, not generic instructional copy.
- OCR failure should preserve the image and offer manual correction.
- AI failure should preserve entered data and allow save.

### 13.4 Accessibility and international readiness

- Controls require accessible names, states and minimum touch targets.
- Text must support dynamic sizing without truncating identity/contact data.
- Phone numbers retain country code and original formatting.
- Time and dates use user locale/timezone.
- Data model must support Unicode names, multilingual cards and multiple address conventions even if MVP UI is English.

## 14. Trust, privacy and safety

Duit stores personal data about both users and third parties. This is a core product requirement, not a later compliance task.

- Encrypt data in transit and at rest.
- Keep encounter notes, card images and relationship insights private by default.
- Separate public UserCard fields from private profile and relationship data.
- Obtain clear permission before location, contacts, camera, microphone or notifications.
- Explain whether images and notes are sent to third-party AI/OCR providers.
- Define retention and deletion behavior for source images and model inputs.
- Support account deletion and practical data export.
- Do not use third-party contact data to train models without explicit, legally valid consent.
- Do not auto-send messages or represent generated relationship claims as facts.
- Add abuse controls to public card/contact exchange endpoints.

Before public beta, complete a privacy review covering applicable Indian data-protection obligations and other launch geographies.

## 15. Success metrics

### 15.1 North-star metric

**Weekly meaningful relationship actions:** unique encounters saved plus follow-ups completed, with anti-gaming rules to exclude duplicate/test records.

This combines memory creation and action without rewarding passive card views alone.

### 15.2 Activation funnel

| Event | Initial target |
| --- | --- |
| Signup started -> account created | >= 70% |
| Account created -> My Card published | >= 65% |
| Account created -> first real person saved within 24 hours | >= 35% |
| First person saved -> context note or follow-up added | >= 50% |
| First follow-up due -> completed within 72 hours | >= 30% |

Targets are hypotheses for a closed beta and should be recalibrated after the first 50-100 users.

### 15.3 Retention and value metrics

- Week-1 and week-4 retention segmented by users who saved a real encounter.
- Encounters saved per weekly active user.
- Percentage of captures completed in under 45 seconds.
- Follow-ups created and completed per active user.
- Percentage of users who retrieve a person after seven or more days.
- Duplicate rate and successful duplicate resolution.
- AI suggestion acceptance, edit distance and dismissal rate.

### 15.4 Guardrail metrics

- OCR critical-field correction rate.
- AI suggestions reported as wrong, inappropriate or fabricated.
- Capture/sync failure rate.
- Notification opt-out and uninstall signals.
- Public-card abuse reports.
- Account/data deletion completion time.

## 16. Monetization hypothesis

### 16.1 Recommended initial model

Freemium individual product with a later team/export/integration tier.

**Free hypothesis:**

- One public card.
- Unlimited sharing.
- Limited monthly scans/AI-assisted captures.
- Manual contacts and basic follow-ups.

**Pro hypothesis:**

- Higher or unlimited capture allowance under fair-use limits.
- Advanced AI summaries and pre-meeting briefs.
- Unlimited history, export and richer customization.
- Calendar/contact integrations.

**Team later:**

- Shared templates, lead routing, CRM sync, event campaigns, admin and security.

Competitor individual pricing currently clusters around USD 6-10 per month: HiHello Professional lists USD 6 per month annually, while Blinq Premium lists USD 9.99 monthly. Duit should test localized willingness to pay rather than simply matching US pricing.

### 16.2 Pricing experiment range

- India/SEA annual Pro test: equivalent of USD 24, USD 36 and USD 48 per year.
- Do not introduce payment before users demonstrate repeated capture and follow-up value.
- Avoid charging merely to export a user's own basic contact data; this would conflict with the interoperability principle.

## 17. Go-to-market hypothesis

### 17.1 Initial motion

Founder-led, event-centered acquisition:

- Recruit 20-30 design partners who attend professional events regularly.
- Onboard users immediately before an event.
- Observe capture behavior during or directly after the event.
- Conduct follow-up interviews 24 hours and seven days later.
- Use public card pages as a lightweight acquisition loop, without forcing recipients to install the app.

### 17.2 Candidate channels

- Founder, startup and consultant communities.
- Coworking spaces, accelerators and conference side events.
- LinkedIn content demonstrating post-event follow-up workflows.
- Partnerships with small event organizers after individual retention is proven.
- App-store discovery for business-card scanning only after OCR quality is competitive.

### 17.3 Growth loop hypothesis

```text
User shares Duit card
  -> recipient opens useful public card
  -> recipient shares details back or creates own card
  -> both users can preserve encounter context
  -> more future sharing
```

This loop must remain optional and useful to non-users; forced signup would damage the exchange moment.

## 18. MVP release strategy

### Phase 0 - Product discovery

- Interview at least 15 target users across the primary persona.
- Observe current post-event workflows instead of asking only for feature preferences.
- Test capture concepts with the existing mobile prototype.
- Validate whether reminders, OCR or sharing creates the strongest pull.
- Finalize launch geography and pricing assumptions.

**Exit criterion:** At least 8 interviewees report the problem occurring monthly, and at least 5 agree to test the product with real contacts at an upcoming event.

### Phase 1 - Internal vertical slice

- Authentication and unified profile.
- One editable UserCard, public page and real QR.
- Manual person + encounter capture.
- Editable AI summary and follow-up.
- Today and person timeline.
- Basic offline/error handling.

**Exit criterion:** Team can complete the core loop using real data without database intervention.

### Phase 2 - Closed beta

- Business-card image capture and OCR review.
- Notifications and follow-up completion.
- Duplicate detection.
- Privacy controls, export and deletion.
- Product analytics and operational monitoring.

**Exit criterion:** 50 beta users, at least 20 activated through a real encounter, acceptable trust/error metrics, and evidence of week-4 return among activated users.

### Phase 3 - Public MVP

- Resolve high-severity beta findings.
- App-store readiness, account recovery and support path.
- Published privacy policy and terms.
- Basic subscription experiment only if retention warrants it.

## 19. Risks and mitigations

| Risk | Why it matters | Mitigation/test |
| --- | --- | --- |
| QR-card commoditization | Strong free incumbents already solve sharing | Position and measure around encounter memory and follow-up |
| Capture is too slow | Users will defer entry and lose context | 45-second budget, defaults, voice note and manual fallback |
| OCR errors destroy trust | Incorrect identity data is costly | Confidence indicators, review step, retain source image temporarily |
| AI fabricates relevance | Relationship advice may feel invasive or wrong | Ground only in provided context, label suggestions, never auto-send |
| Reminder fatigue | Notifications can create guilt and churn | Opt-in, low default frequency, snooze, user-controlled cadence |
| Cold-start value | No data means empty feeds and no reminders | My Card plus immediate first-capture onboarding |
| Existing habits win | LinkedIn, contacts and notes are already available | Integrate/export and focus on the missing context-to-action workflow |
| Privacy concerns | App stores third-party PII and private notes | Clear separation, minimization, deletion and provider disclosure |
| Scope expands into CRM | Team requests can overwhelm individual experience | Explicit anti-personas and staged team roadmap |
| Weak monetization | Individuals may expect cards and contacts to be free | Charge for repeated intelligence/workflow value, validate before paywall |

## 20. Open product decisions

These decisions should be resolved collaboratively before implementation scope is locked.

| ID | Decision | Current recommendation | Consequence |
| --- | --- | --- | --- |
| PD-01 | Primary beachhead persona | Network-driven founders, consultants and BD professionals | Determines onboarding language, events and acquisition |
| PD-02 | Initial geography | India first with selected Southeast Asia design partners | Determines pricing, privacy review and phone/address behavior |
| PD-03 | Is OCR required in first internal slice? | Manual capture first; OCR required for closed beta | Enables learning before taking on OCR quality risk |
| PD-04 | Are follow-ups core MVP? | Yes | Required to prove value beyond storage |
| PD-05 | Person vs encounter model | Separate entities | Enables repeat meetings and real relationship history |
| PD-06 | One or many personal cards? | One in MVP | Keeps My Card understandable and reduces editor scope |
| PD-07 | Profile and My Card relationship | Private profile supplies fields to separately controlled public card | Prevents accidental disclosure |
| PD-08 | Home structure | Today + People; remove standalone Meetings tab for MVP | Focuses navigation on action and retrieval |
| PD-09 | Voice capture | Prototype early; include only if it materially improves speed | Affects permissions, transcription cost and privacy |
| PD-10 | AI provider/data policy | Decide after privacy and cost comparison | Affects architecture, disclosure and unit economics |
| PD-11 | Recipient exchange flow | Public "share details back" form without required signup | Improves reciprocity and acquisition |
| PD-12 | Existing architecture DOCX | Reconcile and regenerate after this PRD is approved | Avoids documenting an obsolete domain model |

## 21. Discovery questions

Use these in interviews; do not begin by showing the proposed solution.

1. Tell me about the last professional event or meeting where you met several new people.
2. What did you do with their contact information immediately afterward?
3. How did you remember what you discussed and what you promised?
4. Show me where those contacts and notes live now.
5. When was the last time you failed to follow up or could not remember someone?
6. Which relationships belong in your company CRM, and which do not?
7. What would make you uncomfortable about photographing a card or recording a meeting note?
8. How quickly would capture need to be for you to do it at the event?
9. Which follow-up channels do you actually use: WhatsApp, email, LinkedIn, phone or something else?
10. Have you paid for a digital card, scanner or personal CRM? Why or why not?

Behavioral prototype tasks:

- Ask the user to capture a real card while standing, with distractions.
- Ask them to find someone met two months earlier.
- Present an AI summary containing one subtle error and observe whether they detect it.
- Test QR share, native share and reciprocal detail exchange.
- Ask the user to act on one real follow-up and observe the transition between apps.

## 22. Requirements traceability to current prototype

| Current prototype area | MVP treatment |
| --- | --- |
| Onboarding wizard | Retain the concise profile collection; remove decorative AI steps unless they improve activation |
| Signup screen | Connect to production auth and account recovery |
| My Cards strip | Reduce to one card and make Manage/Share functional |
| Connection feed | Refocus into recent encounters and due follow-ups |
| Advanced filters | Later, except basic search |
| Connection detail | Split stable person data from encounter timeline; add edit and follow-up actions |
| Meetings tab | Fold into person timelines/global activity later |
| Share screen | Real QR, public page, native share and reciprocal contact exchange |
| LinkedIn-style Profile | Merge useful fields into My Card/settings; defer profile-section imitation |
| Primary/less-important/hidden | Later unless discovery validates strong demand |
| Static AI narrative fields | Generate from real user context, review before save |

## 23. Definition of MVP success

The MVP is successful when evidence supports all of the following:

1. Users repeatedly capture real encounters, not only create a card once.
2. The median capture can be completed within 45 seconds.
3. Users trust and retain the organized context after reviewing it.
4. Follow-up completion occurs often enough to demonstrate behavioral value.
5. Activated users return after the initial event or meeting.
6. The product can explain its value without calling itself a smaller LinkedIn or CRM.

The MVP is not successful merely because the app builds, the QR code is scanned, contacts are imported, or users compliment the interface.

## 24. Immediate next steps

1. Review and decide PD-01 through PD-09 with the product owner.
2. Conduct five initial discovery interviews before locking the capture UI.
3. Update this document to version 0.2 with decisions and interview evidence.
4. Reconcile `backend-requirements.md` and the architecture document to the Person/Encounter/FollowUp model.
5. Turn the approved MVP into a prioritized release backlog.
6. Begin implementation with one end-to-end vertical slice only after the product review is complete.

## Appendix A - Assumption register

| ID | Assumption | Confidence | Validation |
| --- | --- | --- | --- |
| A-01 | The context-loss problem occurs at least monthly for the beachhead user | Medium | Interviews + diary study |
| A-02 | A user will capture context within 45 seconds after meeting | Low | Event observation |
| A-03 | Follow-up produces more retention than card customization | Medium | Cohort behavior and prototype tests |
| A-04 | Manual capture is sufficient for an internal slice | High | Team usage |
| A-05 | OCR is required for competitive public beta | Medium | Interviews and task tests |
| A-06 | Users will trust AI suggestions after review | Low | Error-injection usability test |
| A-07 | India/SEA users will pay USD 24-48 annually for repeated value | Low | Pricing interviews and later paywall test |
| A-08 | A recipient will share details back through a public form | Low | Public-page prototype experiment |
| A-09 | One personal card is enough for initial adoption | Medium | Interviews and usage requests |

## Appendix B - Source notes

- Competitive features and prices were checked on vendor websites on 2026-08-04 and will change.
- Market estimates are included as directional references because research firms define the category differently.
- Product recommendations derive from the current mobile prototype and `docs/backend-requirements.md`; they are not proof of user demand.
