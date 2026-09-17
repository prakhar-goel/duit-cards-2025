# DUIT 2026 private-pilot API contract

Base `/api/v1`. All JSON DTOs camelCase; timestamps ISO. Auth `Authorization: Bearer accessToken`. Errors `{error:{code,message,details?},requestId}`. Lists use named collection plus `total,limit,offset` (default 50, max 200). Existing `cards`, `card`, `people`, `person` keys preserved. `/health` outside prefix.

## Identity

- `POST /auth/signup {email,password,displayName,inviteCode?,claimToken?}` -> 201 `{user,accessToken,refreshToken}`. User `{id,email,displayName,role,status,verifiedAt,onboardingCompleted,createdAt,profile}`. Signup does not imply email verification. When PILOT_INVITE_CODE is configured, a matching inviteCode is required unless a previously verified, unexpired claimToken matches the signup email. GET /auth/capabilities returns inviteRequired and verificationDelivery. Password minimum: 10 characters.
- `POST /auth/login {email,password}` same response; `POST /auth/refresh {refreshToken}` rotates both; `POST /auth/logout {refreshToken?}` authenticated, revokes current session.
- `GET /me` -> `{user}`; `GET/PATCH /me/profile` -> `{profile}`. Profile supports fullName,headline,company,role,bio,city,countryCode,photoUrl,website,offers,needs.
- `GET /me/home` -> `{profile,stats:{people,encounters,openCommitments,overdueCommitments,newLeads,publishedCards},commitments:[Commitment],recentPeople:[Person],upcomingEvents:[Event],leads:[Lead],feed:[FeedItem]}`.

## Cards

Card `{id,slug,title,subtitle,imageUrl,coverUrl,company,role,bio,theme,contact:{email?,phone?,website?},links:[{label,url}],ctaType,ctaLabel,ctaUrl,isPublished,publishedAt,createdAt,updatedAt,panels?}`. Panel `{id?,panelType,body,position,provenance,approved}`; six types hook,relevance,offer,outcome,proof,cta; position 0..5. Provenance owner,ai_suggested,approved_ai.

- `GET/POST /cards` -> `{cards,total,limit,offset}` / `{card}`; POST needs slug,title; other fields optional.
- `GET/PATCH/DELETE /cards/:id` owner only; DELETE returns 204.
- `POST /cards/:id/panels {panels:[6 unique panels]}` -> `{card}` atomically stores drafts.
- `POST /cards/:id/publish` -> `{card,publicUrl}`. Requires all panels approved; snapshot fixed until next publish. `POST .../unpublish`.
- `GET /public/cards/:slug` -> `{card}` published snapshot only, no view counter side effect. `GET .../vcard` .vcf.
- `POST /public/cards/:slug/events {type:viewed|cta_opened|contact_saved,source?,visitorId?,eventKey?}` -> 202; eventKey dedupes. GET `/cards/:id/analytics` -> `{totals:{views,ctaOpens,contactSaves,leads},daily:[...]}`.
- `POST /public/cards/:slug/leads {name,email?,phone?,intent?,consent:true,source?}` -> `{lead:{id,status,createdAt}}`; at least email or phone.
- `GET /leads` -> `{leads,total,limit,offset}`; `PATCH /leads/:id {status:new|responded|qualified|closed}` -> `{lead}`.
- `POST /cards/:id/save` -> `{person}` for published cards, idempotent per owner/source card.

## Sharing and verified recipient claims

- `POST /cards/:id/shares {channel:whatsapp|qr|link,recipientDraft?:{name,email,phone?,company?,role?}}` -> `{shareId,url,token}`. Recipient draft stays private; email is required when making a claimable draft. Sharing itself never sends a message.
- `GET /public/shares/:token` -> `{card,claimAvailable}`; no recipient draft.
- `POST /public/shares/:token/claim/start {email}` -> `{delivery:"local_outbox",message}` for local pilot; neutral response regardless of match.
- `POST /public/shares/:token/claim/verify {verificationToken}` -> `{claimToken,draft}` after actual token proof. Local token visible only through admin outbox, not through start response.
- `POST /claims/accept {claimToken,profile:{fullName,company?,role?,phone?}}` authenticated matching email -> `{profile,person}`; recipient edits/reviews draft first, then explicitly accepts. One-time claim.

