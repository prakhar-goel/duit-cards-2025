# Duit Cards — Product Requirements Document

| Field | Value |
| --- | --- |
| Status | Draft for product review |
| Version | 0.2 |
| Last updated | 2026-08-06 |
| Stage | Pre-MVP prototype |
| Product owner | Prakhar Goel |
| Source of truth | This document for product intent; `PRODUCT_INPUT_LOG.md` for verbatim user input |

## 1. Product thesis

Duit makes a professional introduction memorable and actionable.

It serves both sides of a business-card exchange:

1. **Present:** help a person or company explain why they matter through a short, AI-crafted pitch that earns attention and invites action.
2. **Remember:** help the recipient preserve the person, encounter and context, then resurface the relationship when it becomes relevant.

Duit is the platform that creates and carries the pitch. The subject is always the user, their company, product or service—not Duit—unless Duit itself is the card owner.

Duit is not a static digital-card designer, a public social network or a traditional sales CRM. Its wedge is the full introduction loop: **present → capture intent → remember → resurface → act**.

## 2. Vision, promise and positioning

### Vision

Make every valuable professional introduction easy to understand, remember and act on.

### Product promise

> Be remembered. Be understood. Be contacted.

### Positioning

For India-based founders and partnership leaders who build business through events and introductions, Duit turns their business card into an engaging, actionable pitch—and turns each new contact into a trusted relationship memory that resurfaces when either side has a relevant need or offer.

### Product principles

1. **Structure attention.** Do not summarize a website. Find the most relevant hook, establish value, then present a clear action.
2. **The owner is the subject.** Pitch copy describes the person or company whose card is being viewed. Duit remains the enabling platform.
3. **Earn the next five seconds.** A recipient should understand why to continue before being asked to read more.
4. **Lead with relevance, not biography.** Contact details support the pitch; they are not the pitch.
5. **Make intent easy to express.** Every pitch should end in one appropriate, low-friction action.
6. **Remember the encounter, not only the contact.** Preserve when, where, why and what was discussed.
7. **AI proposes; people approve.** Facts, inferences and suggestions must remain distinguishable and editable.
8. **Private by default.** Relationship context is private; only owner-approved card content is public.
9. **Useful without network effects.** A recipient needs no Duit account to view a pitch or respond.

## 3. The problem

### When I share my card

A conventional card answers “who are you?” but rarely answers “why should I remember or contact you?” Websites demand too much time. Generic AI summaries produce empty claims. The recipient may have genuine interest but no immediate, suitable way to express it.

### When I receive a card

A name and number quickly lose their meaning. Context becomes fragmented across paper cards, phone contacts, LinkedIn, WhatsApp and notes. Months later, I cannot reliably find the person when I need their service, can help them or have something relevant to offer.

### Jobs to be done

- When I share my card, help the recipient quickly understand and remember why I am relevant.
- When interest exists, let the recipient take the next step immediately.
- When I meet someone, preserve enough context to remember the relationship later.
- When I have a current need or offer, show me who in my network is relevant now.
- After a conversation, turn my short note into a trusted memory and a ready-to-send follow-up in the channel I use.

## 4. Target user

### Beachhead

India-based founders and partnership leaders who:

- attend at least two ecosystem events per month;
- meet at least ten new professional contacts monthly; and
- personally follow up through WhatsApp or LinkedIn.

This is a behavioral segment, not a permanent geographic limit.

### Secondary users

- Consultants and agency owners who sell through trust and referrals.
- Ecosystem professionals whose contacts may become relevant months later.
- Event-based sellers who need lightweight pre-CRM capture.

### Not for MVP

- Large sales teams needing territories, pipelines and administration.
- Event organizers needing registration, badges or attendee systems.
- Users seeking only a static QR card.
- Consumer social-contact management.

## 5. Product model

### Loop A — Present and capture intent

1. The owner supplies identity, offer, audience, proof, links and desired action.
2. Duit drafts a short pitch sequence.
3. The owner verifies claims and publishes.
4. A recipient opens it without installing an app.
5. The opening hook earns attention; the next panels explain the offer.
6. The recipient acts through a CTA or shares their details.
7. The owner receives a lead with source and intent.

