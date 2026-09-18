// Render supplies a stable HTTPS origin. No local tunnel is involved.
const origin = process.env.PUBLIC_WEB_ORIGIN || process.env.RENDER_EXTERNAL_URL;
if (!origin || !origin.startsWith('https://')) throw new Error('Staging requires an explicit HTTPS origin');
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET || !process.env.PILOT_INVITE_CODE) throw new Error('Staging database, JWT secret and invitation code must be configured');
Object.assign(process.env, {
 PUBLIC_WEB_ORIGIN:origin, PUBLIC_WEB_URL:origin, API_PUBLIC_ORIGIN:origin,
 APP_ORIGIN:origin, DUIT_ALLOW_CUSTOM_DATABASE:'true', APP_ENV:'staging',
 MEDIA_STORAGE:'database', MEDIA_STORAGE_LIMIT_MB:'200', LOCAL_OUTBOX:'false',
 DUIT_AI_ENABLED:'false', DUIT_AI_BUDGET_APPROVED_USD:process.env.DUIT_AI_BUDGET_APPROVED_USD || '0', HOST:'0.0.0.0',
 TRUST_PROXY_HOPS:'1'
});
await import('../apps/api/src/server.js');
