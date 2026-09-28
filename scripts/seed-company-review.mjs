// Local-only authored team fixtures for the company dashboard browser review.
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
const url = new URL(process.env.DATABASE_URL || "");
if (
  !["localhost", "127.0.0.1"].includes(url.hostname) ||
  url.pathname !== "/duit_2026_pilot"
)
  throw new Error("Only the local duit_2026_pilot review database is allowed.");
const { query, transaction, pool, migrate } =
  await import("../apps/api/src/db.js");
const { fullCard } = await import("../apps/api/src/cards.js");
await migrate();
const origin = "http://localhost:48162";
try {
  await transaction(async (db) => {
    const maya = (
      await db.query(
        "SELECT * FROM users WHERE email='maya@northstar.example' AND data_origin='fictional_demo'",
      )
    ).rows[0];
    if (!maya) throw new Error("Run the original local fixture setup first.");
    const admin = (
      await db.query(
        "SELECT id FROM users WHERE email='admin@pilot.duit.test' AND role='admin'",
      )
    ).rows[0];
    if (!admin) throw new Error("Local administrator missing.");
    let company = (
      await db.query(
        "SELECT * FROM companies WHERE name='Northstar Studio' AND created_by=$1",
        [admin.id],
      )
    ).rows[0];
    if (!company)
      company = (
        await db.query(
          "INSERT INTO companies(name,description,website,address,industry,created_by) VALUES('Northstar Studio','We turn complicated software into clear stories, useful products and better first impressions.','https://northstar.example','Indiranagar, Bengaluru, India','Product design & storytelling',$1) RETURNING *",
          [admin.id],
        )
      ).rows[0];
    const members = [
      {
        email: maya.email,
        name: maya.display_name,
        title: "Founder & product designer",
        role: "owner",
        department: "Leadership",
        portrait: "maya-desai.png",
      },
      {
        email: "isha.company-review@example.test",
        name: "Isha Rao",
        title: "Partnerships lead",
        role: "manager",
        department: "Growth",
        portrait: "leena-portrait.png",
      },
      {
        email: "arjun.company-review@example.test",
        name: "Arjun Mehta",
        title: "Product designer",
        role: "member",
        department: "Design",
        portrait: "raka-pratama.png",
      },
      {
        email: "neha.company-review@example.test",
        name: "Neha Kapoor",
        title: "Brand strategist",
        role: "member",
        department: "Brand",
        portrait: "ines-portrait.png",
      },
    ];
    const linked = [];
    for (const p of members) {
      let u = (await db.query("SELECT * FROM users WHERE email=$1", [p.email]))
        .rows[0];
      if (!u)
        u = (
          await db.query(
            "INSERT INTO users(email,password_hash,display_name,data_origin,onboarding_completed) VALUES($1,$2,$3,'fictional_demo',true) RETURNING *",
            [
              p.email,
              await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
              p.name,
            ],
          )
        ).rows[0];
      const m = (
        await db.query(
          "INSERT INTO company_members(company_id,user_id,name,email,title,department,role,status,profile,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,'active',$8,$9) ON CONFLICT(company_id,user_id) DO UPDATE SET updated_at=company_members.updated_at RETURNING *",
          [
            company.id,
            u.id,
            p.name,
            p.email,
            p.title,
            p.department,
            p.role,
            { photoUrl: origin + "/demo/" + p.portrait },
            admin.id,
          ],
        )
      ).rows[0];
      let card = (
        await db.query(
          "SELECT * FROM cards WHERE owner_id=$1 ORDER BY created_at LIMIT 1",
          [u.id],
        )
      ).rows[0];
      if (!card) {
        card = (
          await db.query(
            "INSERT INTO cards(owner_id,slug,title,role,company,bio,image_url,theme,contact,data_origin) VALUES($1,$2,$3,$4,'Northstar Studio',$5,$6,$7,$8,'fictional_demo') RETURNING *",
            [
              u.id,
              "northstar-" + p.name.toLowerCase().replace(/ /g, "-"),
              p.name,
              p.title,
              company.description,
              origin + "/demo/" + p.portrait,
              { color: "#173f37" },
              {
                email: p.email,
                website: company.website,
                address: company.address,
              },
            ],
          )
        ).rows[0];
        const copy = [
          "Make your product easier to understand.",
          "For growing teams with a complicated customer journey.",
          "Product stories, prototypes and brand systems.",
          "A clearer first impression and a practical plan to build on.",
          "See the work and meet the team behind it.",
          "Tell us where your customers get stuck.",
        ];
        for (const [i, type] of [
          "hook",
          "relevance",
          "offer",
          "outcome",
          "proof",
          "cta",
        ].entries())
          await db.query(
            "INSERT INTO pitch_panels(card_id,panel_type,body,position,approved,provenance) VALUES($1,$2,$3,$4,true,'owner')",
            [card.id, type, copy[i], i],
          );
      }
      if (card.company_id && card.company_id !== company.id)
        throw new Error("Do not reassign a card from another company.");
      card = (
        await db.query(
          "UPDATE cards SET company_id=$2,company_member_id=$3 WHERE id=$1 RETURNING *",
          [card.id, company.id, m.id],
        )
      ).rows[0];
      if (u.id !== maya.id && !card.is_published) {
        const snapshot = await fullCard(card, db);
        snapshot.isPublished = true;
        const v = (
          await db.query(
            "INSERT INTO card_versions(card_id,snapshot) VALUES($1,$2) RETURNING id",
            [card.id, snapshot],
          )
        ).rows[0];
        await db.query(
          "UPDATE cards SET is_published=true,published_version_id=$2,published_at=now() WHERE id=$1",
          [card.id, v.id],
        );
      }
      linked.push({ m, card });
    }
    for (const [name, title, phone] of [
      ["Kabir Sethi", "Motion designer", "+919900002221"],
      ["Ananya Iyer", "Account partner", "+919900002222"],
    ]) {
      if (
        !(
          await db.query(
            "SELECT id FROM company_members WHERE company_id=$1 AND phone=$2",
            [company.id, phone],
          )
        ).rowCount
      )
        await db.query(
          "INSERT INTO company_members(company_id,name,title,phone,department,created_by) VALUES($1,$2,$3,$4,'Creative',$5)",
          [company.id, name, title, phone, admin.id],
        );
    }
    const enquiries = [
      [
        "Rohit Malhotra",
        "We need a clearer onboarding flow for our procurement platform. Can we start with a two-week sprint?",
        "new",
        1,
      ],
      [
        "Sara Tan",
        "Looking for a brand partner for our Singapore launch in November.",
        "qualified",
        2,
      ],
      [
        "Vikram Jain",
        "Would love to see your work on B2B dashboards. We have three products to bring together.",
        "new",
        0,
      ],
      [
        "Priya Menon",
        "Following up on our conversation at SaaSBOOMi. Can we meet on Thursday?",
        "responded",
        1,
      ],
    ];
    for (const [name, intent, status, index] of enquiries) {
      const { card, m } = linked[index];
      if (
        !(
          await db.query(
            "SELECT id FROM leads WHERE card_id=$1 AND source='company-browser-review' AND name=$2",
            [card.id, name],
          )
        ).rowCount
      )
        await db.query(
          "INSERT INTO leads(card_id,name,email,intent,consent,source,status,assigned_member_id,created_at) VALUES($1,$2,$3,$4,true,'company-browser-review',$5,$6,now()-interval '2 days')",
          [
            card.id,
            name,
            name.toLowerCase().replace(/ /g, ".") + "@example.test",
            intent,
            status,
            status === "new" ? null : m.id,
          ],
        );
    }
    for (const { card } of linked)
      for (let i = 0; i < 18; i++)
        await db.query(
          "INSERT INTO card_events(card_id,event_type,source,event_key,created_at) VALUES($1,'viewed','company-browser-review',$2,now()-interval '3 days') ON CONFLICT DO NOTHING",
          [card.id, "company-review-" + i],
        );
    for (const [name, industry, description] of [
      [
        "Loop & Leaf",
        "Reusable packaging",
        "Returnable packaging for food and personal-care businesses.",
      ],
      [
        "Fieldwork",
        "Events & community",
        "Make every meeting at your next event count.",
      ],
    ])
      if (
        !(
          await db.query(
            "SELECT id FROM companies WHERE name=$1 AND created_by=$2",
            [name, admin.id],
          )
        ).rowCount
      )
        await db.query(
          "INSERT INTO companies(name,industry,description,created_by) VALUES($1,$2,$3,$4)",
          [name, industry, description, admin.id],
        );
  });
  console.log(
    "Local company review is ready: Northstar Studio, six people, four linked cards and four authored enquiries.",
  );
} finally {
  await pool.end();
}