### Loop B — Remember and act

1. The user saves a person by Duit exchange, scan or manual entry.
2. The user adds a short post-conversation text or voice note.
3. Duit extracts facts, commitments and a suggested next action.
4. The user confirms the result.
5. The private feed resurfaces relevant people, promises and opportunities.
6. The user follows up through WhatsApp, LinkedIn, email or phone.
7. The outcome enriches the relationship memory.

### Smart-feed question

> Who in my network is relevant to something I need or can offer right now?

The feed is not a public content stream. It is a private, explainable action layer over the user's professional relationships.

## 6. The AI pitch

### Required structure

A pitch is a quickly browsable sequence, typically five or six panels:

1. **Hook:** a specific tension, question or insight.
2. **Relevance:** who has this problem and why it matters.
3. **Offer:** what the card owner or company does.
4. **Outcome:** what changes for the customer or partner.
5. **Proof:** evidence, credibility or differentiation.
6. **CTA:** one clear next step.

The sequence may later be rendered as motion or video. The MVP should prove the narrative and interaction before investing in automated video generation.

### Example

Weak website summary:

> “XYZ is a technology company offering innovative solutions.”

Structured pitch:

> “Your sales team met 200 people this quarter. How many valuable promises were forgotten?”

Then:

> “XYZ turns each encounter into a relationship memory and actionable follow-up.”

The first line earns attention. The second explains XYZ. Duit creates and presents the sequence; it does not insert itself as the subject.

### Generation rules

- Ground claims in owner-provided or approved source material.
- Ask for missing proof instead of inventing it.
- Prefer specific language over adjectives such as “innovative” or “leading.”
- Generate alternative hooks for owner selection.
- Keep every panel scannable on a phone.
- Allow editing, reordering and regeneration at panel level.
- Record which content is supplied, extracted or AI-suggested.
- Require approval before publishing or materially changing a live pitch.

## 7. MVP scope

### Must have

**Pitch and card**

- One published card per user or company.
- Guided input for audience, problem, offer, proof and desired action.
- AI-generated, owner-editable pitch panels.
- Contact details, image, links and public slug.
- QR code, native sharing and Apple/Google Wallet access.
- App-free, fast public viewing.

**Intent and leads**

- Configurable primary CTA: WhatsApp, call, email, book, enquire or share requirement.
- Optional lead form with consent and an intent field.
- Lead inbox with card, CTA and campaign/source attribution.
- Notifications for new leads.

**Relationship memory**

- Save from a Duit exchange, card scan or manual entry.
- Short text or voice encounter note.
- Person, encounter, commitments and follow-up history.
- Search by person, company, event, need, offer, tag or note.
- Editable AI recap and grounded follow-up draft.

**Private smart feed**

- Due promises and follow-ups.
- New leads and card engagement worth acting on.
- People relevant to a current need or offer.
- Explainable reason for every recommendation.
- Dismiss, snooze, act and provide feedback.

### Later

- Multiple card personas and advanced brand templates.
- Automated video generation.
- Public posts, followers and creator feed.
- Autonomous outreach.
- Team lead routing and full CRM administration.
- Broad communication-history ingestion.
- Opaque relationship scores.
- NFC hardware and event infrastructure.

## 8. Information architecture

| Area | Purpose |
| --- | --- |
| Feed | Leads, promises, relevant relationships and suggested actions |
| People | Search and relationship history |
| Capture | Scan, exchange or record a post-conversation note |
| My Card | Create, preview, share and measure the public pitch |
| Leads | Review intent, respond and record outcomes |

Settings covers account, privacy, export, notifications and integrations. The home screen should prioritize what deserves attention; it should not merely display the user's own card.

## 9. Functional requirements

### Pitch and public experience

