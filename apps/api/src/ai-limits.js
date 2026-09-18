import { fail } from './common.js';

// Initial pilot ceilings can only be lowered by environment configuration.
// Raising them is an explicit release decision, not an accidental env typo.
export function aiLimits(env = process.env) {
  const value = (name, ceiling) => {
    const n = env[name] === undefined ? ceiling : Number(env[name]);
    return Number.isFinite(n) && n > 0 ? Math.min(n, ceiling) : 0;
  };
  return {
    totalUsd: value('DUIT_AI_BUDGET_APPROVED_USD', 5),
    dailyUsd: value('DUIT_AI_DAILY_USD', 0.5),
    maxJobUsd: value('DUIT_AI_MAX_JOB_USD', 0.1),
    dailyRequests: Math.floor(value('DUIT_AI_DAILY_REQUESTS', 50)),
    userDailyRequests: Math.floor(value('DUIT_AI_USER_DAILY_REQUESTS', 20)),
    requestsPerMinute: Math.floor(value('DUIT_AI_REQUESTS_PER_MINUTE', 3)),
    concurrency: 1,
    window: 'rolling_24_hours',
    automaticBudgetReset: false,
  };
}

// Caller holds the pilot ai_budgets row lock until its job INSERT commits.
// This serializes admission across server instances and simultaneous users.
export async function enforceAiAdmission(db, ownerId, reserve, env = process.env) {
  const limits = aiLimits(env);
  if (!(reserve > 0) || !Number.isFinite(reserve) || reserve > limits.maxJobUsd)
    fail(402, 'This request exceeds the initial per-request AI limit.', 'AI_JOB_LIMIT');
  const usage = (await db.query(`SELECT
    count(*) FILTER (WHERE created_at > now() - interval '24 hours') AS daily_requests,
    count(*) FILTER (WHERE owner_id=$1 AND created_at > now() - interval '24 hours') AS user_requests,
    count(*) FILTER (WHERE created_at > now() - interval '1 minute') AS recent_requests,
    count(*) FILTER (WHERE status IN ('queued','running')) AS active,
    COALESCE(sum(cost_usd + reserved_usd) FILTER (WHERE created_at > now() - interval '24 hours'),0) AS daily_usd
    FROM ai_jobs`, [ownerId])).rows[0];
  if (Number(usage.daily_usd) + reserve > limits.dailyUsd)
    fail(402, 'The daily AI allowance is used. Try again later.', 'AI_DAILY_BUDGET');
  if (Number(usage.daily_requests) >= limits.dailyRequests || Number(usage.user_requests) >= limits.userDailyRequests)
    fail(429, 'The daily AI request limit is reached. Try again later.', 'AI_DAILY_REQUESTS');
  if (Number(usage.active) >= limits.concurrency)
    fail(429, 'Another AI request is running. Please wait for it to finish.', 'AI_BUSY');
  if (Number(usage.recent_requests) >= limits.requestsPerMinute)
    fail(429, 'Please wait a minute before another AI request.', 'AI_RATE_LIMIT');
}
