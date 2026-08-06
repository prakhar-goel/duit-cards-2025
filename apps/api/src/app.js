import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { query } from "./db.js";
import { draftPitch, encounterInsight, onboardingAi } from "./ai.js";

const jwtSecret = process.env.JWT_SECRET ?? "dev-only-change-me";
const cardTypes = ["hook", "relevance", "offer", "outcome", "proof", "cta"];
const ctaTypes = ["whatsapp", "call", "email", "book", "enquire", "share_requirement"];
const email = z.string().trim().email().max(254);

const signupSchema = z.object({ email, password: z.string().min(8).max(128), onboardingProfile: z.record(z.string(), z.unknown()).optional() });
const cardSchema = z.object({ slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{3,80}$/), title: z.string().trim().min(2).max(120), subtitle: z.string().trim().max(280).default(""), imageUrl: z.string().url().optional().nullable(), contact: z.object({ email: email.optional(), phone: z.string().trim().max(40).optional(), website: z.string().url().optional() }).default({}), links: z.array(z.object({ label: z.string().trim().min(1).max(40), url: z.string().url() })).max(8).default([]), ctaType: z.enum(ctaTypes).default("enquire"), ctaLabel: z.string().trim().min(1).max(80).default("Get in touch") });
const personSchema = z.object({ name: z.string().trim().min(2).max(120), role: z.string().trim().max(120).default(""), company: z.string().trim().max(120).default(""), email: email.optional().nullable(), phone: z.string().trim().max(40).optional().nullable(), photoUrl: z.string().url().optional().nullable(), tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]) });
const encounterSchema = z.object({ occurredAt: z.string().datetime().optional(), location: z.string().trim().max(180).optional(), eventName: z.string().trim().max(180).optional(), meetingType: z.enum(["Conference", "Coffee", "Office", "Dinner", "Call"]).default("Conference"), exchangeType: z.enum(["Shared my card", "Received their card", "Both exchanged cards"]).default("Both exchanged cards"), originalNote: z.string().trim().max(5000).default(""), commitments: z.array(z.object({ text: z.string().trim().min(1).max(500), dueAt: z.string().datetime().optional() })).max(20).default([]) });