- **FR-PITCH-01:** Create a pitch from structured owner input and optional website/source material.
- **FR-PITCH-02:** Generate hook, relevance, offer, outcome, proof and CTA panels.
- **FR-PITCH-03:** Let the owner edit, reorder, regenerate and approve each panel.
- **FR-PITCH-04:** Never publish an unapproved factual claim.
- **FR-PITCH-05:** Show the public pitch without login or app installation.
- **FR-PITCH-06:** Provide vCard, QR, native share, Apple Wallet and Google Wallet options.
- **FR-PITCH-07:** Load the hook quickly on a typical mobile connection and reveal detail progressively.

### CTA and leads

- **FR-LEAD-01:** Configure one primary CTA and optional secondary contact actions.
- **FR-LEAD-02:** Capture only the details needed for the selected action.
- **FR-LEAD-03:** Store explicit consent, source, card version and CTA context.
- **FR-LEAD-04:** Notify the owner and place the lead in an actionable inbox.
- **FR-LEAD-05:** Track viewed, CTA opened, lead submitted, responded and qualified events without claiming unverifiable outcomes.

### People and encounters

- **FR-REL-01:** Create or match a person from exchange, scan or manual entry.
- **FR-REL-02:** Capture a text or voice note in under 45 seconds.
- **FR-REL-03:** Preserve the original note alongside AI output.
- **FR-REL-04:** Extract a factual recap, explicit commitments and a proposed follow-up.
- **FR-REL-05:** Append repeated meetings to one person without overwriting history.
- **FR-REL-06:** Search by identity and relationship context.

### Feed and action

- **FR-FEED-01:** Surface leads, commitments, due follow-ups and relevant people.
- **FR-FEED-02:** Explain why each item appears and identify its supporting evidence.
- **FR-FEED-03:** Let the user declare a current need or offer.
- **FR-FEED-04:** Match that intent against approved profile, pitch and private relationship data.
- **FR-FEED-05:** Let the user act, dismiss, snooze or correct a recommendation.
- **FR-FEED-06:** Open an editable follow-up in WhatsApp, LinkedIn, email or phone; never send automatically in MVP.

### Data control

- **FR-DATA-01:** Separate public card data from private relationship data.
- **FR-DATA-02:** Make location optional and purpose-specific.
- **FR-DATA-03:** Support export and deletion of people, media and the account.
- **FR-DATA-04:** Queue core capture offline and synchronize safely.
- **FR-DATA-05:** Encrypt sensitive data in transit and at rest.

## 10. Domain model

- **Account:** authentication and ownership.
- **Profile:** private source data supplied by the owner.
- **Card:** published identity, theme, slug and version.
- **PitchPanel:** ordered hook, explanation, proof or CTA content.
- **CTA:** configured action and destination.
- **Lead:** recipient-submitted identity, intent, consent and source.
- **Person:** one external professional identity.
- **Encounter:** time-bound meeting context and original note.
- **Commitment:** an explicit promise made by either party.
- **FollowUp:** proposed or confirmed next action.
- **NeedOffer:** a current need or offer declared by the user.
- **FeedItem:** an explainable prompt backed by one or more records.
- **Activity:** append-only audit of important actions and outcomes.

`Person`, `Encounter`, `Commitment` and `FollowUp` remain separate. A contact is not a meeting, and a suggestion is not a fact.

## 11. Experience and trust requirements

- The public hook must fit on the first mobile viewport.
- A recipient should understand the card owner's relevance within five seconds.
- One dominant CTA per pitch; no wall of equal buttons.
- Contact details remain accessible without interrupting the pitch.
- AI suggestions are visibly labelled and reversible.
- Recommendations state “why now” in plain language.
- Empty feeds lead to a useful action: share a card, capture a person or state a need/offer.
- Card owners can preview exactly what is public.
- Third-party encounter data never appears on a public card.
- Accessibility target: WCAG 2.2 AA for contrast, text scaling, focus and screen-reader labels.

## 12. Competitive strategy

### Strategic competitor

**LinkedIn** is the closest strategic comparison because it combines professional identity, a graph and a high-quality relevance feed. Duit should not copy its public content model. Duit's opportunity is a private, encounter-grounded feed and a recipient-facing pitch designed for a few seconds of attention.

