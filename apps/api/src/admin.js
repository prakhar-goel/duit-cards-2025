import { Router } from 'express';
import { z } from 'zod';
import { query, transaction } from './db.js';
import { getProviderStatus } from './providers/index.js';
import { auth, admin, userDto } from './auth.js';
import { wrap, fail, uuid, text, pagination, camel, audit } from './common.js';
function adminMediaUrls(value) {
  if (typeof value === 'string') {
    const match = value.match(/\/api\/v1\/(?:public\/)?media\/([a-f0-9-]{36})$/i);
    return match ? `/api/v1/admin/media/${match[1]}` : value;
  }
  if (Array.isArray(value)) return value.map(adminMediaUrls);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, adminMediaUrls(v)]));
  return value;
}
export function adminRouter() {
  const router = Router();
  router.use('/admin', auth, admin);
  router.get('/admin/overview', wrap(async (req, res) => {
    const origin = req.query.dataOrigin ? z.enum(['fictional_demo', 'user_created', 'archived_private']).parse(req.query.dataOrigin) : null;
    const stats = (await query(`WITH u AS(SELECT * FROM users WHERE $1::text IS NULL OR data_origin=$1),c AS(SELECT cards.* FROM cards JOIN u ON u.id=cards.owner_id),p AS(SELECT people.* FROM people JOIN u ON u.id=people.owner_id),e AS(SELECT encounters.* FROM encounters JOIN u ON u.id=encounters.owner_id)
   SELECT (SELECT count(*)::int FROM u) AS users,(SELECT count(*)::int FROM u WHERE status='active') AS active_users,(SELECT count(*)::int FROM c) AS cards,(SELECT count(*)::int FROM c WHERE is_published=true) AS published_cards,(SELECT count(*)::int FROM p) AS people,(SELECT count(*)::int FROM e) AS encounters,(SELECT count(*)::int FROM commitments x JOIN u ON u.id=x.owner_id WHERE x.status='open') AS open_commitments,(SELECT count(*)::int FROM leads l JOIN c ON c.id=l.card_id) AS leads,(SELECT count(*)::int FROM card_events ce JOIN c ON c.id=ce.card_id WHERE event_type='viewed') AS views,(SELECT count(*)::int FROM card_events ce JOIN c ON c.id=ce.card_id WHERE event_type='cta_opened') AS cta_opens`, [origin])).rows[0];
    const daily = (await query("SELECT ce.created_at::date::text AS date,event_type,count(*)::int AS count FROM card_events ce JOIN cards c ON c.id=ce.card_id JOIN users u ON u.id=c.owner_id WHERE ce.created_at>now()-interval '30 days' AND ($1::text IS NULL OR u.data_origin=$1) GROUP BY 1,2 ORDER BY 1", [origin])).rows;
    const countries = (await query("SELECT COALESCE(NULLIF(profile->>'countryCode',''),'Unknown') AS country_code,count(*)::int AS users FROM users WHERE $1::text IS NULL OR data_origin=$1 GROUP BY 1 ORDER BY users DESC", [origin])).rows;
    const ai = (await query('SELECT * FROM ai_budgets WHERE id=$1', ['pilot'])).rows[0];
    const dataOrigins = (await query(`SELECT o.data_origin,(SELECT count(*)::int FROM users u WHERE u.data_origin=o.data_origin) AS users,(SELECT count(*)::int FROM cards c JOIN users u ON u.id=c.owner_id WHERE u.data_origin=o.data_origin) AS cards,(SELECT count(*)::int FROM encounters e JOIN users u ON u.id=e.owner_id WHERE u.data_origin=o.data_origin) AS encounters,(SELECT count(*)::int FROM leads l JOIN cards c ON c.id=l.card_id JOIN users u ON u.id=c.owner_id WHERE u.data_origin=o.data_origin) AS leads,(SELECT count(*)::int FROM card_events ce JOIN cards c ON c.id=ce.card_id JOIN users u ON u.id=c.owner_id WHERE u.data_origin=o.data_origin AND ce.event_type='viewed') AS views FROM(SELECT DISTINCT data_origin FROM users) o`)).rows;
    res.json({
      stats: camel(stats),
      daily: camel(daily),
      countries: camel(countries),
      ai: camel(ai),
      dataOrigins: camel(dataOrigins),
      sourceFilter: origin || 'all'
    });
  }));
  router.get('/admin/users', wrap(async (req, res) => {
    const {
      limit,
      offset
    } = pagination(req);
    const search = text(150).parse(req.query.search || '');
    const status = req.query.status ? z.enum(['active', 'suspended']).parse(req.query.status) : null;
    const rows = (await query("SELECT *,count(*) OVER() AS total FROM users WHERE (email||' '||display_name) ILIKE $1 AND ($2::text IS NULL OR status=$2) ORDER BY created_at DESC LIMIT $3 OFFSET $4", [`%${search}%`, status, limit, offset])).rows;
    res.json({
      users: rows.map(userDto),
      total: Number(rows[0]?.total || 0),
      limit,
      offset
    });
  }));
  router.get('/admin/users/:id', wrap(async (req, res) => {
    uuid.parse(req.params.id);
    const row = (await query('SELECT * FROM users WHERE id=$1', [req.params.id])).rows[0];
    if (!row) fail(404, 'User not found');
    const stats = (await query('SELECT (SELECT count(*)::int FROM cards WHERE owner_id=$1) AS cards,(SELECT count(*)::int FROM people WHERE owner_id=$1) AS people,(SELECT count(*)::int FROM encounters WHERE owner_id=$1) AS encounters', [row.id])).rows[0];
    res.json({
      user: userDto(row),
      stats
    });
  }));
  router.patch('/admin/users/:id', wrap(async (req, res) => {
    uuid.parse(req.params.id);
    const {
      status
    } = z.object({
      status: z.enum(['active', 'suspended'])
    }).parse(req.body);
    if (req.params.id === req.userId) fail(400, 'You cannot change your own status');
    const user = await transaction(async db => {
      const row = (await db.query('UPDATE users SET status=$1,updated_at=now() WHERE id=$2 RETURNING *', [status, req.params.id])).rows[0];
      if (!row) fail(404, 'User not found');
      if (status === 'suspended') await db.query('UPDATE auth_sessions SET revoked_at=now() WHERE user_id=$1', [row.id]);
      await audit(req.userId, 'user.status_changed', 'user', row.id, {
        status
      }, db);
      return row;
    });
    res.json({
      user: userDto(user)
    });
  }));
  router.get('/admin/cards', wrap(async (req, res) => {
    const {
      limit,
      offset
    } = pagination(req);
    const search = text(150).parse(req.query.search || '');
    const rows = (await query("SELECT c.id,c.slug,c.title,c.subtitle,c.image_url,c.cover_url,c.role,c.company,c.is_published,c.published_at,c.created_at,c.data_origin,u.email AS owner_email,u.display_name AS owner_name,count(*) OVER() AS total FROM cards c JOIN users u ON u.id=c.owner_id WHERE (c.title||' '||c.company||' '||u.email||' '||u.display_name) ILIKE $3 ORDER BY c.updated_at DESC LIMIT $1 OFFSET $2", [limit, offset, `%${search}%`])).rows;
    const cards = adminMediaUrls(camel(rows.map(({
      total,
      ...r
    }) => r)));
    res.json({
      cards,
      total: Number(rows[0]?.total || 0),
      limit,
      offset
    });
  }));
  router.post('/admin/cards/:id/unpublish', wrap(async (req, res) => {
    uuid.parse(req.params.id);
    const {
      reason
    } = z.object({
      reason: text(1000).min(5)
    }).parse(req.body);
    await transaction(async db => {
      const r = await db.query('UPDATE cards SET is_published=false,updated_at=now() WHERE id=$1 RETURNING id', [req.params.id]);
      if (!r.rowCount) fail(404, 'Card not found');
      await audit(req.userId, 'card.unpublished', 'card', req.params.id, {
        reason
      }, db);
    });
    res.json({
      unpublished: true
    });
  }));
  router.get('/admin/audit', wrap(async (req, res) => {
    const {
      limit,
      offset
    } = pagination(req);
    const rows = (await query('SELECT a.*,u.email AS actor_email,count(*) OVER() AS total FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT $1 OFFSET $2', [limit, offset])).rows;
    res.json({
      audit: camel(rows.map(({
        total,
        ...r
      }) => r)),
      total: Number(rows[0]?.total || 0),
      limit,
      offset
    });
  }));
  router.get('/admin/outbox', wrap(async (req, res) => {
    if (process.env.LOCAL_OUTBOX !== 'true') fail(404, 'Local outbox is disabled');
    const {
      limit,
      offset
    } = pagination(req);
    const rows = (await query('SELECT *,count(*) OVER() AS total FROM local_outbox ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset])).rows;
    res.json({
      messages: camel(rows.map(({
        total,
        ...r
      }) => r)),
      total: Number(rows[0]?.total || 0),
      limit,
      offset,
      delivery: 'local_outbox',
      notice: 'Private pilot only. These messages have NOT been delivered as email.'
    });
  }));
  router.get('/admin/ai/usage', wrap(async (req, res) => {
    const budget = (await query('SELECT * FROM ai_budgets WHERE id=$1', ['pilot'])).rows[0];
    const usage = (await query('SELECT task,status,count(*)::int AS jobs,COALESCE(sum(cost_usd),0) AS cost_usd FROM ai_jobs GROUP BY task,status')).rows;
    const jobs = (await query('SELECT id,owner_id,task,status,provider,model,cost_usd,reserved_usd,created_at,completed_at FROM ai_jobs ORDER BY created_at DESC LIMIT 100')).rows;
    res.json({
      budget: {
        ...camel(budget),
        enabled: getProviderStatus().configured
      },
      usage: camel(usage),
      jobs: camel(jobs)
    });
  }));
  router.get('/admin/archive', wrap(async (req, res) => {
    const {
      limit,
      offset
    } = pagination(req);
    const search = text(150).parse(req.query.search || '');
    const country = req.query.countryCode ? text(8).parse(req.query.countryCode) : null;
    const rows = (await query("SELECT *,count(*) OVER() AS total FROM archive_profiles WHERE (name||' '||COALESCE(company,'')) ILIKE $1 AND ($2::text IS NULL OR country_code=$2) ORDER BY name,id LIMIT $3 OFFSET $4", [`%${search}%`, country, limit, offset])).rows;
    res.json({
      profiles: adminMediaUrls(camel(rows.map(({
        total,
        ...r
      }) => r))),
      total: Number(rows[0]?.total || 0),
      limit,
      offset,
      visibility: 'private_admin_archive'
    });
  }));
  return router;
}
