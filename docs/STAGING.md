# DUIT staging

The modern app lives in this repository. The restored legacy app and its supplied archive remain separate and local.

## Hosting choice

Render Free hosts the Node API, public cards and owner dashboard together in Singapore. A dedicated Neon PostgreSQL project (`duit-cards-staging`, project `lingering-king-65095951`, branch `staging`) persists accounts, meetings, enquiries and uploaded media. No paid plan or AI spend is enabled.

Render Free sleeps after 15 minutes without incoming traffic; the next request may take roughly a minute to wake it. It is suitable for staging, not a promise of instant availability. Render's free PostgreSQL expires after 30 days, so it is not used. The external Neon database survives Render redeploys. See https://render.com/docs/free.

GCP Cloud Run could host the same API with a stable HTTPS URL and usage-based billing, but also needs an external database (or billed Cloud SQL), image storage and deployment configuration. The currently configured local Google CLI login needs renewal. For this iteration Render matches the existing hosting workflow with fewer moving parts. See https://cloud.google.com/run/pricing. Re-evaluate Cloud Run or a paid Render instance before wider testing with strict latency requirements.

## Deployment

`render.yaml` records the free service settings. Build: `npm ci --include=dev && npm run build:public`. Start: `node scripts/start-staging.mjs`. Health check: `/health`. Main is the only permanent code branch; deploy after its checks pass.

Set private environment variables `DATABASE_URL`, `JWT_SECRET` and `PILOT_INVITE_CODE`. Render injects `RENDER_EXTERNAL_URL`; the launcher uses it for public URLs and CORS. Never commit credentials. The prepared private environment file is `.local/deployment/staging.env` on the operator's Mac.

The one-time `scripts/initialize-staging.mjs` bootstrap refuses any database except the dedicated staging branch and refuses to overwrite existing users. It copies only modern curated workspaces and the operator account. It excludes the old archive, sessions, share links, uploaded archive media, leads, tracked engagement and delivery outbox. Do not rerun it to deploy code. Engagement starts fresh in staging and is recorded from actual tester actions.

## Durable uploads

Staging uses `MEDIA_STORAGE=database`. Uploaded files are stored transactionally in PostgreSQL with a total 200 MB quota; images have an 8 MB per-file limit, videos and voice recordings 12 MB. Video range requests are supported. Uploaded files retain their owner/publication checks. This bounded setup avoids dependence on Render's ephemeral filesystem. Move uploads to object storage before a production launch or a larger media workload.

The checked-in portrait/card/business assets remain static build assets. Their sources and licenses are in `docs/STOCK_MEDIA.md`. Uploaded files and published card versions are separate from these authored fixtures.

## Phones and owner access

The Android app can switch servers in its server settings without reinstalling. Moving from the Mac's tunnel to staging requires one intentional server-address change and a new login because sessions and personal changes are isolated by server. Keep the old tunnel alive until testers have moved.

The owner dashboard is `/admin`. The owner password remains in the private `.local/credentials.json`; it is never embedded in the APK. Tester accounts cannot open owner APIs. Invite-only signup stays enabled. Paid AI and external email delivery remain disabled; enquiries are stored in the app inbox.

The `/download` page uses a GitHub release APK when `PILOT_APK_URL` is set. Build with the existing signing key; never replace it. Source code and credentials are not included in release assets.

## Recovery

A Render restart or code redeploy preserves PostgreSQL data and uploads. Roll back code using Render's deployment history. Back up the Neon branch before destructive migrations; do not use the local fixture seeder against cloud data. If upload storage fills, the API rejects new files clearly rather than deleting old ones. Inspect current storage and compute quotas in Neon before expanding usage.