function token(user) { return jwt.sign({ sub: user.id, email: user.email }, jwtSecret, { expiresIn: "7d" }); }
function auth(req, res, next) {
  const value = req.headers.authorization;
  if (!value?.startsWith("Bearer ")) return res.status(401).json({ error: { message: "Authentication required" } });
  try { req.user = jwt.verify(value.slice(7), jwtSecret); return next(); } catch { return res.status(401).json({ error: { message: "Invalid or expired token" } }); }
}
function parse(schema, body) { return schema.parse(body); }
function asyncRoute(handler) { return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next); }
function userDto(row) { return { id: row.id, email: row.email, onboardingCompleted: row.onboarding_completed }; }
function cardDto(row, panels = undefined) { return { id: row.id, slug: row.slug, title: row.title, subtitle: row.subtitle, imageUrl: row.image_url, contact: row.contact, links: row.links, ctaType: row.cta_type, ctaLabel: row.cta_label, isPublished: row.is_published, publishedAt: row.published_at, ...(panels ? { panels } : {}) }; }
function personDto(row) { return { id: row.id, name: row.name, role: row.role, company: row.company, email: row.email, phone: row.phone, photoUrl: row.photo_url, tags: row.tags, createdAt: row.created_at, updatedAt: row.updated_at }; }
async function ownedCard(id, ownerId) { const result = await query("SELECT * FROM cards WHERE id = $1 AND owner_id = $2", [id, ownerId]); return result.rows[0]; }
async function cardWithPanels(card) { const panels = await query("SELECT id, panel_type AS \"panelType\", body, position, provenance, approved FROM pitch_panels WHERE card_id = $1 ORDER BY position", [card.id]); return cardDto(card, panels.rows); }

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use((req, res, next) => { res.setHeader("Access-Control-Allow-Origin", process.env.APP_ORIGIN ?? "*"); res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS"); if (req.method === "OPTIONS") return res.sendStatus(204); next(); });
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.post("/api/v1/onboarding/ai-step", asyncRoute(async (req, res) => {
    const body = parse(z.object({ step: z.enum(["followup", "plan"]), answers: z.record(z.string(), z.unknown()).default({}) }), req.body);
    res.json(onboardingAi(body));
  }));
  app.post("/api/v1/auth/signup", asyncRoute(async (req, res) => {
    const input = parse(signupSchema, req.body);
    const existing = await query("SELECT id FROM users WHERE email = $1", [input.email.toLowerCase()]);
    if (existing.rowCount) return res.status(409).json({ error: { message: "An account already exists for this email" } });
    const passwordHash = await bcrypt.hash(input.password, 12);
    const result = await query("INSERT INTO users (email, password_hash, onboarding_profile, onboarding_completed) VALUES ($1, $2, $3, $4) RETURNING *", [input.email.toLowerCase(), passwordHash, input.onboardingProfile ?? null, Boolean(input.onboardingProfile)]);
    const user = userDto(result.rows[0]); const accessToken = token(user);
    res.status(201).json({ user, accessToken, refreshToken: accessToken });
  }));
  app.post("/api/v1/auth/login", asyncRoute(async (req, res) => {
    const input = parse(z.object({ email, password: z.string().min(1).max(128) }), req.body);
    const result = await query("SELECT * FROM users WHERE email = $1", [input.email.toLowerCase()]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(input.password, user.password_hash))) return res.status(401).json({ error: { message: "Invalid email or password" } });
    const dto = userDto(user); const accessToken = token(dto); res.json({ user: dto, accessToken, refreshToken: accessToken });
  }));
  app.get("/api/v1/me", auth, asyncRoute(async (req, res) => { const result = await query("SELECT * FROM users WHERE id = $1", [req.user.sub]); if (!result.rowCount) return res.sendStatus(401); res.json({ user: userDto(result.rows[0]) }); }));

  app.post("/api/v1/pitches/draft", auth, asyncRoute(async (req, res) => { const input = parse(z.object({ ownerName: z.string().max(120).optional(), company: z.string().max(120).optional(), audience: z.string().max(300).optional(), problem: z.string().max(600).optional(), offer: z.string().max(600).optional(), proof: z.string().max(600).optional(), desiredAction: z.string().max(160).optional() }), req.body); res.json({ panels: draftPitch(input) }); }));
  app.post("/api/v1/cards", auth, asyncRoute(async (req, res) => {
    const input = parse(cardSchema, req.body);
    const result = await query("INSERT INTO cards (owner_id, slug, title, subtitle, image_url, contact, links, cta_type, cta_label) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *", [req.user.sub, input.slug, input.title, input.subtitle, input.imageUrl ?? null, input.contact, input.links, input.ctaType, input.ctaLabel]);
    res.status(201).json({ card: cardDto(result.rows[0], []) });
  }));
  app.get("/api/v1/cards", auth, asyncRoute(async (req, res) => { const result = await query("SELECT * FROM cards WHERE owner_id = $1 ORDER BY created_at DESC", [req.user.sub]); res.json({ cards: result.rows.map((row) => cardDto(row)) }); }));
  app.get("/api/v1/cards/:cardId", auth, asyncRoute(async (req, res) => { const card = await ownedCard(req.params.cardId, req.user.sub); if (!card) return res.sendStatus(404); res.json({ card: await cardWithPanels(card) }); }));
  app.patch("/api/v1/cards/:cardId", auth, asyncRoute(async (req, res) => { const card = await ownedCard(req.params.cardId, req.user.sub); if (!card) return res.sendStatus(404); const input = parse(cardSchema.partial(), req.body); const result = await query("UPDATE cards SET slug = COALESCE($1,slug), title = COALESCE($2,title), subtitle = COALESCE($3,subtitle), image_url = COALESCE($4,image_url), contact = COALESCE($5,contact), links = COALESCE($6,links), cta_type = COALESCE($7,cta_type), cta_label = COALESCE($8,cta_label), updated_at = now() WHERE id = $9 RETURNING *", [input.slug, input.title, input.subtitle, input.imageUrl, input.contact, input.links, input.ctaType, input.ctaLabel, card.id]); res.json({ card: await cardWithPanels(result.rows[0]) }); }));
  app.post("/api/v1/cards/:cardId/panels", auth, asyncRoute(async (req, res) => {
    const card = await ownedCard(req.params.cardId, req.user.sub); if (!card) return res.sendStatus(404);
    const input = parse(z.object({ panels: z.array(z.object({ panelType: z.enum(cardTypes), body: z.string().trim().min(1).max(800), position: z.number().int().min(0).max(5), provenance: z.enum(["owner", "ai_suggested", "approved_ai"]).default("owner"), approved: z.boolean().default(false) })).length(6) }), req.body);
    await query("DELETE FROM pitch_panels WHERE card_id = $1", [card.id]);
    for (const panel of input.panels) await query("INSERT INTO pitch_panels (card_id,panel_type,body,position,provenance,approved) VALUES ($1,$2,$3,$4,$5,$6)", [card.id, panel.panelType, panel.body, panel.position, panel.provenance, panel.approved]);
    res.json({ card: await cardWithPanels(card) });
  }));
  app.post("/api/v1/cards/:cardId/publish", auth, asyncRoute(async (req, res) => { const card = await ownedCard(req.params.cardId, req.user.sub); if (!card) return res.sendStatus(404); const panels = await query("SELECT approved FROM pitch_panels WHERE card_id = $1", [card.id]); if (panels.rowCount !== 6 || panels.rows.some((p) => !p.approved)) return res.status(422).json({ error: { message: "Approve all six pitch panels before publishing" } }); const result = await query("UPDATE cards SET is_published = true, published_at = now(), updated_at = now() WHERE id = $1 RETURNING *", [card.id]); res.json({ card: await cardWithPanels(result.rows[0]) }); }));
  app.get("/api/v1/public/cards/:slug", asyncRoute(async (req, res) => { const result = await query("SELECT * FROM cards WHERE slug = $1 AND is_published = true", [req.params.slug]); const card = result.rows[0]; if (!card) return res.sendStatus(404); await query("INSERT INTO card_events (card_id,event_type,source) VALUES ($1,'viewed',$2)", [card.id, req.query.source ?? null]); res.json({ card: await cardWithPanels(card) }); }));
  app.post("/api/v1/public/cards/:slug/cta", asyncRoute(async (req, res) => { const result = await query("SELECT id FROM cards WHERE slug = $1 AND is_published = true", [req.params.slug]); if (!result.rowCount) return res.sendStatus(404); await query("INSERT INTO card_events (card_id,event_type,source) VALUES ($1,'cta_opened',$2)", [result.rows[0].id, req.body?.source ?? null]); res.sendStatus(204); }));
  app.post("/api/v1/public/cards/:slug/leads", asyncRoute(async (req, res) => { const input = parse(z.object({ name: z.string().trim().min(1).max(120).optional(), email: email.optional(), phone: z.string().trim().max(40).optional(), intent: z.string().trim().max(500).optional(), consent: z.literal(true), source: z.string().trim().max(120).optional(), ctaContext: z.string().trim().max(120).optional() }), req.body); const result = await query("SELECT id FROM cards WHERE slug = $1 AND is_published = true", [req.params.slug]); if (!result.rowCount) return res.sendStatus(404); const lead = await query("INSERT INTO leads (card_id,name,email,phone,intent,consent,source,cta_context) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *", [result.rows[0].id,input.name ?? null,input.email ?? null,input.phone ?? null,input.intent ?? null,input.consent,input.source ?? null,input.ctaContext ?? null]); await query("INSERT INTO card_events (card_id,event_type,source) VALUES ($1,'lead_submitted',$2)", [result.rows[0].id,input.source ?? null]); res.status(201).json({ lead: lead.rows[0] }); }));
  app.get("/api/v1/leads", auth, asyncRoute(async (req, res) => { const result = await query("SELECT l.* FROM leads l JOIN cards c ON c.id = l.card_id WHERE c.owner_id = $1 ORDER BY l.created_at DESC", [req.user.sub]); res.json({ leads: result.rows }); }));

  app.post("/api/v1/people", auth, asyncRoute(async (req, res) => { const input = parse(personSchema, req.body); const result = await query("INSERT INTO people (owner_id,name,role,company,email,phone,photo_url,tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *", [req.user.sub,input.name,input.role,input.company,input.email ?? null,input.phone ?? null,input.photoUrl ?? null,input.tags]); res.status(201).json({ person: personDto(result.rows[0]) }); }));
  app.get("/api/v1/people", auth, asyncRoute(async (req, res) => { const search = String(req.query.search ?? "").trim(); const result = await query("SELECT * FROM people WHERE owner_id = $1 AND ($2 = '' OR name ILIKE '%' || $2 || '%' OR company ILIKE '%' || $2 || '%' OR array_to_string(tags, ' ') ILIKE '%' || $2 || '%') ORDER BY updated_at DESC", [req.user.sub,search]); res.json({ people: result.rows.map(personDto) }); }));
  app.post("/api/v1/people/:personId/encounters", auth, asyncRoute(async (req, res) => { const person = await query("SELECT * FROM people WHERE id = $1 AND owner_id = $2", [req.params.personId,req.user.sub]); if (!person.rowCount) return res.sendStatus(404); const input = parse(encounterSchema, req.body); const insight = encounterInsight(input.originalNote, person.rows[0].name); const created = await query("INSERT INTO encounters (person_id,owner_id,occurred_at,location,event_name,meeting_type,exchange_type,original_note,recap,relevance,proposed_follow_up) VALUES ($1,$2,COALESCE($3,now()),$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *", [req.params.personId,req.user.sub,input.occurredAt ?? null,input.location ?? null,input.eventName ?? null,input.meetingType,input.exchangeType,input.originalNote,insight.recap,insight.relevance,insight.proposedFollowUp]); for (const item of input.commitments) await query("INSERT INTO commitments (encounter_id,person_id,owner_id,text,due_at) VALUES ($1,$2,$3,$4,$5)", [created.rows[0].id,req.params.personId,req.user.sub,item.text,item.dueAt ?? null]); await query("UPDATE people SET updated_at = now() WHERE id = $1", [req.params.personId]); res.status(201).json({ encounter: created.rows[0], insight }); }));
  app.get("/api/v1/people/:personId", auth, asyncRoute(async (req, res) => { const person = await query("SELECT * FROM people WHERE id = $1 AND owner_id = $2", [req.params.personId,req.user.sub]); if (!person.rowCount) return res.sendStatus(404); const encounters = await query("SELECT * FROM encounters WHERE person_id = $1 ORDER BY occurred_at DESC", [req.params.personId]); const commitments = await query("SELECT * FROM commitments WHERE person_id = $1 ORDER BY due_at NULLS LAST, created_at DESC", [req.params.personId]); res.json({ person: personDto(person.rows[0]), encounters: encounters.rows, commitments: commitments.rows }); }));
  app.post("/api/v1/need-offers", auth, asyncRoute(async (req, res) => { const input = parse(z.object({ kind: z.enum(["need","offer"]), text: z.string().trim().min(3).max(500) }), req.body); const result = await query("INSERT INTO need_offers (owner_id,kind,text) VALUES ($1,$2,$3) RETURNING *", [req.user.sub,input.kind,input.text]); res.status(201).json({ needOffer: result.rows[0] }); }));
  app.get("/api/v1/feed", auth, asyncRoute(async (req, res) => { const commitments = await query("SELECT c.*, p.name, p.company FROM commitments c JOIN people p ON p.id = c.person_id WHERE c.owner_id = $1 AND c.status = 'open' ORDER BY c.due_at NULLS LAST LIMIT 25", [req.user.sub]); const needs = await query("SELECT * FROM need_offers WHERE owner_id = $1 AND active = true ORDER BY created_at DESC LIMIT 5", [req.user.sub]); const recommendations = []; for (const item of needs.rows) { const matches = await query("SELECT p.*, e.recap, e.relevance FROM people p LEFT JOIN LATERAL (SELECT recap,relevance FROM encounters WHERE person_id = p.id ORDER BY occurred_at DESC LIMIT 1) e ON true WHERE p.owner_id = $1 AND (p.name || ' ' || p.company || ' ' || array_to_string(p.tags,' ') || ' ' || COALESCE(e.recap,'') || ' ' || COALESCE(e.relevance,'')) ILIKE '%' || $2 || '%' LIMIT 10", [req.user.sub,item.text]); recommendations.push(...matches.rows.map((person) => ({ type: "relevant_person", person: personDto(person), reason: `Matches your ${item.kind}: ${item.text}`, evidence: person.relevance ?? person.recap ?? "Profile and encounter context" }))); } res.json({ items: [ ...commitments.rows.map((item) => ({ type: "due_commitment", commitment: item, reason: item.due_at && new Date(item.due_at) <= new Date() ? "Follow-up is due" : "Open commitment", evidence: item.text })), ...recommendations ] }); }));

  app.use((err, _req, res, _next) => { if (err instanceof z.ZodError) return res.status(400).json({ error: { message: "Invalid request", details: err.issues } }); if (err?.code === "23505") return res.status(409).json({ error: { message: "That value is already in use" } }); console.error(err); return res.status(500).json({ error: { message: "Internal server error" } }); });
  return app;
}
