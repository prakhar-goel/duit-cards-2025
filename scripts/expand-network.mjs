// One-time, idempotent update of authored fixtures only. Never touches the legacy archive.
import fs from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { query, transaction, pool, migrate } from "../apps/api/src/db.js";
import { fullCard } from "../apps/api/src/cards.js";
import { newProfiles, originalBrands } from "./network-expansion-data.mjs";
const root = process.cwd(),
  origin = "http://localhost:48152";
const image = (p) => `${origin}/demo/${p}`;
const marker = path.join(root, ".local/network-expansion-v1.json");
const credentialsPath = path.join(root, ".local/credentials.json");
const credentials = JSON.parse(await fs.readFile(credentialsPath, "utf8"));
const stamp = Date.now();
const apply = process.argv.includes("--apply");
function clean(s) {
  return typeof s === "string"
    ? s
        .replaceAll(" (Demo)", "")
        .replaceAll(" — fictional venue", "")
        .replace(/^Fictional demo (?:profile|business|contact)\.\s*/i, "")
        .replace(
          /^Fictional demo note, written by the workspace owner\.\s*/i,
          "",
        )
        .replace(/^Fictional demo enquiry:\s*/i, "")
        .replaceAll("fictional demo conference", "conference")
        .replaceAll("Fictional demo conference", "Conference")
        .replaceAll("Fictional small founder dinner", "A small founder dinner")
        .replaceAll("Fictional community evening", "A community evening")
        .replaceAll("Upcoming fictional demo event", "Upcoming event")
    : s;
}
try {
  const users = (
    await query("SELECT id,email FROM users WHERE data_origin='fictional_demo'")
  ).rows;
  const exists = await fs.access(marker).then(
    () => true,
    () => false,
  );
  console.log(
    JSON.stringify({
      mode: apply ? "apply" : "preview",
      alreadyApplied: exists,
      existingFixtureAccounts: users.length,
      newProfiles: newProfiles.map((p) => ({
        name: p.name,
        company: p.company,
        city: p.city,
      })),
      legacyArchive: "untouched",
    }),
  );
  if (!apply || exists) process.exitCode = 0;
  else {
    // A private recovery snapshot before any fixture changes, including login identifiers.
    const backup = { credentials, tables: {} };
    for (const table of ["users", "cards", "people", "encounters"])
      backup.tables[table] = (
        await query(
          `SELECT * FROM ${table} WHERE ${table === "encounters" ? "owner_id IN (SELECT id FROM users WHERE data_origin='fictional_demo')" : "data_origin='fictional_demo'"}`,
        )
      ).rows;
    for (const table of ["events", "commitments", "need_offers"])
      backup.tables[table] = (
        await query(
          `SELECT * FROM ${table} WHERE owner_id IN (SELECT id FROM users WHERE data_origin='fictional_demo')`,
        )
      ).rows;
    backup.tables.pitch_panels = (
      await query(
        "SELECT p.* FROM pitch_panels p JOIN cards c ON c.id=p.card_id WHERE c.data_origin='fictional_demo'",
      )
    ).rows;
    backup.tables.card_versions = (
      await query(
        "SELECT v.* FROM card_versions v JOIN cards c ON c.id=v.card_id WHERE c.data_origin='fictional_demo'",
      )
    ).rows;
    await fs.writeFile(
      path.join(root, `.local/network-backup-${stamp}.json`),
      JSON.stringify(backup),
      { mode: 0o600 },
    );
    await migrate();
    const credentialChanges = [];
    await transaction(async (db) => {
      for (const brand of originalBrands) {
        const old = `${brand.key}@demo.duit.test`,
          email = `${brand.key}@${brand.domain}.example`;
        const user = (
          await db.query(
            "SELECT * FROM users WHERE email IN ($1,$2) AND data_origin='fictional_demo'",
            [old, email],
          )
        ).rows[0];
        if (!user) throw new Error(`Missing authored fixture: ${brand.key}`);
        const profile = { ...user.profile, bio: clean(user.profile.bio) };
        await db.query("UPDATE users SET email=$2,profile=$3 WHERE id=$1", [
          user.id,
          email,
          profile,
        ]);
        credentialChanges.push({ old, email });
        const cards = (
          await db.query(
            "SELECT * FROM cards WHERE owner_id=$1 AND data_origin='fictional_demo'",
            [user.id],
          )
        ).rows;
        for (const card of cards) {
          const gallery = [
            {
              type: "image",
              url: image(`covers/${brand.key}-cover.png`),
              title: brand.company,
              caption: card.subtitle,
            },
            {
              type: "image",
              url: image(`covers/${brand.key}-process.png`),
              title: "How we work",
              caption: brand.details.join(" · "),
            },
            {
              type: "video",
              url: image(`clips/${brand.key}.mp4`),
              title: brand.steps[0],
              caption: brand.details[0],
            },
          ];
          await db.query(
            "UPDATE cards SET bio=$2,contact=$3,business_card_back_url=$4,business_media=$5 WHERE id=$1",
            [
              card.id,
              clean(card.bio),
              { ...card.contact, email },
              image(`cards/${brand.key}-back.png`),
              JSON.stringify(gallery),
            ],
          );
          await db.query(
            "UPDATE pitch_panels SET body=$2 WHERE card_id=$1 AND panel_type='proof'",
            [card.id, brand.proof],
          );
          const row = (
            await db.query("SELECT * FROM cards WHERE id=$1", [card.id])
          ).rows[0];
          await publish(row, db);
        }
      }
      const owners = (
        await db.query(
          "SELECT id,email FROM users WHERE email IN ('maya@northstar.example','noah@fieldwork.example') AND data_origin='fictional_demo'",
        )
      ).rows;
      for (const p of newProfiles) {
        const domain = p.company.toLowerCase().replace(/[^a-z]/g, ""),
          email = `${p.key}@${domain}.example`;
        const password = process.env.PILOT_SEED_PASSWORD;
        if (!password) throw new Error("Private seed password is required");
        const hash = await bcrypt.hash(password, 12);
        const user = (
          await db.query(
            "INSERT INTO users(email,password_hash,display_name,verified_at,onboarding_completed,profile,data_origin) VALUES($1,$2,$3,now(),true,$4,'fictional_demo') ON CONFLICT(email) DO NOTHING RETURNING *",
            [
              email,
              hash,
              p.name,
              {
                fullName: p.name,
                company: p.company,
                role: p.role,
                city: p.city,
                countryCode: p.country,
                photoUrl: image(`${p.key}-portrait.png`),
                bio: p.offer,
              },
            ],
          )
        ).rows[0];
        if (!user)
          throw new Error(
            `Account already exists: ${p.key}; no existing account will be changed`,
          );
        credentialChanges.push({ email, password, label: p.name });
        const gallery = [
          {
            type: "image",
            url: image(`covers/${p.key}-cover.png`),
            title: p.headline,
            caption: p.offer,
          },
          {
            type: "image",
            url: image(`covers/${p.key}-process.png`),
            title: "How we work",
            caption: p.details.join(" · "),
          },
          {
            type: "video",
            url: image(`clips/${p.key}.mp4`),
            title: p.company,
            caption: p.details[0],
          },
        ];
        const card = (
          await db.query(
            "INSERT INTO cards(owner_id,slug,title,subtitle,image_url,business_card_url,business_card_back_url,business_media,cover_url,company,role,bio,contact,cta_label,data_origin) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'fictional_demo') RETURNING *",
            [
              user.id,
              p.key + "-" + domain,
              p.name,
              p.headline,
              image(`${p.key}-portrait.png`),
              image(`cards/${p.key}-card.png`),
              image(`cards/${p.key}-back.png`),
              JSON.stringify(gallery),
              image(`covers/${p.key}-cover.png`),
              p.company,
              p.role,
              p.offer,
              { email },
              p.cta,
            ],
          )
        ).rows[0];
        for (const [i, type] of [
          "hook",
          "relevance",
          "offer",
          "outcome",
          "proof",
          "cta",
        ].entries())
          await db.query(
            "INSERT INTO pitch_panels(card_id,panel_type,body,position,provenance,approved) VALUES($1,$2,$3,$4,'owner',true)",
            [
              card.id,
              type,
              [
                p.headline,
                p.details[0],
                p.offer,
                p.details[1],
                p.details[2],
                p.cta,
              ][i],
              i,
            ],
          );
        await publish(card, db);
        for (const owner of owners) {
          const person = (
            await db.query(
              "INSERT INTO people(owner_id,name,company,role,email,photo_url,business_card_url,business_card_back_url,source_card_id,city,country_code,bio,tags,stage,data_origin) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'promising','fictional_demo') RETURNING *",
              [
                owner.id,
                p.name,
                p.company,
                p.role,
                email,
                card.image_url,
                card.business_card_url,
                card.business_card_back_url,
                card.id,
                p.city,
                p.country,
                p.offer,
                [p.role.split(" · ")[1]],
              ],
            )
          ).rows[0];
          const event = (
            await db.query(
              "INSERT INTO events(owner_id,name,venue,city,country_code,latitude,longitude,starts_at,ends_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
              [
                owner.id,
                p.event,
                p.venue,
                p.city,
                p.country,
                p.lat,
                p.lon,
                p.date,
                new Date(
                  new Date(p.date).valueOf() + 4 * 3600000,
                ).toISOString(),
              ],
            )
          ).rows[0];
          const meeting = (
            await db.query(
              "INSERT INTO encounters(owner_id,person_id,occurred_at,location,city,country_code,latitude,longitude,event_id,event_name,meeting_type,original_note,proposed_follow_up) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Conference',$11,$12) RETURNING *",
              [
                owner.id,
                person.id,
                p.date,
                p.venue,
                p.city,
                p.country,
                p.lat,
                p.lon,
                event.id,
                event.name,
                p.note,
                p.next,
              ],
            )
          ).rows[0];
          await db.query(
            "INSERT INTO commitments(owner_id,person_id,encounter_id,text,due_at) VALUES($1,$2,$3,$4,$5)",
            [owner.id, person.id, meeting.id, p.next, "2026-09-21T10:00:00Z"],
          );
        }
      }
      const people = (
        await db.query(
          "SELECT * FROM people WHERE data_origin='fictional_demo'",
        )
      ).rows;
      for (const p of people) {
        const brand = originalBrands.find(
          (b) => p.email === `${b.key}@demo.duit.test`,
        );
        const email = brand
          ? `${brand.key}@${brand.domain}.example`
          : p.email?.replace(
              "@demo.duit.test",
              "@" + p.company.toLowerCase().replace(/[^a-z]/g, "") + ".example",
            );
        await db.query(
          "UPDATE people SET bio=$2,tags=$3,email=$4 WHERE id=$1",
          [
            p.id,
            clean(p.bio),
            p.tags.filter((t) => !/fictional|demo/i.test(t)),
            email,
          ],
        );
      }
      const fixtureOwners = (
        await db.query(
          "SELECT id FROM users WHERE data_origin='fictional_demo'",
        )
      ).rows.map((u) => u.id);
      for (const table of ["events", "encounters"]) {
        const rows = (
          await db.query(
            `SELECT * FROM ${table} WHERE owner_id=ANY($1::uuid[])`,
            [fixtureOwners],
          )
        ).rows;
        for (const row of rows) {
          if (table === "events")
            await db.query(
              "UPDATE events SET name=$2,venue=$3,description=$4 WHERE id=$1",
              [
                row.id,
                clean(row.name),
                clean(row.venue),
                clean(row.description),
              ],
            );
          else
            await db.query(
              "UPDATE encounters SET original_note=$2,event_name=$3,location=$4 WHERE id=$1",
              [
                row.id,
                clean(row.original_note),
                clean(row.event_name),
                clean(row.location),
              ],
            );
        }
      }
      const leads = (
        await db.query(
          "SELECT l.* FROM leads l JOIN cards c ON c.id=l.card_id WHERE c.data_origin='fictional_demo' AND l.source LIKE '%:lead:%'",
        )
      ).rows;
      for (const l of leads)
        await db.query("UPDATE leads SET intent=$2 WHERE id=$1", [
          l.id,
          clean(l.intent),
        ]);
    });
    for (const change of credentialChanges) {
      const old = credentials.accounts.find((a) => a.email === change.old);
      if (old) old.email = change.email;
      else if (change.password) credentials.accounts.push(change);
    }
    await fs.writeFile(
      credentialsPath,
      JSON.stringify(credentials, null, 2) + "\n",
      { mode: 0o600 },
    );
    await fs.writeFile(
      marker,
      JSON.stringify(
        {
          appliedAt: new Date().toISOString(),
          profiles: 6,
          meetingsPerWorkspace: 6,
          backup: `network-backup-${stamp}.json`,
        },
        null,
        2,
      ),
      { mode: 0o600 },
    );
    console.log(
      "Added six cards and six meetings to each primary workspace. Existing sessions and passwords preserved.",
    );
  }
} finally {
  await pool.end();
}
async function publish(card, db) {
  const snapshot = await fullCard(card, db);
  snapshot.isPublished = true;
  snapshot.publishedAt = new Date().toISOString();
  const v = (
    await db.query(
      "INSERT INTO card_versions(card_id,snapshot) VALUES($1,$2) RETURNING id",
      [card.id, snapshot],
    )
  ).rows[0];
  await db.query(
    "UPDATE cards SET is_published=true,published_at=now(),published_version_id=$2 WHERE id=$1",
    [card.id, v.id],
  );
}
