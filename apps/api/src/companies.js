import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { query, transaction } from "./db.js";
import { mediaBytes } from "./media.js";
import { auth, admin } from "./auth.js";
import {
  wrap,
  fail,
  uuid,
  text,
  email,
  httpUrl,
  camel,
  audit,
  secretToken,
  apiOrigin,
  hash,
} from "./common.js";
const optionalUrl = httpUrl.or(z.literal("")).default("");
const companySchema = z.object({
  name: text(120).min(2),
  description: text(2000).default(""),
  website: optionalUrl,
  logoUrl: optionalUrl,
  address: text(300).default(""),
  industry: text(100).default(""),
});
const personSchema = z.object({
  name: text(120).min(2),
  phone: z
    .string()
    .regex(
      /^\+[1-9]\d{7,14}$/,
      "Use a phone number with country code, such as +919876543210",
    ),
  email: email.or(z.literal("")).default(""),
  title: text(120).default(""),
  department: text(100).default(""),
  bio: text(2000).default(""),
  photoUrl: optionalUrl,
  businessCardUrl: optionalUrl,
  role: z.enum(["owner", "manager", "member"]).default("member"),
});
function memberDto(row) {
  const result = camel(row);
  if (mediaId(result.profile?.photoUrl))
    result.profile = {
      ...result.profile,
      photoUrl: `/api/v1/business/members/${result.id}/photo`,
    };
  return result;
}
const mediaId = (value) =>
  value?.match(/\/api\/v1\/(?:public\/)?media\/([a-f0-9-]{36})$/i)?.[1];
