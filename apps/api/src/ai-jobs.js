import { Router } from 'express';
import { z } from 'zod';
import { query, transaction } from './db.js';
import { auth } from './auth.js';
import { wrap, fail, uuid, owned, camel, rateLimit } from './common.js';
import { mediaForAi, storeMedia, mediaDto } from './media.js';
import { searchOwned } from './relationships.js';
import { aiLimits, enforceAiAdmission } from './ai-limits.js';
import { getProviderStatus, estimateCost, runAi, TASKS } from './providers/index.js';
const jobDto = row => ({
  ...camel(row),
  reservedUsd: Number(row.reserved_usd),
  costUsd: Number(row.cost_usd),
  requiresReview: true
});
export async function recoverInterruptedJobs() {
  await query("UPDATE ai_jobs SET status='needs_review',error='The server restarted during this request. Its cost reservation is retained until the operator checks provider usage.',completed_at=now() WHERE status IN ('queued','running')");
}
async function budget() {
  const row = (await query('SELECT * FROM ai_budgets WHERE id=$1', ['pilot'])).rows[0];
  const limit = aiLimits().totalUsd;
  return {
    limitUsd: limit,
    spentUsd: Number(row?.spent_usd || 0),
    reservedUsd: Number(row?.reserved_usd || 0),
    remainingUsd: Math.max(0, limit - Number(row?.spent_usd || 0) - Number(row?.reserved_usd || 0))
  };
}
async function settle(id, ownerId, reserve, response, error) {
  let result = response?.result;
  let cost = Number(response?.usage?.costUsd ?? error?.usage?.costUsd ?? 0);
  const unknownCharge = Boolean(error?.chargeMayHaveOccurred && !error?.usage);
  let resultError;
  if (result?.images) {
    try {
      const images = [];
      for (const [index, image] of result.images.entries()) {
        const row = await storeMedia(ownerId, {
          filename: `ai-review-${id}-${index}.png`,
          mimeType: image.mimeType,
          data: image.base64,
          purpose: response.task === 'portrait_cleanup' ? 'portrait' : 'business_card'
        });
        images.push(mediaDto(row));
      }
      result = {
        ...result,
        images
      };
    } catch (e) {
      resultError = e;
    }
  }
  await transaction(async db => {
    const status = unknownCharge ? 'needs_review' : error || resultError ? 'failed' : 'succeeded';
    await db.query('UPDATE ai_jobs SET status=$1,result=$2,error=$3,cost_usd=$4,reserved_usd=$5,completed_at=now() WHERE id=$6', [status, resultError ? null : result || null, error?.message || resultError?.message || null, cost, unknownCharge ? reserve : 0, id]);
    if (!unknownCharge) await db.query("UPDATE ai_budgets SET reserved_usd=GREATEST(0,reserved_usd-$1),spent_usd=spent_usd+$2 WHERE id='pilot'", [reserve, cost]);
  });
}
async function execute(job, input, media, reserve) {
  await query("UPDATE ai_jobs SET status='running' WHERE id=$1", [job.id]);
  let response, providerError;
  try {
    response = await runAi({
      task: job.task,
      input,
      media,
      reservationUsd: reserve
    });
  } catch (error) {
    providerError = error;
  }
  try {
    await settle(job.id, job.owner_id, reserve, response, providerError);
  } catch (persistenceError) {
    // A failed DB transaction says nothing about whether the provider charged us.
    // Keep the reservation, retain known cost evidence, and never run AI again.
    await query("UPDATE ai_jobs SET status='needs_review',error=$1,cost_usd=$2,completed_at=now() WHERE id=$3", [
      'The provider request finished but its billing record could not be saved. Its reservation is retained for operator review.',
      Number(response?.usage?.costUsd ?? providerError?.usage?.costUsd ?? 0),
      job.id
    ]).catch(() => {});
    throw persistenceError;
  }
}
export function aiRouter() {
  const router = Router();
  router.use('/ai', auth);
  router.get('/ai/capabilities', wrap(async (req, res) => {
    const state = getProviderStatus();
    res.json({
      ...state,
      enabled: state.configured,
      reason: state.configured ? 'Real AI is available; every output remains a draft.' : 'Real AI is not enabled. Configure approved credentials and spending before using these tools.',
      tasks: TASKS,
      budget: await budget(),
      limits: aiLimits()
    });
  }));
  router.post('/ai/jobs', rateLimit({
    max: 12,
    key: req => req.userId
  }), wrap(async (req, res) => {
    const request = z.object({
      task: z.enum(TASKS),
      input: z.record(z.string(), z.unknown()).default({}),
      mediaIds: z.array(uuid).max(2).default([])
    }).parse(req.body);
    if (!getProviderStatus().configured) fail(503, 'Real AI needs approved credentials and a spending limit. Your data has not been sent.', 'AI_NOT_CONFIGURED');
    let input = request.input;
    if (Buffer.byteLength(JSON.stringify(input)) > 48000) fail(413, 'Shorten this AI request', 'AI_INPUT_TOO_LARGE');
    if (input.encounterId) {
      const encounter = await owned('encounters', uuid.parse(input.encounterId), req.userId);
      const person = await owned('people', encounter.person_id, req.userId);
      input = {
        ...input,
        originalNote: encounter.original_note,
        note: encounter.original_note,
        occurredAt: encounter.occurred_at,
        personName: person.name,
        sources: [{
          id: `encounter:${encounter.id}`,
          text: encounter.original_note
        }]
      };
    }
    if (input.personId) {
      const person = await owned('people', uuid.parse(input.personId), req.userId);
      input = {
        ...input,
        recipientName: person.name
      };
    }
    if (input.cardId) await owned('cards', uuid.parse(input.cardId), req.userId);
    if (request.task === 'network_search') {
      const queryText = z.string().trim().min(2).max(500).parse(input.query);
      const results = await searchOwned(req.userId, {
        query: queryText
      });
      input = {
        query: queryText,
        candidates: results.slice(0, 30).map(r => ({
          id: r.id,
          name: r.title,
          company: r.person.company,
          evidence: r.evidence.map(e => ({
            id: `${e.sourceType}:${e.sourceId}`,
            text: e.text
          }))
        }))
      };
    }
    const media = await mediaForAi(req.userId, request.mediaIds);
    const estimate = estimateCost({
      task: request.task,
      input,
      media
    });
    const reserve = estimate.reserveUsd;
    if (!Number.isFinite(reserve) || reserve <= 0) fail(503, 'AI cost could not be estimated safely', 'AI_COST_UNAVAILABLE');
    const job = await transaction(async db => {
      const limit = aiLimits().totalUsd;
      await db.query("UPDATE ai_budgets SET limit_usd=$1 WHERE id='pilot'", [limit]);
      const budget = (await db.query("UPDATE ai_budgets SET reserved_usd=reserved_usd+$1 WHERE id='pilot' AND spent_usd+reserved_usd+$1<=limit_usd RETURNING *", [reserve])).rows[0];
      if (!budget) fail(402, 'The pilot AI spending limit is reached', 'AI_BUDGET_EXHAUSTED');
      await enforceAiAdmission(db, req.userId, reserve);
      return (await db.query('INSERT INTO ai_jobs(owner_id,task,input,media_ids,provider,model,reserved_usd) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *', [req.userId, request.task, input, request.mediaIds, estimate.provider, estimate.model, reserve])).rows[0];
    });
    res.status(202).json({
      job: jobDto(job)
    });
    setImmediate(() => execute(job, input, media, reserve).catch(error => console.error('AI job persistence failed', {
      jobId: job.id,
      code: error.code || 'UNKNOWN'
    })));
  }));
  router.get('/ai/jobs/:id', wrap(async (req, res) => res.json({
    job: jobDto(await owned('ai_jobs', req.params.id, req.userId))
  })));
  return router;
}
