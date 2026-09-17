import { Router } from 'express';
import { z } from 'zod';
import { query, transaction } from './db.js';
import { auth } from './auth.js';
import { wrap, fail, text, email, httpUrl, date, uuid, owned, updateRow, pagination, camel, patchInput } from './common.js';
const personSchema = z.object({
  name: text(120).min(2),
  role: text(120).default(''),
  company: text(160).default(''),
  email: email.nullable().optional(),
  phone: text(40).nullable().optional(),
  photoUrl: httpUrl.nullable().optional(),
  businessCardUrl: httpUrl.nullable().optional(),
  businessCardBackUrl: httpUrl.nullable().optional(),
  tags: z.array(text(40).min(1)).max(30).default([]),
  category: text(50).default('connection'),
  stage: z.enum(['new', 'promising', 'active', 'customer', 'partner', 'archived']).default('new'),
  city: text(100).default(''),
  countryCode: text(8).default(''),
  bio: text(3000).default(''),
  website: httpUrl.nullable().optional(),
  clientId: text(100).min(8).optional()
});
const personMap = {
  name: 'name',
  role: 'role',
  company: 'company',
  email: 'email',
  phone: 'phone',
  photoUrl: 'photo_url',
  businessCardUrl: 'business_card_url',
  businessCardBackUrl: 'business_card_back_url',
  tags: 'tags',
  category: 'category',
  stage: 'stage',
  city: 'city',
  countryCode: 'country_code',
  bio: 'bio',
  website: 'website',
  clientId: 'client_id'
};
const eventSchema = z.object({
  name: text(180).min(2),
  venue: text(180).default(''),
  city: text(100).default(''),
  countryCode: text(8).default(''),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  startsAt: date.nullable().optional(),
  endsAt: date.nullable().optional(),
  description: text(3000).default('')
});
const eventMap = {
  name: 'name',
  venue: 'venue',
  city: 'city',
  countryCode: 'country_code',
  latitude: 'latitude',
  longitude: 'longitude',
  startsAt: 'starts_at',
  endsAt: 'ends_at',
  description: 'description'
};
const commitmentSchema = z.object({
  text: text(1000).min(1),
  dueAt: date.nullable().optional()
});
const encounterSchema = z.object({
  occurredAt: date.optional(),
  location: text(180).nullable().optional(),
  city: text(100).default(''),
  countryCode: text(8).default(''),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  eventId: uuid.nullable().optional(),
  eventName: text(180).nullable().optional(),
  meetingType: z.enum(['Conference', 'Coffee', 'Office', 'Dinner', 'Call', 'Online', 'Other']).default('Conference'),
  exchangeType: z.enum(['Shared my card', 'Received their card', 'Both exchanged cards', 'No cards exchanged']).default('Both exchanged cards'),
  originalNote: text(10000).default(''),
  recap: text(5000).nullable().optional(),
  relevance: text(3000).nullable().optional(),
  proposedFollowUp: text(3000).nullable().optional(),
  commitments: z.array(commitmentSchema).max(30).default([]),
  clientId: text(100).min(8).optional()
});
const encounterMap = {
  occurredAt: 'occurred_at',
  location: 'location',
  city: 'city',
  countryCode: 'country_code',
  latitude: 'latitude',
  longitude: 'longitude',
  eventId: 'event_id',
  eventName: 'event_name',
  meetingType: 'meeting_type',
  exchangeType: 'exchange_type',
  originalNote: 'original_note',
  recap: 'recap',
  relevance: 'relevance',
  proposedFollowUp: 'proposed_follow_up',
  clientId: 'client_id'
};
async function insert(table, ownerId, input, mapping, db = {
  query
}) {
  const fields = Object.entries(input).filter(([key]) => mapping[key]);
  const row = (await db.query(`INSERT INTO ${table}(owner_id,${fields.map(([k]) => mapping[k]).join(',')}) VALUES($1,${fields.map((_, i) => `$${i + 2}`).join(',')}) RETURNING *`, [ownerId, ...fields.map(([, v]) => v)])).rows[0];
  return row;
}
function listResponse(key, rows, limit, offset) {
  const total = Number(rows[0]?.total || 0);
  return {
    [key]: camel(rows.map(({
      total,
      ...row
    }) => row)),
    total,
    limit,
    offset
  };
}
const peopleSelect = `SELECT p.*, (SELECT slug FROM cards c WHERE c.id=p.source_card_id AND c.is_published=true) AS card_slug, (SELECT count(*)::int FROM encounters e WHERE e.person_id=p.id) AS encounter_count, (SELECT max(occurred_at) FROM encounters e WHERE e.person_id=p.id) AS last_met_at`;
async function getPerson(id, ownerId) {
  const row = (await query(`${peopleSelect} FROM people p WHERE p.id=$1 AND p.owner_id=$2`, [id, ownerId])).rows[0];
  if (!row) fail(404, 'Person not found', 'NOT_FOUND');
  return camel(row);
}
const stop = new Set('the a an and or to of in on at for with that this from my me i we who is are was were have has had people someone person find met last week month year near about need want our can you they them their'.split(' '));
const tokens = value => [...new Set(String(value).toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || [])].filter(t => !stop.has(t)).slice(0, 16);
export async function searchOwned(ownerId, input) {
  const candidates = (await query(`SELECT p.*, e.id AS encounter_id,e.original_note,e.recap,e.relevance,e.occurred_at,e.event_name,e.location FROM people p LEFT JOIN encounters e ON e.person_id=p.id WHERE p.owner_id=$1 AND ($2::timestamptz IS NULL OR e.occurred_at >= $2) AND ($3::timestamptz IS NULL OR e.occurred_at <= $3) AND ($4::uuid IS NULL OR e.event_id=$4) AND ($5::text IS NULL OR lower(p.country_code)=lower($5)) ORDER BY p.updated_at DESC LIMIT 2000`, [ownerId, input.from || null, input.to || null, input.eventId || null, input.countryCode || null])).rows;
  const terms = tokens(input.query);
  const matches = new Map();
  for (const row of candidates) {
    const profile = [row.name, row.company, row.role, row.bio, ...row.tags, row.city, row.country_code].filter(Boolean).join(' · ');
    const note = [row.original_note, row.recap, row.relevance, row.event_name, row.location].filter(Boolean).join(' · ');
    const hay = (profile + ' ' + note).toLowerCase();
    const found = terms.filter(t => hay.includes(t));
    if (!found.length && terms.length) continue;
    const evidence = [];
    if (terms.some(t => profile.toLowerCase().includes(t)) || !terms.length) evidence.push({
      sourceType: 'person',
      sourceId: row.id,
      text: profile.slice(0, 500)
    });
    if (row.encounter_id && terms.some(t => note.toLowerCase().includes(t))) evidence.push({
      sourceType: 'encounter',
      sourceId: row.encounter_id,
      text: note.slice(0, 700)
    });
    const score = found.length / Math.max(terms.length, 1);
    const result = {
      type: 'person',
      id: row.id,
      title: row.name,
      subtitle: [row.role, row.company].filter(Boolean).join(' · '),
      excerpt: (note || row.bio || profile).slice(0, 350),
      personId: row.id,
      occurredAt: row.occurred_at,
      score,
      evidence,
      person: camel(Object.fromEntries(Object.entries(row).filter(([key]) => !['encounter_id', 'original_note', 'recap', 'relevance', 'occurred_at', 'event_name', 'location'].includes(key))))
    };
    if (!matches.has(row.id) || matches.get(row.id).score < score) matches.set(row.id, result);
  }
  return [...matches.values()].sort((a, b) => b.score - a.score).slice(0, 50);
}
export async function feedFor(ownerId) {
  const commitments = (await query("SELECT c.*,p.name AS person_name,p.company FROM commitments c JOIN people p ON p.id=c.person_id WHERE c.owner_id=$1 AND c.status='open' ORDER BY c.due_at NULLS LAST,c.created_at DESC LIMIT 12", [ownerId])).rows;
  const needs = (await query('SELECT * FROM need_offers WHERE owner_id=$1 AND active=true ORDER BY created_at DESC LIMIT 8', [ownerId])).rows;
  const items = commitments.map(row => ({
    id: `commitment-${row.id}`,
    type: 'due_commitment',
    title: row.text,
    reason: row.due_at && new Date(row.due_at) < new Date() ? 'Your follow-up is due' : 'A promise worth keeping',
    evidence: [{
      sourceType: 'commitment',
      sourceId: row.id,
      text: row.text
    }],
    commitment: camel(row)
  }));
  const seen = new Set();
  for (const need of needs) {
    for (const result of (await searchOwned(ownerId, {
      query: need.text
    })).slice(0, 4)) {
      if (seen.has(result.id)) continue;
      seen.add(result.id);
      items.push({
        id: `match-${need.id}-${result.id}`,
        type: 'relevant_person',
        title: result.title,
        reason: `Their saved details relate to your ${need.kind}: ${need.text}`,
        evidence: result.evidence,
        person: result.person,
        score: result.score
      });
    }
  }
  return items;
}
export function relationshipsRouter() {
  const router = Router();
  router.use(auth);
  router.get('/people', wrap(async (req, res) => {
    const {
      limit,
      offset
    } = pagination(req);
    const clauses = ['p.owner_id=$1'];
    const values = [req.userId];
    const add = (sql, value) => {
      values.push(value);
      clauses.push(sql.replace('?', `$${values.length}`));
    };
    if (req.query.search) {
      add("(p.name||' '||p.company||' '||p.role||' '||p.bio||' '||array_to_string(p.tags,' ')) ILIKE ?", `%${text(150).parse(req.query.search)}%`);
    }
    if (req.query.countryCode) add('lower(p.country_code)=lower(?)', text(8).parse(req.query.countryCode));
    if (req.query.stage) add('p.stage=?', text(30).parse(req.query.stage));
    if (req.query.tag) add('?=ANY(p.tags)', text(40).parse(req.query.tag));
    if (req.query.eventId) add('EXISTS(SELECT 1 FROM encounters e WHERE e.person_id=p.id AND e.event_id=?)', uuid.parse(req.query.eventId));
    if (req.query.from) add('EXISTS(SELECT 1 FROM encounters e WHERE e.person_id=p.id AND e.occurred_at>=?::timestamptz)', date.parse(req.query.from));
    if (req.query.to) add('EXISTS(SELECT 1 FROM encounters e WHERE e.person_id=p.id AND e.occurred_at<=?::timestamptz)', date.parse(req.query.to));
    values.push(limit, offset);
    const rows = (await query(`${peopleSelect},count(*) OVER() AS total FROM people p WHERE ${clauses.join(' AND ')} ORDER BY p.updated_at DESC,p.id LIMIT $${values.length - 1} OFFSET $${values.length}`, values)).rows;
    res.json(listResponse('people', rows, limit, offset));
  }));
  router.post('/people', wrap(async (req, res) => {
    const input = personSchema.parse(req.body);
    for (const field of ['photoUrl', 'businessCardUrl', 'businessCardBackUrl']) {
      const match = input[field]?.match(/\/api\/v1\/(?:public\/)?media\/([a-f0-9-]{36})$/i);
      if (match) await owned('media_assets', match[1], req.userId);
    }
    let person;
    let existing = false;
    await transaction(async db => {
      if (input.clientId) {
        await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`${req.userId}:person:${input.clientId}`]);
        const row = (await db.query('SELECT * FROM people WHERE owner_id=$1 AND client_id=$2', [req.userId, input.clientId])).rows[0];
        if (row) {
          person = row;
          existing = true;
          return;
        }
      }
      person = await insert('people', req.userId, input, personMap, db);
    });
    res.status(existing ? 200 : 201).json({
      person: await getPerson(person.id, req.userId)
    });
  }));
  router.get('/people/:id', wrap(async (req, res) => {
    uuid.parse(req.params.id);
    const person = await getPerson(req.params.id, req.userId);
    const encounters = (await query('SELECT * FROM encounters WHERE person_id=$1 AND owner_id=$2 ORDER BY occurred_at DESC', [req.params.id, req.userId])).rows;
    const commitments = (await query('SELECT c.*,p.name AS person_name,p.company FROM commitments c JOIN people p ON p.id=c.person_id WHERE c.person_id=$1 AND c.owner_id=$2 ORDER BY c.due_at NULLS LAST,c.created_at DESC', [req.params.id, req.userId])).rows;
    res.json({
      person,
      encounters: camel(encounters),
      commitments: camel(commitments)
    });
  }));
  router.patch('/people/:id', wrap(async (req, res) => {
    const input = patchInput(personSchema.omit({
      clientId: true
    }).partial(), req.body);
    for (const field of ['photoUrl', 'businessCardUrl', 'businessCardBackUrl']) {
      const match = input[field]?.match(/\/api\/v1\/(?:public\/)?media\/([a-f0-9-]{36})$/i);
      if (match) await owned('media_assets', match[1], req.userId);
    }
    await updateRow('people', req.params.id, req.userId, input, personMap);
    await query('UPDATE people SET updated_at=now() WHERE id=$1', [req.params.id]);
    res.json({
      person: await getPerson(req.params.id, req.userId)
    });
  }));
  router.delete('/people/:id', wrap(async (req, res) => {
    await owned('people', req.params.id, req.userId);
    await query('DELETE FROM people WHERE id=$1', [req.params.id]);
    res.sendStatus(204);
  }));
  router.post('/people/:id/encounters', wrap(async (req, res) => {
    const input = encounterSchema.parse(req.body);
    let repeated = false;
    const result = await transaction(async db => {
      await owned('people', req.params.id, req.userId, db);
      if (input.eventId) {
        const event = await owned('events', input.eventId, req.userId, db);
        input.eventName = input.eventName || event.name;
        input.city = input.city || event.city;
        input.countryCode = input.countryCode || event.country_code;
      }
      if (input.clientId) {
        await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`${req.userId}:encounter:${input.clientId}`]);
        const existing = (await db.query('SELECT * FROM encounters WHERE owner_id=$1 AND client_id=$2', [req.userId, input.clientId])).rows[0];
        if (existing) {
          if (existing.person_id !== req.params.id) fail(409, 'This offline request belongs to another person');
          repeated = true;
          return {
            encounter: existing,
            commitments: (await db.query('SELECT * FROM commitments WHERE encounter_id=$1', [existing.id])).rows
          };
        }
      }
      const encounter = await insert('encounters', req.userId, {
        ...input,
        personId: req.params.id
      }, {
        ...encounterMap,
        personId: 'person_id'
      }, db);
      const commitments = [];
      for (const c of input.commitments) commitments.push((await db.query('INSERT INTO commitments(owner_id,person_id,encounter_id,text,due_at) VALUES($1,$2,$3,$4,$5) RETURNING *', [req.userId, req.params.id, encounter.id, c.text, c.dueAt])).rows[0]);
      await db.query('UPDATE people SET updated_at=now() WHERE id=$1', [req.params.id]);
      return {
        encounter,
        commitments
      };
    });
    res.status(repeated ? 200 : 201).json(camel(result));
  }));
  router.get('/encounters', wrap(async (req, res) => {
    const {
      limit,
      offset
    } = pagination(req);
    const clauses = ['e.owner_id=$1'];
    const values = [req.userId];
    for (const [key, column, schema] of [['personId', 'person_id', uuid], ['eventId', 'event_id', uuid], ['city', 'city', text(100)]]) if (req.query[key]) {
      values.push(schema.parse(req.query[key]));
      clauses.push(`e.${column}=$${values.length}`);
    }
    for (const [key, op] of [['from', '>='], ['to', '<=']]) if (req.query[key]) {
      values.push(date.parse(req.query[key]));
      clauses.push(`e.occurred_at${op}$${values.length}`);
    }
    values.push(limit, offset);
    const rows = (await query(`SELECT e.*,p.name AS person_name,p.company,p.photo_url,count(*) OVER() AS total FROM encounters e JOIN people p ON p.id=e.person_id WHERE ${clauses.join(' AND ')} ORDER BY e.occurred_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values)).rows;
    res.json(listResponse('encounters', rows, limit, offset));
  }));
  router.patch('/encounters/:id', wrap(async (req, res) => {
    const input = patchInput(encounterSchema.omit({
      commitments: true,
      clientId: true
    }).partial(), req.body);
    if (input.eventId) await owned('events', input.eventId, req.userId);
    const row = await updateRow('encounters', req.params.id, req.userId, input, encounterMap);
    await query('UPDATE encounters SET updated_at=now() WHERE id=$1', [req.params.id]);
    res.json({
      encounter: camel(row)
    });
  }));
  router.delete('/encounters/:id', wrap(async (req, res) => {
    await owned('encounters', req.params.id, req.userId);
    await query('DELETE FROM encounters WHERE id=$1', [req.params.id]);
    res.sendStatus(204);
  }));
  router.get('/events', wrap(async (req, res) => {
    const {
      limit,
      offset
    } = pagination(req);
    const rows = (await query('SELECT ev.*,(SELECT count(*)::int FROM encounters e WHERE e.event_id=ev.id) AS encounter_count,(SELECT count(DISTINCT person_id)::int FROM encounters e WHERE e.event_id=ev.id) AS people_count,count(*) OVER() AS total FROM events ev WHERE owner_id=$1 ORDER BY starts_at DESC NULLS LAST LIMIT $2 OFFSET $3', [req.userId, limit, offset])).rows;
    res.json(listResponse('events', rows, limit, offset));
  }));
  router.post('/events', wrap(async (req, res) => {
    const input = eventSchema.parse(req.body);
    if (input.startsAt && input.endsAt && new Date(input.endsAt) < new Date(input.startsAt)) fail(400, 'Event end must follow its start');
    res.status(201).json({
      event: camel(await insert('events', req.userId, input, eventMap))
    });
  }));
  router.get('/events/:id', wrap(async (req, res) => {
    const event = await owned('events', req.params.id, req.userId);
    const encounters = (await query('SELECT e.*,p.name AS person_name,p.company,p.photo_url FROM encounters e JOIN people p ON p.id=e.person_id WHERE e.event_id=$1 AND e.owner_id=$2 ORDER BY occurred_at DESC', [event.id, req.userId])).rows;
    const people = (await query('SELECT DISTINCT p.* FROM people p JOIN encounters e ON e.person_id=p.id WHERE e.event_id=$1 AND p.owner_id=$2', [event.id, req.userId])).rows;
    res.json({
      event: {
        ...camel(event),
        peopleCount: people.length,
        encounterCount: encounters.length
      },
      people: camel(people),
      encounters: camel(encounters)
    });
  }));
  router.patch('/events/:id', wrap(async (req, res) => res.json({
    event: camel(await updateRow('events', req.params.id, req.userId, patchInput(eventSchema.partial(), req.body), eventMap))
  })));
  router.delete('/events/:id', wrap(async (req, res) => {
    await owned('events', req.params.id, req.userId);
    await query('DELETE FROM events WHERE id=$1', [req.params.id]);
    res.sendStatus(204);
  }));
  router.get('/commitments', wrap(async (req, res) => {
    const {
      limit,
      offset
    } = pagination(req);
    const status = req.query.status ? z.enum(['open', 'done', 'dismissed', 'all']).parse(req.query.status) : 'open';
    const personId = req.query.personId ? uuid.parse(req.query.personId) : null;
    const rows = (await query("SELECT c.*,p.name AS person_name,p.company,p.photo_url,count(*) OVER() AS total FROM commitments c JOIN people p ON p.id=c.person_id WHERE c.owner_id=$1 AND ($2='all' OR c.status=$2) AND ($3::uuid IS NULL OR c.person_id=$3) ORDER BY c.due_at NULLS LAST,c.created_at DESC LIMIT $4 OFFSET $5", [req.userId, status, personId, limit, offset])).rows;
    res.json(listResponse('commitments', rows, limit, offset));
  }));
  router.post('/commitments', wrap(async (req, res) => {
    const input = commitmentSchema.extend({
      personId: uuid,
      encounterId: uuid.optional()
    }).parse(req.body);
    await owned('people', input.personId, req.userId);
    if (input.encounterId) {
      const encounter = await owned('encounters', input.encounterId, req.userId);
      if (encounter.person_id !== input.personId) fail(400, 'Meeting belongs to another person');
    }
    const row = (await query('INSERT INTO commitments(owner_id,person_id,encounter_id,text,due_at) VALUES($1,$2,$3,$4,$5) RETURNING *', [req.userId, input.personId, input.encounterId, input.text, input.dueAt])).rows[0];
    res.status(201).json({
      commitment: camel(row)
    });
  }));
  router.patch('/commitments/:id', wrap(async (req, res) => {
    const input = commitmentSchema.partial().extend({
      status: z.enum(['open', 'done', 'dismissed']).optional()
    }).parse(req.body);
    const row = await updateRow('commitments', req.params.id, req.userId, input, {
      text: 'text',
      dueAt: 'due_at',
      status: 'status'
    });
    if (input.status !== undefined) await query("UPDATE commitments SET completed_at=CASE WHEN status='done' THEN now() ELSE NULL END WHERE id=$1", [row.id]);
    res.json({
      commitment: camel((await query('SELECT * FROM commitments WHERE id=$1', [row.id])).rows[0])
    });
  }));
  router.get('/need-offers', wrap(async (req, res) => {
    res.json({
      needOffers: camel((await query('SELECT * FROM need_offers WHERE owner_id=$1 ORDER BY created_at DESC', [req.userId])).rows)
    });
  }));
  router.post('/need-offers', wrap(async (req, res) => {
    const input = z.object({
      kind: z.enum(['need', 'offer']),
      text: text(1000).min(3)
    }).parse(req.body);
    res.status(201).json({
      needOffer: camel(await insert('need_offers', req.userId, input, {
        kind: 'kind',
        text: 'text'
      }))
    });
  }));
  router.patch('/need-offers/:id', wrap(async (req, res) => {
    const input = z.object({
      text: text(1000).min(3).optional(),
      active: z.boolean().optional()
    }).parse(req.body);
    res.json({
      needOffer: camel(await updateRow('need_offers', req.params.id, req.userId, input, {
        text: 'text',
        active: 'active'
      }))
    });
  }));
  router.delete('/need-offers/:id', wrap(async (req, res) => {
    await owned('need_offers', req.params.id, req.userId);
    await query('DELETE FROM need_offers WHERE id=$1', [req.params.id]);
    res.sendStatus(204);
  }));
  router.get('/feed', wrap(async (req, res) => res.json({
    items: await feedFor(req.userId)
  })));
  router.post('/search', wrap(async (req, res) => {
    const input = z.object({
      query: text(500).min(1),
      from: date.optional(),
      to: date.optional(),
      eventId: uuid.optional(),
      countryCode: text(8).optional()
    }).parse(req.body);
    res.json({
      query: input.query,
      mode: 'saved_evidence_search',
      results: await searchOwned(req.userId, input)
    });
  }));
  router.get('/me/home', wrap(async (req, res) => {
    const stats = (await query(`SELECT (SELECT count(*)::int FROM people WHERE owner_id=$1) AS people,(SELECT count(*)::int FROM encounters WHERE owner_id=$1) AS encounters,(SELECT count(*)::int FROM commitments WHERE owner_id=$1 AND status='open') AS open_commitments,(SELECT count(*)::int FROM commitments WHERE owner_id=$1 AND status='open' AND due_at<now()) AS overdue_commitments,(SELECT count(*)::int FROM leads l JOIN cards c ON c.id=l.card_id WHERE c.owner_id=$1 AND l.status='new') AS new_leads,(SELECT count(*)::int FROM cards WHERE owner_id=$1 AND is_published=true) AS published_cards`, [req.userId])).rows[0];
    const [commitments, recentPeople, upcomingEvents, leads, feed] = await Promise.all([query("SELECT c.*,p.name AS person_name,p.company,p.photo_url FROM commitments c JOIN people p ON p.id=c.person_id WHERE c.owner_id=$1 AND c.status='open' ORDER BY due_at NULLS LAST LIMIT 6", [req.userId]), query(`${peopleSelect} FROM people p WHERE owner_id=$1 ORDER BY updated_at DESC LIMIT 8`, [req.userId]), query("SELECT * FROM events WHERE owner_id=$1 AND COALESCE(ends_at,starts_at)>=now()-interval '1 day' ORDER BY starts_at LIMIT 5", [req.userId]), query("SELECT l.*,c.title AS card_title FROM leads l JOIN cards c ON c.id=l.card_id WHERE c.owner_id=$1 AND l.status='new' ORDER BY l.created_at DESC LIMIT 6", [req.userId]), feedFor(req.userId)]);
    res.json({
      profile: {
        fullName: req.user.display_name,
        ...req.user.profile
      },
      stats: camel(stats),
      commitments: camel(commitments.rows),
      recentPeople: camel(recentPeople.rows),
      upcomingEvents: camel(upcomingEvents.rows),
      leads: camel(leads.rows),
      feed
    });
  }));
  return router;
}
