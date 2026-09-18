# Pilot demo and private archive data

The pilot keeps three kinds of data separate: fictional demo accounts, new pilot activity, and the private legacy archive. The old database and image files are never modified by these scripts.

## Run locally

Start the API on `http://127.0.0.1:48152`, then run from the repository root:

```sh
node scripts/seed-pilot.mjs
node scripts/import-archive.mjs
```

Both scripts require the isolated `duit_2026_pilot` database in `.env.local` and reject a non-loopback API host. `PILOT_SEED_PASSWORD` must be set privately. Existing per-account passwords are read from `.local/credentials.json`; the seed adds new fictional credentials to that same private file. Passwords and access tokens are never printed. The scripts do not call an AI provider or send email, WhatsApp messages or phone calls.

API writes create the accounts, profiles, cards, reviewed panels, people, events, meetings, commitments, needs/offers, enquiries and sample card events. Direct SQL is restricted to reads plus operator role, provenance, seed metadata and private archive rows. No SQL creates a fake aggregate or backdates an analytics event.

The seed is repeatable. Account emails, card slugs, person/meeting client IDs, event names, need/offer text and enquiry/event source markers prevent duplicate fixture records. Re-running does not reset edited profiles, published cards or completed follow-ups. Authentication sessions are naturally new on each run. The API may ask a script to wait briefly; the importer respects `Retry-After` and paces uploads. Do not repeatedly rerun login-heavy scripts inside the 20-logins-per-15-minute window.

## Fictional network

The authored demo is anchored to **18 September 2026**. All people, companies, conversations, promises, case studies and business activity in this section are fictional. Email addresses end in `.test`; there are no real phone destinations. Portraits are original generated illustrations of fictional people, not legacy users. Contacts without portraits use the application's initials avatars.

| Account       | Business                                             | Location               | Public card             |
| ------------- | ---------------------------------------------------- | ---------------------- | ----------------------- |
| Maya Desai    | Northstar Studio: B2B product stories and onboarding | Bengaluru, India       | `/c/maya-desai-demo`    |
| Noah Morgan   | Fieldwork: event check-in and useful follow-up       | London, UK             | `/c/noah-morgan-demo`   |
| Aisha Rahman  | Loop & Leaf: small returnable-packaging trials       | Kuala Lumpur, Malaysia | `/c/aisha-rahman-demo`  |
| Raka Pratama  | Kembali Supply: documented reclaimed materials       | Jakarta, Indonesia     | `/c/raka-pratama-demo`  |
| Sofia Laurent | Atelier Système: review-first document AI workflows  | Paris, France          | `/c/sofia-laurent-demo` |
| Elias Weber   | Werkflow: factory scheduling and handovers           | Berlin, Germany        | `/c/elias-weber-demo`   |

Each public card contains six explicitly reviewed, owner-authored panels: hook, relevance, offer, outcome, proof and call to action. Proof panels identify their examples as fictional and do not claim real clients or conversion results. Their enquiry forms produce real database records for the selected fictional owner; nothing is sent externally.

The sign-in addresses are `maya@demo.duit.test`, `noah@demo.duit.test`, `aisha@demo.duit.test`, `raka@demo.duit.test`, `sofia@demo.duit.test` and `elias@demo.duit.test`. The operator is `admin@pilot.duit.test`. Read passwords in the local credentials file; they are not in documentation or source control.

Maya's workspace contains **30 people and 45 meetings**. Thirty first conversations, twelve follow-ups and three third conversations demonstrate that one person can have several encounters. Her contacts span India, Indonesia, Malaysia, Singapore, the US, the UK, France and Germany. Noah has **8 people and 8 meetings** in a separate workspace. The six sample card owners are real authenticated pilot accounts; their private relationship data remains owner-scoped.

Three past events and one upcoming event are explicitly labelled **Demo**: Paris AI Week (9–11 September), Delhi Founders Table (4 September), Singapore Builders Night (16 September), and another Delhi session (24 September). Venues are fictional. Pins are approximate city coordinates and do not assert anyone's real attendance.