### Capability benchmarks

- **Blinq and HiHello:** polished card creation and sharing.
- **Wave Connect:** Apple/Google Wallet and a strong free-card baseline.
- **Popl and Mobilo:** event lead capture and team workflows.
- **Covve, Dex and CamCard:** scanning, notes, reminders and relationship memory.
- **HubSpot and folk:** structured lead and CRM workflows.

These products define table stakes. Duit differentiates through the combination of an attention-structured pitch, immediate intent capture and a private relevance feed.

Detailed profiles and links are maintained in `PRD_REVIEW_AND_COMPETITOR_ANALYSIS.md`.

## 13. Success measures

### North star

**Weekly acted-on relationships:** unique people for whom the user responds to a lead, completes a follow-up or records a meaningful new encounter with a user-authored context signal.

### Pitch funnel

- Published card → viewed.
- Hook viewed → second panel reached.
- Pitch viewed → CTA opened.
- CTA opened → lead submitted or contact action started.
- Owner response time and reported outcome.

### Memory funnel

- Real encounter → context captured.
- Context captured → AI result confirmed.
- Feed item shown → acted on.
- Search started → relevant person opened.
- User returns after a second event or meeting week.

### Quality guardrails

- Unsupported-claim report rate.
- AI correction and rejection rate.
- Feed dismissal rate by reason.
- Median capture time.
- Public-card load time.
- Privacy or deletion incidents.

## 14. Validation gates

Before broad MVP investment:

- 10 target users test with real event contacts.
- At least 7 publish and share a pitch with 10 real recipients.
- At least 5 receive a CTA action or lead attributable to the pitch.
- At least 7 save 3+ real encounters without assistance.
- Median post-conversation capture is under 45 seconds.
- At least 5 act on a Duit-surfaced item within 72 hours.
- At least 4 return during a second event or meeting week.

These are learning gates, not market forecasts.

## 15. Monetization hypothesis

Basic viewing, sharing, contact saving and export should remain free enough to protect the recipient experience.

Potential paid value:

- richer AI pitch generation and variants;
- branding and advanced presentation controls;
- CTA configuration, lead history and analytics;
- smart-feed intelligence and longer relationship history;
- integrations and team workflows later.

India-first pricing requires direct willingness-to-pay tests. Do not copy US competitor pricing without evidence.

## 16. Go-to-market hypothesis

Start inside a small number of founder and partnership communities where repeated event behavior can be observed.

Acquisition message:

> More than contact details. Give people a reason to remember and contact you.

Retention message:

> Know who in your network is relevant to what you need or can offer now.

Each shared pitch is a product demonstration. Recipient CTAs can create value for the owner before the recipient joins Duit.

## 17. Open decisions

1. What minimum owner input reliably produces a distinctive, truthful hook?
2. Should the first pitch be optimized for customer leads, partnerships or owner-selected intent?
3. Which CTA should be default for the beachhead: WhatsApp, LinkedIn or a short lead form?
4. How should a user declare a need or offer without making the feed feel like data entry?
5. What evidence threshold permits the feed to call a person “relevant”?
6. Should a saved recipient receive an optional Duit account path, or remain an address-book export only?
7. Which Wallet implementation offers enough utility before native passes become a maintenance burden?

## 18. Immediate next steps

1. Test three hook-generation approaches using five real companies and blind recipient feedback.
2. Prototype one complete public pitch with a working CTA and lead handoff.
3. Test the private feed with manually curated needs/offers and real relationship records.
4. Validate the post-conversation note → memory → WhatsApp/LinkedIn follow-up loop.
5. Reconcile the current prototype and backend model against the domain model in this PRD.

## 19. Definition of MVP success

The MVP succeeds when target users repeatedly:

1. publish pitches that recipients understand and act on;
2. capture real encounter context quickly;
3. trust why the private feed surfaced a person or action; and
4. return because Duit helps create or recover an opportunity they would otherwise have missed.
