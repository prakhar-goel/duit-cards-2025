import { Router } from 'express';
import { z } from 'zod';
import { query, transaction } from './db.js';
import { auth } from './auth.js';
import { wrap, fail, text, email, httpUrl, uuid, owned, updateRow, pagination, camel, hash, rateLimit, publicOrigin, apiOrigin, patchInput, presentPublicCard } from './common.js';
export const panelTypes = ['hook', 'relevance', 'offer', 'outcome', 'proof', 'cta'];
export const cardSchema = z.object({
  slug: text(80).toLowerCase().regex(/^[a-z0-9-]{3,80}$/),
  title: text(120).min(2),
  subtitle: text(280).default(''),
  imageUrl: httpUrl.nullable().optional(),
  coverUrl: httpUrl.nullable().optional(),
  businessCardUrl: httpUrl.nullable().optional(),
  businessCardBackUrl: httpUrl.nullable().optional(),
  businessMedia: z.array(z.object({url: httpUrl, type: z.enum(['image', 'video']), title: text(100).default(''), caption: text(240).default(''), ctaLabel: text(80).optional(), ctaPrompt: text(160).optional(), ctaColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional()})).max(4).default([]),
  company: text(120).default(''),
  role: text(120).default(''),
  bio: text(3000).default(''),
  theme: z.object({
    color: text(20).optional(),
    style: text(40).optional(),
    logoUrl: httpUrl.optional()
  }).default({}),
  contact: z.object({
    email: email.optional(),
    phone: text(40).optional(),
    address: text(300).optional(),
    website: httpUrl.optional()
  }).default({}),
  links: z.array(z.object({
    label: text(40).min(1),
    url: httpUrl
  })).max(8).default([]),
  ctaType: z.enum(['whatsapp', 'call', 'email', 'book', 'enquire', 'share_requirement']).default('enquire'),
  ctaLabel: text(80).min(1).default('Get in touch'),
  ctaUrl: httpUrl.nullable().optional()
});
const mapping = {
  slug: 'slug',
  title: 'title',
  subtitle: 'subtitle',
  imageUrl: 'image_url',
  coverUrl: 'cover_url',
  businessCardUrl: 'business_card_url',
  businessCardBackUrl: 'business_card_back_url',
  businessMedia: 'business_media',
  company: 'company',
  role: 'role',
  bio: 'bio',
  theme: 'theme',
  contact: 'contact',
  links: 'links',
  ctaType: 'cta_type',
  ctaLabel: 'cta_label',
  ctaUrl: 'cta_url'
};
export function cardDto(row, panels) {
  return {
    id: row.id,
    dataOrigin: row.data_origin,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    imageUrl: row.image_url,
    coverUrl: row.cover_url,
    businessCardUrl: row.business_card_url,
    businessCardBackUrl: row.business_card_back_url,
    businessMedia: row.business_media || [],
    company: row.company,
    role: row.role,
    bio: row.bio,
    theme: row.theme,
    contact: row.contact,
    links: row.links,
    ctaType: row.cta_type,
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(panels ? {
      panels
    } : {})
  };
}
export async function fullCard(row, db = {
  query
}) {
  const panels = (await db.query('SELECT id,panel_type,body,position,provenance,approved FROM pitch_panels WHERE card_id=$1 ORDER BY position', [row.id])).rows;
  return cardDto(row, camel(panels));
}
export async function publishedCard(slug, db = {
  query
}) {
  const row = (await db.query('SELECT c.id,c.owner_id,v.snapshot FROM cards c JOIN card_versions v ON v.id=c.published_version_id WHERE c.slug=$1 AND c.is_published=true', [slug])).rows[0];
  if (!row) fail(404, 'Card not found', 'NOT_FOUND');
  return row;
}
export async function publicCardById(id, db = {
  query
}) {
  const row = (await db.query('SELECT c.id,c.owner_id,v.snapshot FROM cards c JOIN card_versions v ON v.id=c.published_version_id WHERE c.id=$1 AND c.is_published=true', [id])).rows[0];
  if (!row) fail(404, 'Card not found', 'NOT_FOUND');
  return row;
}
export async function saveCard(ownerId, cardId, db = {
  query
}) {
  const published = await publicCardById(cardId, db);
  const c = published.snapshot;
  const existing = (await db.query('SELECT * FROM people WHERE owner_id=$1 AND source_card_id=$2', [ownerId, cardId])).rows[0];
  if (existing) return camel(existing);
  const row = (await db.query('INSERT INTO people(owner_id,name,company,role,email,phone,photo_url,bio,website,source_card_id,business_card_url) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(owner_id,source_card_id) DO UPDATE SET source_card_id=EXCLUDED.source_card_id RETURNING *', [ownerId, c.title, c.company || '', c.role || '', c.contact?.email, c.contact?.phone, c.imageUrl, c.bio || '', c.contact?.website, cardId, c.businessCardUrl || null])).rows[0];
  return camel(row);
}
function publicMediaUrl(url) {
  if (!url) return url;
  const match = url.match(/\/api\/v1\/(?:public\/)?media\/([a-f0-9-]{36})$/i);
  return match ? `${apiOrigin()}/api/v1/public/media/${match[1]}` : url;
}
export function cardsRouter() {
  const router = Router();
  router.get('/cards', auth, wrap(async (req, res) => {
    const {
      limit,
      offset
    } = pagination(req);
    const rows = await query('SELECT *,count(*) OVER() AS total FROM cards WHERE owner_id=$1 ORDER BY updated_at DESC LIMIT $2 OFFSET $3', [req.userId, limit, offset]);
    res.json({
      cards: rows.rows.map(r => cardDto(r)),
      total: Number(rows.rows[0]?.total || 0),
      limit,
      offset
    });
  }));
  router.post('/cards', auth, wrap(async (req, res) => {
    const input = cardSchema.parse(req.body);
    const entries = Object.entries(input);
    const values = entries.map(([, v]) => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
    const row = (await query(`INSERT INTO cards(owner_id,${entries.map(([k]) => mapping[k]).join(',')}) VALUES($1,${entries.map((_, i) => `$${i + 2}`).join(',')}) RETURNING *`, [req.userId, ...values])).rows[0];
    res.status(201).json({
      card: cardDto(row, [])
    });
  }));
  router.get('/cards/:id', auth, wrap(async (req, res) => res.json({
    card: await fullCard(await owned('cards', req.params.id, req.userId))
  })));
  router.patch('/cards/:id', auth, wrap(async (req, res) => {
    const input = patchInput(cardSchema.partial(), req.body);
    for (const key of ['theme', 'contact', 'links', 'businessMedia']) if (input[key] !== undefined) input[key] = JSON.stringify(input[key]);
    const row = await updateRow('cards', req.params.id, req.userId, input, mapping);
    await query('UPDATE cards SET updated_at=now() WHERE id=$1', [row.id]);
    res.json({
      card: await fullCard(row)
    });
  }));
  router.delete('/cards/:id', auth, wrap(async (req, res) => {
    await owned('cards', req.params.id, req.userId);
    await query('DELETE FROM cards WHERE id=$1', [req.params.id]);
    res.sendStatus(204);
  }));
  router.post('/cards/:id/panels', auth, wrap(async (req, res) => {
    const {
      panels
    } = z.object({
      panels: z.array(z.object({
        panelType: z.enum(panelTypes),
        body: text(1200).min(1),
        position: z.number().int().min(0).max(5),
        provenance: z.enum(['owner', 'ai_suggested', 'approved_ai']).default('owner'),
        approved: z.boolean().default(false)
      })).length(6).refine(p => new Set(p.map(x => x.panelType)).size === 6 && new Set(p.map(x => x.position)).size === 6, 'Each panel type and position must be unique')
    }).parse(req.body);
    const card = await transaction(async db => {
      await db.query('SELECT id FROM cards WHERE id=$1 AND owner_id=$2 FOR UPDATE', [req.params.id, req.userId]);
      const card = await owned('cards', req.params.id, req.userId, db);
      await db.query('DELETE FROM pitch_panels WHERE card_id=$1', [card.id]);
      for (const p of panels) await db.query('INSERT INTO pitch_panels(card_id,panel_type,body,position,provenance,approved) VALUES($1,$2,$3,$4,$5,$6)', [card.id, p.panelType, p.body, p.position, p.provenance, p.approved]);
      await db.query('UPDATE cards SET updated_at=now() WHERE id=$1', [card.id]);
      return fullCard(card, db);
    });
    res.json({
      card
    });
  }));
  router.post('/cards/:id/publish', auth, wrap(async (req, res) => {
    const card = await transaction(async db => {
      await db.query('SELECT id FROM cards WHERE id=$1 AND owner_id=$2 FOR UPDATE', [req.params.id, req.userId]);
      const row = await owned('cards', req.params.id, req.userId, db);
      const snapshot = await fullCard(row, db);
      if (snapshot.panels.length !== 6 || snapshot.panels.some(p => !p.approved)) fail(422, 'Review and approve all six panels before publishing', 'REVIEW_REQUIRED');
      const assets = [snapshot.imageUrl, snapshot.coverUrl, snapshot.businessCardUrl, snapshot.businessCardBackUrl].filter(Boolean).map(url => ({url, type:'image'})).concat(snapshot.businessMedia || []);
      for (const {url, type} of assets) {
        const match = url?.match(/\/api\/v1\/(?:public\/)?media\/([a-f0-9-]{36})$/i);
        if (match) {
          const media = await owned('media_assets', match[1], req.userId, db);
          if (!media.mime_type.startsWith(type + '/')) fail(422, 'The slide format does not match its media. Voice notes stay private.', 'IMAGE_REQUIRED');
        }
      }
      snapshot.imageUrl = publicMediaUrl(snapshot.imageUrl);
      snapshot.coverUrl = publicMediaUrl(snapshot.coverUrl);
      snapshot.businessCardUrl = publicMediaUrl(snapshot.businessCardUrl);
      snapshot.businessCardBackUrl = publicMediaUrl(snapshot.businessCardBackUrl);
      snapshot.businessMedia = (snapshot.businessMedia || []).map(item => ({...item, url:publicMediaUrl(item.url)}));
      snapshot.isPublished = true;
      snapshot.publishedAt = new Date().toISOString();
      const version = (await db.query('INSERT INTO card_versions(card_id,snapshot) VALUES($1,$2) RETURNING id', [row.id, snapshot])).rows[0];
      const updated = (await db.query('UPDATE cards SET is_published=true,published_at=now(),published_version_id=$1,updated_at=now() WHERE id=$2 RETURNING *', [version.id, row.id])).rows[0];
      return fullCard(updated, db);
    });
    res.json({
      card,
      publicUrl: `${publicOrigin()}/c/${card.slug}`
    });
  }));
  router.post('/cards/:id/unpublish', auth, wrap(async (req, res) => {
    await owned('cards', req.params.id, req.userId);
    const row = (await query('UPDATE cards SET is_published=false,updated_at=now() WHERE id=$1 RETURNING *', [req.params.id])).rows[0];
    res.json({
      card: await fullCard(row)
    });
  }));
  router.post('/cards/:id/save', auth, wrap(async (req, res) => {
    uuid.parse(req.params.id);
    res.status(201).json({
      person: await saveCard(req.userId, req.params.id)
    });
  }));
  router.get('/cards/:id/analytics', auth, wrap(async (req, res) => {
    await owned('cards', req.params.id, req.userId);
    const rows = (await query('SELECT event_type,count(*)::int AS count FROM card_events WHERE card_id=$1 GROUP BY event_type', [req.params.id])).rows;
    const totals = {
      views: 0,
      ctaOpens: 0,
      contactSaves: 0,
      leads: 0
    };
    const map = {
      viewed: 'views',
      cta_opened: 'ctaOpens',
      contact_saved: 'contactSaves',
      lead_submitted: 'leads'
    };
    for (const row of rows) totals[map[row.event_type]] = row.count;
    const daily = (await query("SELECT created_at::date::text AS date,event_type,count(*)::int AS count FROM card_events WHERE card_id=$1 AND created_at>now()-interval '30 days' GROUP BY 1,2 ORDER BY 1", [req.params.id])).rows;
    res.json({
      totals,
      daily: camel(daily)
    });
  }));
  router.get('/public/cards/:slug', wrap(async (req, res) => res.json({
    card: presentPublicCard((await publishedCard(req.params.slug)).snapshot, req)
  })));
  router.get('/public/cards/:slug/vcard', wrap(async (req, res) => {
    const card = (await publishedCard(req.params.slug)).snapshot;
    const esc = v => String(v || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, '\\$&').replace(/\r/g, '');
    const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${esc(card.title)}`, `ORG:${esc(card.company)}`, `TITLE:${esc(card.role)}`, `EMAIL:${esc(card.contact?.email)}`, `TEL:${esc(card.contact?.phone)}`, `URL:${esc(card.contact?.website)}`, 'END:VCARD'];
    res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${card.slug}.vcf"`);
    res.send(lines.join('\r\n'));
  }));
  const publicLimiter = rateLimit({
    max: 60
  });
  router.post('/public/cards/:slug/events', publicLimiter, wrap(async (req, res) => {
    const input = z.object({
      type: z.enum(['viewed', 'cta_opened', 'contact_saved']),
      source: text(100).optional(),
      visitorId: text(120).optional(),
      eventKey: text(160).optional()
    }).parse(req.body);
    const card = await publishedCard(req.params.slug);
    const visitorHash = input.visitorId ? hash(`${card.id}:${input.visitorId}`) : null;
    const eventKey = input.eventKey || (visitorHash ? `${input.type}:${visitorHash}:${new Date().toISOString().slice(0, 10)}` : null);
    await query('INSERT INTO card_events(card_id,event_type,source,visitor_hash,event_key) VALUES($1,$2,$3,$4,$5) ON CONFLICT(card_id,event_key) DO NOTHING', [card.id, input.type, input.source, visitorHash, eventKey]);
    res.status(202).json({
      recorded: true
    });
  }));
  router.post('/public/cards/:slug/cta', publicLimiter, wrap(async (req, res) => {
    const card = await publishedCard(req.params.slug);
    await query("INSERT INTO card_events(card_id,event_type,source) VALUES($1,'cta_opened',$2)", [card.id, text(100).optional().parse(req.body?.source)]);
    res.sendStatus(204);
  }));
  router.post('/public/cards/:slug/leads', publicLimiter, wrap(async (req, res) => {
    const input = z.object({
      name: text(120).min(1),
      email: email.optional(),
      phone: text(40).min(5).optional(),
      intent: text(1500).optional(),
      consent: z.literal(true),
      source: text(100).optional(),
      ctaContext: text(120).optional()
    }).refine(x => x.email || x.phone, 'Email or phone is required').parse(req.body);
    const lead = await transaction(async db => {
      const card = await publishedCard(req.params.slug, db);
      const row = (await db.query('INSERT INTO leads(card_id,name,email,phone,intent,consent,source,cta_context) VALUES($1,$2,$3,$4,$5,true,$6,$7) RETURNING id,status,created_at', [card.id, input.name, input.email, input.phone, input.intent, input.source, input.ctaContext])).rows[0];
      await db.query("INSERT INTO card_events(card_id,event_type,source) VALUES($1,'lead_submitted',$2)", [card.id, input.source]);
      return row;
    });
    res.status(201).json({
      lead: camel(lead)
    });
  }));
  router.get('/leads', auth, wrap(async (req, res) => {
    const {
      limit,
      offset
    } = pagination(req);
    const rows = (await query('SELECT l.*,c.title AS card_title,count(*) OVER() AS total FROM leads l JOIN cards c ON c.id=l.card_id WHERE c.owner_id=$1 ORDER BY l.created_at DESC LIMIT $2 OFFSET $3', [req.userId, limit, offset])).rows;
    const total = Number(rows[0]?.total || 0);
    res.json({
      leads: camel(rows.map(({
        total,
        ...r
      }) => r)),
      total,
      limit,
      offset
    });
  }));
  router.patch('/leads/:id', auth, wrap(async (req, res) => {
    uuid.parse(req.params.id);
    const {
      status
    } = z.object({
      status: z.enum(['new', 'responded', 'qualified', 'closed'])
    }).parse(req.body);
    const row = (await query('UPDATE leads l SET status=$1,updated_at=now() FROM cards c WHERE l.id=$2 AND c.id=l.card_id AND c.owner_id=$3 RETURNING l.*', [status, req.params.id, req.userId])).rows[0];
    if (!row) fail(404, 'Lead not found');
    res.json({
      lead: camel(row)
    });
  }));
  return router;
}