## People and meeting memory

Person `{id,name,role,company,email,phone,photoUrl,businessCardUrl,businessCardBackUrl,tags,category,stage,city,countryCode,bio,website,sourceCardId,createdAt,updatedAt,encounterCount,lastMetAt}`.

- `GET /people?search=&countryCode=&eventId=&from=&to=&stage=&tag=&limit=&offset=` -> `{people,total,limit,offset}`.
- `POST /people` needs name; optional clientId makes offline create retries idempotent; `PATCH/DELETE /people/:id`; GET detail -> `{person,encounters,commitments}`.
- Encounter `{id,personId,ownerId,occurredAt,location,city,countryCode,latitude,longitude,eventId,eventName,meetingType,exchangeType,originalNote,recap,relevance,proposedFollowUp,createdAt}`.
- `POST /people/:id/encounters {occurredAt?,location?,city?,countryCode?,latitude?,longitude?,eventId?,eventName?,meetingType?,exchangeType?,originalNote?,commitments?:[{text,dueAt?}],clientId?}` -> `{encounter,commitments}`. No fabricated AI; recap blank until reviewed AI action. clientId dedupes offline retries per owner.
- `GET /encounters?eventId=&personId=&from=&to=&city=` -> `{encounters,total,limit,offset}`. `PATCH/DELETE /encounters/:id`.
- Event `{id,name,venue,city,countryCode,latitude,longitude,startsAt,endsAt,description,peopleCount,encounterCount}`. `GET/POST /events`; `GET /events/:id` -> `{event,people,encounters}`; PATCH/DELETE owner only.
- Commitment `{id,personId,encounterId,text,dueAt,status:open|done|dismissed,personName,company,createdAt,completedAt}`. `GET /commitments?status=&personId=`; `POST /commitments {personId,text,dueAt?,encounterId?}`; `PATCH /commitments/:id {status?,text?,dueAt?}`.
- `GET/POST /need-offers` -> `{needOffers}` / `{needOffer}`. `{id,kind:need|offer,text,active,createdAt}`. PATCH/DELETE by id.
- `GET /feed` -> `{items:[{id,type:due_commitment|relevant_person,title,reason,evidence:[{sourceType,sourceId,text}],person?,commitment?,score?}]}`. Evidence derives only from owned records, not invented facts.
- `POST /search {query,from?,to?,eventId?,countryCode?}` -> `{results:[{type:person|encounter,id,title,subtitle,excerpt,personId?,occurredAt?,score,evidence:[...]}],query}`.

## Media and AI

- `POST /media {filename,mimeType:image/jpeg|image/png|image/webp,data:base64,purpose:portrait|business_card|cover}` -> `{media:{id,url,mimeType,size,purpose,createdAt}}`, maximum decoded image 8 MB, signature validated, owner-only by default. Audio uploads accept audio/mpeg, audio/mp4, audio/webm and purpose voice_note up to 12 MB. Server ffprobe validates duration <=10 minutes before AI use. GET `/media/:id` owner-only image, GET `/public/media/:id` only when referenced in published snapshot.
- `GET /ai/capabilities` -> `{enabled,reason,tasks,budget}`. All AI disabled until real credentials and spending approval. No silent mock.
- `POST /ai/jobs {task,input,mediaIds?}` -> 202 `{job}`; `GET /ai/jobs/:id` -> `{job}`. Tasks: card_extract, profile_draft, meeting_summary, followup_draft, network_search, portrait_cleanup, card_cleanup, transcribe. Results are documented in AI_PROVIDER_PLAN.md. Generated image results contain newly stored private media metadata, never overwrite originals. Job `{id,task,status,input,result,error,createdAt,completedAt,costUsd}`. Apply suggestions by normal explicit PATCH/panels/encounter endpoints after user review.

