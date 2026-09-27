import { Router } from 'express';
import { createHmac } from 'node:crypto';
import { z } from 'zod';
import { query, transaction } from './db.js';
import { auth, profileSchema } from './auth.js';
import { publicCardById, saveCard } from './cards.js';
import { wrap, fail, text, email, owned, hash, secretToken, rateLimit, publicOrigin, presentPublicCard } from './common.js';
async function lookup(token, db = {
  query
}) {
  const row = (await db.query('SELECT * FROM share_links WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at>now()', [hash(token)])).rows[0];
  if (!row) fail(404, 'This invitation is unavailable', 'SHARE_UNAVAILABLE');
  return row;
}
export function sharesRouter() {
  const router = Router();
  router.post('/exchanges', auth, wrap(async (req, res) => {
    const input = z.object({
      cardId: z.uuid(), clientId: text(120).min(8), name: text(120).min(2), phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
      note: text(3000).default(''), location: text(300).default(''), city: text(100).default(''),
      countryCode: text(8).default(''), eventName: text(200).default(''), occurredAt: z.iso.datetime({ offset: true }),
      latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(),
      potentialLead: z.boolean().default(false)
    }).parse(req.body);
    const token = createHmac('sha256', process.env.JWT_SECRET).update(`exchange:${req.userId}:${input.clientId}`).digest('hex');
    const result = await transaction(async db => {
      await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`exchange-client:${req.userId}:${input.clientId}`]);
      await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`exchange-phone:${req.userId}:${input.phone}`]);
      const prior = (await db.query('SELECT * FROM share_links WHERE owner_id=$1 AND client_id=$2', [req.userId, input.clientId])).rows[0];
      if (prior) return { personId: prior.person_id, encounterId: prior.encounter_id, shareId: prior.id };
      await owned('cards', input.cardId, req.userId, db);
      await publicCardById(input.cardId, db);
      let person = (await db.query('SELECT * FROM people WHERE owner_id=$1 AND phone=$2 ORDER BY created_at LIMIT 1', [req.userId, input.phone])).rows[0];
      if (!person) person = (await db.query(`INSERT INTO people(owner_id,name,phone,city,country_code,tags,client_id)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [req.userId, input.name, input.phone, input.city, input.countryCode, input.potentialLead ? ['Potential lead'] : [], input.clientId])).rows[0];
      else if (input.potentialLead) await db.query("UPDATE people SET tags=array(SELECT DISTINCT unnest(tags || ARRAY['Potential lead'])) WHERE id=$1", [person.id]);
      const meeting = (await db.query(`INSERT INTO encounters(owner_id,person_id,occurred_at,location,city,country_code,event_name,latitude,longitude,original_note,meeting_type,exchange_type,client_id)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'In person','Shared my card',$11) RETURNING id`,
      [req.userId, person.id, input.occurredAt, input.location, input.city, input.countryCode, input.eventName, input.latitude, input.longitude, input.note, input.clientId])).rows[0];
      const context = { occurredAt: input.occurredAt, location: input.location, city: input.city, countryCode: input.countryCode, eventName: input.eventName };
      const share = (await db.query(`INSERT INTO share_links(owner_id,card_id,token_hash,channel,recipient_draft,expires_at,client_id,person_id,encounter_id,meeting_context)
        VALUES($1,$2,$3,'whatsapp',$4,now()+interval '365 days',$5,$6,$7,$8) RETURNING id`,
      [req.userId, input.cardId, hash(token), { name: input.name, phone: input.phone }, input.clientId, person.id, meeting.id, context])).rows[0];
      return { personId: person.id, encounterId: meeting.id, shareId: share.id };
    });
    // Creating this record means a message is ready. WhatsApp does not report delivery to this app.
    res.status(201).json({ ...result, url: `${publicOrigin()}/s/${token}`, delivery: 'prepared' });
  }));
  router.post('/shares/:token/save', auth, wrap(async (req, res) => {
    const share = await lookup(req.params.token);
    if (share.owner_id === req.userId) fail(400, 'This is your own card.');
    const result = await transaction(async db => {
      const person = await saveCard(req.userId, share.card_id, db);
      // Only the verified recipient gets the sender-provided place/time. Forwarded links reveal no meeting context.
      const matched = req.user.phone_number && req.user.phone_number === share.recipient_draft?.phone;
      const c = matched ? share.meeting_context || {} : {};
      await db.query(`INSERT INTO encounters(owner_id,person_id,occurred_at,location,city,country_code,event_name,meeting_type,exchange_type,client_id)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,'Received their card',$9) ON CONFLICT(owner_id,client_id) DO NOTHING`,
      [req.userId, person.id, c.occurredAt || new Date().toISOString(), c.location || '', c.city || '', c.countryCode || '', c.eventName || '', matched ? 'In person' : 'Card saved', `share:${share.id}`]);
      return person;
    });
    res.json({ person: result });
  }));
  router.post('/cards/:id/shares', auth, wrap(async (req, res) => {
    await owned('cards', req.params.id, req.userId);
    await publicCardById(req.params.id);
    const input = z.object({
      channel: z.enum(['whatsapp', 'qr', 'link']).default('link'),
      recipientDraft: z.object({
        name: text(120).min(2),
        email: email.optional(),
        phone: text(40).optional(),
        company: text(160).optional(),
        role: text(120).optional()
      }).optional()
    }).parse(req.body);
    const token = secretToken();
    const row = (await query("INSERT INTO share_links(owner_id,card_id,token_hash,channel,recipient_draft,recipient_email,expires_at) VALUES($1,$2,$3,$4,$5,$6,now()+interval '30 days') RETURNING id", [req.userId, req.params.id, hash(token), input.channel, input.recipientDraft || null, input.recipientDraft?.email || null])).rows[0];
    res.status(201).json({
      shareId: row.id,
      token,
      url: `${publicOrigin()}/s/${token}`
    });
  }));
  router.get('/public/shares/:token', wrap(async (req, res) => {
    const share = await lookup(req.params.token);
    const published = await publicCardById(share.card_id);
    res.json({
      card: presentPublicCard(published.snapshot, req),
      claimAvailable: Boolean(share.recipient_email && !share.claimed_at)
    });
  }));
  const limiter = rateLimit({
    max: 12,
    windowMs: 15 * 60 * 1000
  });
  router.post('/public/shares/:token/claim/start', limiter, wrap(async (req, res) => {
    const input = z.object({
      email
    }).parse(req.body);
    const share = await lookup(req.params.token);
    if (process.env.LOCAL_OUTBOX !== 'true') fail(503, 'Verification delivery is not configured', 'DELIVERY_UNAVAILABLE');
    if (share.recipient_email === input.email && !share.claimed_at) {
      const token = secretToken();
      await transaction(async db => {
        await db.query("INSERT INTO verification_challenges(share_id,email,token_hash,expires_at) VALUES($1,$2,$3,now()+interval '20 minutes')", [share.id, input.email, hash(token)]);
        await db.query('INSERT INTO local_outbox(recipient,subject,payload) VALUES($1,$2,$3)', [input.email, 'Verify your DUIT invitation', {
          type: 'claim_verification',
          shareId: share.id,
          verificationToken: token,
          verificationUrl: `${publicOrigin()}/s/${req.params.token}?verify=${token}`,
          notice: 'LOCAL PILOT OUTBOX — no email has been sent. The operator can privately provide this verification link to the invited tester.'
        }]);
      });
    }
    res.json({
      delivery: 'local_outbox',
      message: 'If this email matches the invitation, a verification link is available in the private pilot outbox. No email has been sent.'
    });
  }));
  router.post('/public/shares/:token/claim/verify', limiter, wrap(async (req, res) => {
    const input = z.object({
      verificationToken: z.string().min(20).max(200)
    }).parse(req.body);
    const result = await transaction(async db => {
      const share = await lookup(req.params.token, db);
      if (share.claimed_at) fail(409, 'This invitation has already been claimed', 'ALREADY_CLAIMED');
      const challenge = (await db.query('SELECT * FROM verification_challenges WHERE share_id=$1 AND token_hash=$2 FOR UPDATE', [share.id, hash(input.verificationToken)])).rows[0];
      if (!challenge || challenge.consumed_at || new Date(challenge.expires_at) <= new Date()) fail(400, 'Verification link expired or unavailable', 'INVALID_VERIFICATION');
      await db.query('UPDATE verification_challenges SET consumed_at=now() WHERE id=$1', [challenge.id]);
      const token = secretToken();
      await db.query("INSERT INTO claim_proofs(share_id,email,token_hash,expires_at) VALUES($1,$2,$3,now()+interval '20 minutes')", [share.id, challenge.email, hash(token)]);
      return {
        claimToken: token,
        draft: share.recipient_draft
      };
    });
    res.json(result);
  }));
  router.post('/claims/accept', auth, wrap(async (req, res) => {
    const input = z.object({
      claimToken: z.string().min(20).max(200),
      profile: profileSchema.extend({
        fullName: text(120).min(2)
      })
    }).parse(req.body);
    const result = await transaction(async db => {
      const proof = (await db.query('SELECT * FROM claim_proofs WHERE token_hash=$1 FOR UPDATE', [hash(input.claimToken)])).rows[0];
      if (!proof || proof.consumed_at || new Date(proof.expires_at) <= new Date()) fail(400, 'Claim expired or unavailable', 'INVALID_CLAIM');
      if (proof.email !== req.user.email) fail(403, 'Sign in with the verified invitation email', 'EMAIL_MISMATCH');
      const share = (await db.query('SELECT * FROM share_links WHERE id=$1 FOR UPDATE', [proof.share_id])).rows[0];
      if (share.claimed_at || share.revoked_at || new Date(share.expires_at) <= new Date()) fail(409, 'This invitation is unavailable', 'ALREADY_CLAIMED');
      await db.query('UPDATE claim_proofs SET consumed_at=now() WHERE id=$1', [proof.id]);
      await db.query('UPDATE share_links SET claimed_by=$1,claimed_at=now() WHERE id=$2', [req.userId, share.id]);
      const user = (await db.query("UPDATE users SET profile=profile || $1::jsonb,display_name=$2,verified_at=COALESCE(verified_at,now()),onboarding_completed=true,updated_at=now() WHERE id=$3 RETURNING *", [JSON.stringify(input.profile), input.profile.fullName, req.userId])).rows[0];
      return {
        profile: {
          fullName: user.display_name,
          ...user.profile
        },
        person: await saveCard(req.userId, share.card_id, db)
      };
    });
    res.json(result);
  }));
  return router;
}