async function validateImage(value, ownerId, db) {
  const id = mediaId(value);
  if (!id) return null;
  const row = (
    await db.query(
      "SELECT * FROM media_assets WHERE id=$1 AND owner_id=$2 AND mime_type LIKE 'image/%'",
      [id, ownerId],
    )
  ).rows[0];
  if (!row)
    fail(
      400,
      "Choose an image uploaded by the person preparing this invitation",
    );
  return row;
}
async function copyImage(value, fromOwner, toOwner, db) {
  const row = await validateImage(value, fromOwner, db);
  if (!row) return value || null;
  const id = crypto.randomUUID();
  await db.query(
    `INSERT INTO media_assets(id,owner_id,filename,mime_type,size_bytes,storage_path,sha256,purpose)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      id,
      toOwner,
      row.filename,
      row.mime_type,
      row.size_bytes,
      row.storage_path.startsWith("database:")
        ? "database:" + id
        : row.storage_path,
      row.sha256,
      row.purpose,
    ],
  );
  await db.query(
    "INSERT INTO media_blobs(media_id,bytes) SELECT $1,bytes FROM media_blobs WHERE media_id=$2",
    [id, row.id],
  );
  return `${apiOrigin()}/api/v1/media/${id}`;
}
// A company permission never grants access to an employee's personal wallet or notes.
async function access(req, id, db = { query }) {
  uuid.parse(id);
  const company = (await db.query("SELECT * FROM companies WHERE id=$1", [id]))
    .rows[0];
  if (!company) fail(404, "Company not found");
  if (req.user.role === "admin") return { company, role: "owner" };
  const member = (
    await db.query(
      "SELECT * FROM company_members WHERE company_id=$1 AND user_id=$2 AND status='active'",
      [id, req.userId],
    )
  ).rows[0];
  if (!member) fail(404, "Company not found");
  return { company, role: member.role, member };
}
async function manage(req, id, db) {
  const a = await access(req, id, db);
  if (!["owner", "manager"].includes(a.role))
    fail(403, "Only company owners and managers can manage the team");
  return a;
}
export function companiesRouter() {
  const r = Router();
  r.use("/business", auth);
  r.get(
    "/business/members/:id/photo",
    wrap(async (req, res) => {
      uuid.parse(req.params.id);
      const m = (
        await query("SELECT * FROM company_members WHERE id=$1", [
          req.params.id,
        ])
      ).rows[0];
      if (!m) fail(404, "Person not found");
      if (req.user.role !== "admin") {
        if (!m.company_id) fail(404, "Person not found");
        const a = await access(req, m.company_id);
        if (a.role === "member" && m.user_id !== req.userId)
          fail(404, "Person not found");
      }
      const id = mediaId(m.profile.photoUrl);
      const row = id
        ? (
            await query(
              "SELECT * FROM media_assets WHERE id=$1 AND owner_id=ANY($2::uuid[]) AND mime_type LIKE 'image/%'",
              [id, [m.created_by, m.user_id].filter(Boolean)],
            )
          ).rows[0]
        : null;
      if (!row) fail(404, "Uploaded photo not found");
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.type(row.mime_type).send(await mediaBytes(row));
    }),
  );
  r.get(
    "/business/accounts",
    admin,
    wrap(async (req, res) => {
      const search = text(100).parse(req.query.search || "");
      if (search.length < 2) return res.json({ accounts: [] });
      const rows = (
        await query(
          `SELECT u.id,u.display_name,u.email,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('id',c.id,'title',c.title)) FROM cards c WHERE c.owner_id=u.id AND c.company_id IS NULL),'[]') AS cards
      FROM users u WHERE u.status='active' AND u.data_origin!='archived_private' AND (u.display_name||' '||u.email) ILIKE $1 ORDER BY u.display_name LIMIT 12`,
          ["%" + search + "%"],
        )
      ).rows;
      res.json({ accounts: camel(rows) });
    }),
  );
  r.get(
    "/business/companies",
    wrap(async (req, res) => {
      const rows = (
        await query(
          `SELECT c.*, ${req.user.role === "admin" ? "'owner'::text" : "m.role"} AS my_role,
      (SELECT count(*)::int FROM company_members m WHERE m.company_id=c.id) AS members,
      (SELECT count(*)::int FROM cards d WHERE d.company_id=c.id) AS cards
      FROM companies c ${req.user.role === "admin" ? "" : "JOIN company_members m ON m.company_id=c.id AND m.user_id=$1 AND m.status='active'"}
      ORDER BY c.created_at DESC`,
          req.user.role === "admin" ? [] : [req.userId],
        )
      ).rows;
      res.json({ companies: camel(rows) });
    }),
  );
  r.post(
    "/business/companies",
    admin,
    wrap(async (req, res) => {
      const c = companySchema.parse(req.body);
      const company = await transaction(async (db) => {
        const row = (
          await db.query(
            "INSERT INTO companies(name,description,website,logo_url,address,industry,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
            [
              c.name,
              c.description,
              c.website,
              c.logoUrl,
              c.address,
              c.industry,
              req.userId,
            ],
          )
        ).rows[0];
        await audit(req.userId, "company.created", "company", row.id, {}, db);
        return row;
      });
      res.status(201).json({ company: camel(company) });
    }),
  );
  r.get(
    "/business/companies/:id",
    wrap(async (req, res) => {
      const a = await access(req, req.params.id);
      const manager = ["owner", "manager"].includes(a.role);
      const members = (
        await query(
          `SELECT m.id,m.name,m.title,m.department,m.role,m.status,m.profile,m.user_id,
      count(c.id)::int AS cards,count(c.id) FILTER(WHERE c.is_published)::int AS live_cards
      FROM company_members m LEFT JOIN cards c ON c.company_member_id=m.id WHERE m.company_id=$1
      AND ($2::boolean OR m.user_id=$3) GROUP BY m.id ORDER BY m.created_at`,
          [req.params.id, manager, req.userId],
        )
      ).rows;
      const cards = (
        await query(
          `SELECT c.id,c.title,c.role,c.slug,c.image_url,c.is_published,c.company_member_id,
      (SELECT count(*)::int FROM card_events e WHERE e.card_id=c.id AND e.event_type='viewed') AS views,
      (SELECT count(*)::int FROM leads l WHERE l.card_id=c.id) AS leads
      FROM cards c WHERE c.company_id=$1 AND ($2::boolean OR c.owner_id=$3) ORDER BY c.updated_at DESC`,
          [req.params.id, manager, req.userId],
        )
      ).rows;
      const leads = (
        await query(
          `SELECT l.*,c.title AS card_title,c.company_member_id FROM leads l JOIN cards c ON c.id=l.card_id
      WHERE c.company_id=$1 AND ($2::boolean OR c.owner_id=$3 OR l.assigned_member_id=$4) ORDER BY l.created_at DESC LIMIT 200`,
          [req.params.id, manager, req.userId, a.member?.id || null],
        )
      ).rows;
      const totals = (
        await query(
          `SELECT count(*)::int AS enquiries,count(*) FILTER(WHERE l.status='new')::int AS new_enquiries
        FROM leads l JOIN cards c ON c.id=l.card_id WHERE c.company_id=$1
        AND ($2::boolean OR c.owner_id=$3 OR l.assigned_member_id=$4)`,
          [req.params.id, manager, req.userId, a.member?.id || null],
        )
      ).rows[0];
      res.json({
        totals: camel(totals),
        company: camel(a.company),
        myRole: a.role,
        members: members.map(memberDto),
        cards: camel(cards).map((c) =>
          mediaId(c.imageUrl)
            ? {
                ...c,
                imageUrl: `/api/v1/business/members/${c.companyMemberId}/photo`,
              }
            : c,
        ),
        leads: camel(leads),
      });
    }),
  );
  r.patch(
    "/business/companies/:id",
    wrap(async (req, res) => {
      const c = companySchema.parse(req.body);
      const company = await transaction(async (db) => {
        await manage(req, req.params.id, db);
        const row = (
          await db.query(
            "UPDATE companies SET name=$2,description=$3,website=$4,logo_url=$5,address=$6,industry=$7,updated_at=now() WHERE id=$1 RETURNING *",
            [
              req.params.id,
              c.name,
              c.description,
              c.website,
              c.logoUrl,
              c.address,
              c.industry,
            ],
          )
        ).rows[0];
        await audit(req.userId, "company.updated", "company", row.id, {}, db);
        return row;
      });
      res.json({ company: camel(company) });
    }),
  );
  r.post(
    "/business/onboarding",
    wrap(async (req, res) => {
      const p = personSchema.parse(req.body);
      const companyId = req.body.companyId
        ? uuid.parse(req.body.companyId)
        : null;
      const result = await transaction(async (db) => {
        await validateImage(p.photoUrl, req.userId, db);
        await validateImage(p.businessCardUrl, req.userId, db);
        if (companyId) {
          const a = await manage(req, companyId, db);
          if (p.role !== "member" && a.role !== "owner")
            fail(403, "Only the company owner can appoint managers or owners");
        } else if (req.user.role !== "admin")
          fail(403, "Platform admin access required");
        const token = secretToken();
        const member = (
          await db.query(
            `INSERT INTO company_members(company_id,name,phone,email,title,department,role,profile,created_by,invite_hash,invite_expires_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now()+interval '7 days') RETURNING id,name,status`,
            [
              companyId,
              p.name,
              p.phone,
              p.email,
              p.title,
              p.department,
              companyId ? p.role : "member",
              p,
              req.userId,
              hash(token),
            ],
          )
        ).rows[0];
        await audit(
          req.userId,
          "onboarding.created",
          "company_member",
          member.id,
          {},
          db,
        );
        return {
          member: camel(member),
          invitationCode: token,
          expiresInDays: 7,
        };
      });
      res.status(201).json(result);
    }),
  );
  r.get(
    "/business/onboarding",
    admin,
    wrap(async (_req, res) => {
      const rows = (
        await query(`SELECT m.id,m.name,m.title,m.phone,m.email,m.status,m.created_at,m.company_id,c.name AS company_name,m.profile
      FROM company_members m LEFT JOIN companies c ON c.id=m.company_id ORDER BY m.created_at DESC LIMIT 200`)
      ).rows;
      res.json({ people: rows.map(memberDto) });
    }),
  );
  r.post(
    "/business/members/:id/invitation",
    wrap(async (req, res) => {
      uuid.parse(req.params.id);
      const result = await transaction(async (db) => {
        const m = (
          await db.query(
            "SELECT * FROM company_members WHERE id=$1 FOR UPDATE",
            [req.params.id],
          )
        ).rows[0];
        if (!m) fail(404, "Person not found");
        if (m.company_id) await manage(req, m.company_id, db);
        else if (req.user.role !== "admin") fail(403, "Admin access required");
        if (m.status !== "pending")
          fail(409, "This invitation has already been accepted");
        const token = secretToken();
        await db.query(
          "UPDATE company_members SET invite_hash=$2,invite_expires_at=now()+interval '7 days' WHERE id=$1",
          [m.id, hash(token)],
        );
        await audit(
          req.userId,
          "onboarding.invitation_renewed",
          "company_member",
          m.id,
          {},
          db,
        );
        return { invitationCode: token, expiresInDays: 7 };
      });
      res.json(result);
    }),
  );
  r.post(
    "/business/claim",
    wrap(async (req, res) => {
      const token = z.string().min(20).max(100).parse(req.body.invitationCode);
      if (!req.user.phone_number || !req.user.verified_at || !(req.user.firebase_uid || req.user.truecaller_uid))
        fail(
          403,
          "Sign in with your verified mobile number to accept this invitation",
        );
      const result = await transaction(async (db) => {
        const m = (
          await db.query(
            "SELECT * FROM company_members WHERE invite_hash=$1 AND invite_expires_at>now() AND status='pending' FOR UPDATE",
            [hash(token)],
          )
        ).rows[0];
        if (!m) fail(404, "Invitation expired or already accepted");
        if (m.phone !== req.user.phone_number)
          fail(403, "This invitation belongs to a different mobile number");
        const company = m.company_id
          ? (
              await db.query("SELECT * FROM companies WHERE id=$1", [
                m.company_id,
              ])
            ).rows[0]
          : null;
        if (
          m.company_id &&
          (
            await db.query(
              "SELECT id FROM company_members WHERE company_id=$1 AND user_id=$2",
              [m.company_id, req.userId],
            )
          ).rowCount
        )
          fail(409, "You already belong to this company");
        await db.query(
          "UPDATE company_members SET user_id=$2,status='active',invite_hash=NULL,updated_at=now() WHERE id=$1",
          [m.id, req.userId],
        );
        const card = (
          await db.query(
            `INSERT INTO cards(owner_id,slug,title,role,company,bio,image_url,business_card_url,contact,theme,company_id,company_member_id)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
            [
              req.userId,
              `card-${crypto.randomUUID()}`,
              m.name,
              m.title,
              company?.name || "",
              m.profile.bio || company?.description || "",
              await copyImage(m.profile.photoUrl, m.created_by, req.userId, db),
              await copyImage(
                m.profile.businessCardUrl,
                m.created_by,
                req.userId,
                db,
              ),
              {
                phone: m.phone,
                ...(m.email ? { email: m.email } : {}),
                ...(company?.website ? { website: company.website } : {}),
                ...(company?.address ? { address: company.address } : {}),
              },
              company?.logo_url ? { logoUrl: company.logo_url } : {},
              m.company_id,
              m.id,
            ],
          )
        ).rows[0];
        for (const [position, panel] of [
          "hook",
          "relevance",
          "offer",
          "outcome",
          "proof",
          "cta",
        ].entries())
          await db.query(
            "INSERT INTO pitch_panels(card_id,panel_type,body,position,approved,provenance) VALUES($1,$2,$3,$4,false,$5)",
            [
              card.id,
              panel,
              panel === "hook"
                ? m.profile.bio || company?.description || ""
                : "",
              position,
              "owner",
            ],
          );
        await audit(
          req.userId,
          "onboarding.claimed",
          "company_member",
          m.id,
          { cardId: card.id },
          db,
        );
        return { cardId: card.id, companyId: m.company_id };
      });
      res.json(result);
    }),
  );
  // Linking is explicit and platform-admin only; never match unverified profile email/phone.
  r.post(
    "/business/companies/:id/link",
    admin,
    wrap(async (req, res) => {
      const input = z
        .object({
          userId: uuid,
          cardId: uuid.optional(),
          role: z.enum(["owner", "manager", "member"]).default("member"),
          department: text(100).default(""),
        })
        .parse(req.body);
      const member = await transaction(async (db) => {
        await manage(req, req.params.id, db);
        const user = (
          await db.query(
            "SELECT * FROM users WHERE id=$1 AND status='active'",
            [input.userId],
          )
        ).rows[0];
        if (!user) fail(404, "Active account not found");
        let card;
        if (input.cardId) {
          card = (
            await db.query(
              "SELECT * FROM cards WHERE id=$1 AND owner_id=$2 FOR UPDATE",
              [input.cardId, user.id],
            )
          ).rows[0];
          if (!card || card.company_id)
            fail(409, "Choose an unlinked card owned by this account");
        }
        const m = (
          await db.query(
            `INSERT INTO company_members(company_id,user_id,name,email,phone,title,department,role,status,profile,created_by)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,'active',$9,$10) ON CONFLICT(company_id,user_id) DO UPDATE SET updated_at=now() RETURNING *`,
            [
              req.params.id,
              user.id,
              user.display_name,
              user.email,
              user.phone_number || "",
              card?.role || "",
              input.department,
              input.role,
              { photoUrl: card?.image_url || "" },
              req.userId,
            ],
          )
        ).rows[0];
        if (card)
          await db.query(
            "UPDATE cards SET company_id=$2,company_member_id=$3 WHERE id=$1",
            [card.id, req.params.id, m.id],
          );
        await audit(
          req.userId,
          "company.account_linked",
          "company_member",
          m.id,
          { cardId: input.cardId },
          db,
        );
        return m;
      });
      res.status(201).json({ member: camel(member) });
    }),
  );
  r.patch(
    "/business/companies/:id/members/:memberId",
    wrap(async (req, res) => {
      uuid.parse(req.params.memberId);
      const input = z
        .object({
          status: z.enum(["active", "paused"]),
          title: text(120),
          department: text(100),
        })
        .parse(req.body);
      await transaction(async (db) => {
        const a = await manage(req, req.params.id, db);
        const m = (
          await db.query(
            "SELECT * FROM company_members WHERE id=$1 AND company_id=$2 FOR UPDATE",
            [req.params.memberId, req.params.id],
          )
        ).rows[0];
        if (!m) fail(404, "Team member not found");
        if (m.role === "owner" || (m.role === "manager" && a.role !== "owner"))
          fail(
            403,
            "Only an owner can manage managers; owner accounts cannot be paused here",
          );
        if (m.status === "pending")
          fail(409, "The employee needs to accept their invitation first");
        await db.query(
          "UPDATE company_members SET status=$2,title=$3,department=$4,updated_at=now() WHERE id=$1",
          [m.id, input.status, input.title, input.department],
        );
        if (input.status === "paused")
          await db.query(
            "UPDATE cards SET is_published=false,updated_at=now() WHERE company_member_id=$1",
            [m.id],
          );
        await audit(
          req.userId,
          "company.member_updated",
          "company_member",
          m.id,
          input,
          db,
        );
      });
      res.json({ ok: true });
    }),
  );
  r.patch(
    "/business/companies/:id/leads/:leadId",
    wrap(async (req, res) => {
      uuid.parse(req.params.leadId);
      const input = z
        .object({
          status: z.enum(["new", "responded", "qualified", "closed"]),
          assignedMemberId: uuid.nullable(),
        })
        .parse(req.body);
      await transaction(async (db) => {
        await manage(req, req.params.id, db);
        const lead = (
          await db.query(
            "SELECT l.id FROM leads l JOIN cards c ON c.id=l.card_id WHERE l.id=$1 AND c.company_id=$2 FOR UPDATE OF l",
            [req.params.leadId, req.params.id],
          )
        ).rows[0];
        if (!lead) fail(404, "Enquiry not found");
        if (
          input.assignedMemberId &&
          !(
            await db.query(
              "SELECT id FROM company_members WHERE id=$1 AND company_id=$2 AND status='active'",
              [input.assignedMemberId, req.params.id],
            )
          ).rowCount
        )
          fail(400, "Choose an active member of this company");
        await db.query(
          "UPDATE leads SET status=$2,assigned_member_id=$3,updated_at=now() WHERE id=$1",
          [lead.id, input.status, input.assignedMemberId],
        );
        await audit(
          req.userId,
          "company.lead_updated",
          "lead",
          lead.id,
          input,
          db,
        );
      });
      res.json({ ok: true });
    }),
  );
  r.post(
    "/business/companies/:id/cards/:cardId/pause",
    wrap(async (req, res) => {
      uuid.parse(req.params.cardId);
      await transaction(async (db) => {
        await manage(req, req.params.id, db);
        const result = await db.query(
          "UPDATE cards SET is_published=false,updated_at=now() WHERE id=$1 AND company_id=$2 RETURNING id",
          [req.params.cardId, req.params.id],
        );
        if (!result.rowCount) fail(404, "Company card not found");
        await audit(
          req.userId,
          "company.card_paused",
          "card",
          req.params.cardId,
          {},
          db,
        );
      });
      res.json({ ok: true });
    }),
  );
  return r;
}