The network includes specific needs and offers, not generic friendship suggestions. For example, Maya's packaging contact wants a supplier portal; a food operator wants a returnable-packaging trial; an architect needs reclaimed material samples; Sofia offers reviewed document AI; a founder needs that workflow. Introductions are written as requests to ask permission, not messages already sent. Notes, recaps and next steps are authored fixtures and are not presented as provider-generated AI results.

Initial recorded fixture counts, before anyone edits the pilot:

| Data                  | Maya | Noah |
| --------------------- | ---: | ---: |
| People                |   30 |    8 |
| Meetings              |   45 |    8 |
| Open commitments      |   26 |    4 |
| Completed commitments |    6 |    2 |
| Enquiries             |    6 |    3 |
| New enquiries         |    4 |    1 |

Each of the six cards also has three recorded demo views, one CTA-open event and one contact-save event. Nine demo enquiries add nine lead-submission events: **39 labelled demo card events** overall. These are seeded interactions, not evidence of real customer interest. All are recorded through the normal API and carry a `fictional_demo` source marker. Their timestamps are the actual seed time. Dashboard metrics should identify demo activity and keep it separate from archive counts or real pilot results.

Users, cards and people carry `data_origin=fictional_demo`; account profiles include `isDemo=true`. The operator has `data_origin=pilot_operator`. Public card snapshots preserve their demo provenance. `.local/demo-seed-summary.json` records the current authenticated home counts after a run.

## Private legacy gallery

The default source is the previously curated, user-authorized 300-profile collection:

```text
/Volumes/UserData/prakhargoel/Development/misc/duit-cards/artifacts/videos/source/curated-gallery-data.json
```

The source references 669 media entries across 643 distinct gallery paths. Those paths contain **630 distinct images by SHA-256**; identical bytes are stored once. The importer reads only that collection and files under its `assets/gallery` directory. Path traversal and symlink escapes are rejected; supported images must pass the API's format checks and 8 MB size limit. SHA-256 lookup reuses already copied media, including after an interrupted run.

All copies are uploaded through the authenticated operator's `/api/v1/media` endpoint into `.local/media`, with private file permissions. The importer writes `archive_profiles` rows keyed by `legacy:<sourceId>`, keeping the original source ID, name, business, role, dates, pitch, historical counts and labelled media. Original media files remain untouched. A retry replaces archive metadata for the same source IDs and reuses uploaded bytes; it does not create duplicates.

Archive profiles are **operator-private**. They are not user accounts, published cards, public portraits, search candidates in another person's private network, or training/AI inputs. The import creates no public cards and sends no archive data to an AI provider. Its verification expects operator image access to return 200, anonymous private access 401, and public image access 404.

`country_code`, `profile.countryCode` and `profile.code` retain the original phone dialling code. They are not ISO country codes or proof of residence. In particular, `+1` stays “North America (+1; country not inferred).” The selected gallery contains:

| Phone code                            | Label                                                                           | Profiles |
| ------------------------------------- | ------------------------------------------------------------------------------- | -------: |
| 91                                    | India                                                                           |      247 |
| 62                                    | Indonesia                                                                       |       30 |
| 60                                    | Malaysia                                                                        |        8 |
| 1                                     | North America; country not inferred                                             |        2 |
| 44                                    | United Kingdom                                                                  |        2 |
| 65                                    | Singapore                                                                       |        2 |
| 34, 51, 52, 56, 63, 92, 375, 966, 977 | Spain, Peru, Mexico, Chile, Philippines, Pakistan, Belarus, Saudi Arabia, Nepal |   1 each |

These counts describe this curated gallery, not the entire historical user base. `received`, `sent` and `events` are preserved historical card/meeting-event counts; they are not current pilot activity or proof that a profile still uses DUIT. `created` is preserved as supplied and is never invented when absent. Old contact facts may be out of date.

Resumable state is private in `.local/archive-import-state.json`; the script prints progress counts, not archived personal details. `.local/archive-import-summary.json` contains final counts and access-check results. If a profile fails, fix the input/access issue and rerun. Completed profiles and media are retained. Never commit `.local`, credentials, copied archive files or the source gallery to Git.
