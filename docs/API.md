# Duit Cards MVP API

Base URL: `http://localhost:4000/api/v1`

The development database is `postgresql://duit@localhost:5432/2026_duit_cards`. `apps/api` applies its schema on startup; no manual migration command is needed for the MVP.

| Area | Endpoints |
| --- | --- |
| Account | `POST /auth/signup`, `POST /auth/login`, `GET /me` |
| Onboarding | `POST /onboarding/ai-step` |
| Pitch and card | `POST /pitches/draft`, `GET/POST /cards`, `GET/PATCH /cards/:cardId`, `POST /cards/:cardId/panels`, `POST /cards/:cardId/publish` |
| Public card and leads | `GET /public/cards/:slug`, `POST /public/cards/:slug/cta`, `POST /public/cards/:slug/leads`, `GET /leads` |
| Relationship memory | `GET/POST /people`, `GET /people/:personId`, `POST /people/:personId/encounters` |
| Relevance feed | `POST /need-offers`, `GET /feed` |

Authenticated endpoints require `Authorization: Bearer <accessToken>`. The signup response matches the mobile client contract: `{ user, accessToken, refreshToken }`.

## Pitch publication rule

`POST /pitches/draft` returns exactly six panels: hook, relevance, offer, outcome, proof, and CTA. The owner saves the edited panels through `POST /cards/:cardId/panels`, marking each approved. A card cannot be published until all six panels are approved.

## Privacy boundary

Only published card content is available under `/public`. People, original encounter notes, commitments, needs/offers, and feed evidence require the owner’s access token.
