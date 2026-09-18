import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { aiLimits, enforceAiAdmission } from '../src/ai-limits.js';

test('initial AI ceilings cannot be raised or disabled by malformed configuration', () => {
  assert.equal(aiLimits({DUIT_AI_DAILY_USD:'1000'}).dailyUsd, 0.5);
  for (const n of ['NaN','Infinity','-1','0','']) assert.equal(aiLimits({DUIT_AI_DAILY_USD:n}).dailyUsd, 0);
  assert.equal(aiLimits({DUIT_AI_DAILY_USD:'0.2'}).dailyUsd, 0.2);
  assert.equal(aiLimits({}).totalUsd, 5);
});

test('persistent admission checks count reservations, failed calls, users and rolling windows', async () => {
  const url=process.env.TEST_DATABASE_URL;
  if (!url || new URL(url).pathname!=='/duit_2026_pilot_test') throw Error('Requires explicit isolated test database');
  const db=new pg.Client({connectionString:url}); await db.connect();
  const owner='00000000-0000-4000-8000-000000000001';
  const other='00000000-0000-4000-8000-000000000002';
  try {
    await db.query('CREATE TEMP TABLE ai_jobs(owner_id uuid,status text,cost_usd numeric,reserved_usd numeric,created_at timestamptz)');
    const insert=async (status,cost,reserved,age='2 minutes',id=owner)=>db.query("INSERT INTO ai_jobs VALUES($1,$2,$3,$4,now()-$5::interval)",[id,status,cost,reserved,age]);
    const deny=code=>e=>e.code===code;
    await enforceAiAdmission(db,owner,0.02,{});
    await assert.rejects(enforceAiAdmission(db,owner,0.101,{}),deny('AI_JOB_LIMIT'));
    await insert('running',0,0.02);
    await assert.rejects(enforceAiAdmission(db,other,0.02,{}),deny('AI_BUSY'));
    await db.query('TRUNCATE ai_jobs');
    await insert('needs_review',0,0.49);
    await assert.rejects(enforceAiAdmission(db,owner,0.02,{}),deny('AI_DAILY_BUDGET'));
    await db.query('TRUNCATE ai_jobs');
    for(let i=0;i<3;i++)await insert('failed',0,0,'10 seconds');
    await assert.rejects(enforceAiAdmission(db,owner,0.02,{}),deny('AI_RATE_LIMIT'));
    await db.query('TRUNCATE ai_jobs');
    for(let i=0;i<20;i++)await insert('failed',0,0);
    await assert.rejects(enforceAiAdmission(db,owner,0.02,{}),deny('AI_DAILY_REQUESTS'));
    await enforceAiAdmission(db,other,0.02,{});
    for(let i=0;i<30;i++)await insert('failed',0,0,'2 minutes',other);
    await assert.rejects(enforceAiAdmission(db,other,0.02,{}),deny('AI_DAILY_REQUESTS'));
    await db.query("UPDATE ai_jobs SET created_at=now()-interval '25 hours'");
    await enforceAiAdmission(db,owner,0.02,{});
  } finally { await db.end(); }
});