## Admin

Admin role checked against DB each request; never token role alone. No impersonation API.

- `GET /admin/overview?dataOrigin=fictional_demo|user_created|archived_private` -> `{stats:{users,activeUsers,cards,publishedCards,people,encounters,openCommitments,leads,views,ctaOpens},daily,countries,ai,dataOrigins,sourceFilter}`.
- `GET /admin/users?search=&status=` -> `{users,total,limit,offset}`; GET user detail -> `{user,stats}`. `PATCH /admin/users/:id {status:active|suspended}`; cannot suspend self.
- `GET /admin/cards?search=` includes title,subtitle,company,role,imageUrl,coverUrl,dataOrigin and owner details; `POST /admin/cards/:id/unpublish {reason}`.
- `GET /admin/audit` -> `{audit,total,limit,offset}`.
- `GET /admin/outbox` -> `{messages,total,limit,offset}` local verification delivery only; explicitly labeled local, never described as sent email.
- `GET /admin/ai/usage` -> `{budget,usage,jobs}`.
- `GET /admin/archive?search=&countryCode=&limit=&offset=` -> `{profiles,total,limit,offset}` read-only import library, private admin only. Archive never automatically published.

## Storage and seed guidance

Default DB `duit_2026_pilot`; test DB must explicitly be `duit_2026_pilot_test`. API auto-applies tracked additive migration in isolated pilot only. Existing restored and prototype DBs must not be modified. Root seed should use authenticated API endpoints when practical. Admin creation is local operator SQL/seed, never a public signup option. Mark seeds data_origin=fictional_demo; preserve archived source IDs separately.

## Packaged serving and privacy

The API serves `apps/web/dist` at the same origin. Only `/assets` and `/demo` are static directories. `/c/:slug` and `/s/:token` render escaped approved profile content and Open Graph metadata before the web client loads; no private recipient draft appears in HTML. `/`, `/admin/*` and `/download` serve the web shell. `/downloads/DUIT-2026-Pilot.apk` serves only the explicit APK artifact, including HEAD checks. Missing API routes remain JSON errors. `.local`, dotfiles, private media and archive files are never static directories.

`/api/v1/admin/media/:id` is restricted to images owned by the operator, images referenced by the imported private archive, or images already present in an approved published snapshot. It does not give operators arbitrary access to users' private scans or voice notes. Archive/media inventory URLs use this protected endpoint; send the operator Authorization header. Original per-user `/media/:id` remains strictly owner-only.

Configure `API_PUBLIC_ORIGIN` and `PUBLIC_WEB_ORIGIN` (alias `PUBLIC_WEB_URL`) for internet sharing. A pathname prefix in those origins is retained in generated links and exposed through the HTML `duit-base-path` meta tag. The reverse proxy must route the protected prefix; web clients should resolve links/API/assets against it. Local public-media and demo image origins are normalized to the request origin for phone access. Browser CORS origins are an explicit comma-separated `APP_ORIGIN` list; bearer auth is used, not cross-site cookies.

The API applies CSP, frame denial, content-type sniffing protection and no-store defaults. Request JSON is capped at 18 MB for media; decoded uploads have stricter size and signature checks. Login/signup and verification requests have rate limits. `LOCAL_OUTBOX=true` is an explicit local pilot delivery mode, not a real email provider.

### Verification

Run `node --env-file=.env.local --test --test-timeout=30000 apps/api/test/*.test.js` from the repository. Integration tests refuse any database other than explicit `duit_2026_pilot_test`; media/static fixtures use disposable temporary folders. Provider tests use a mocked network transport and make no paid calls.
