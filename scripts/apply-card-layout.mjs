import fs from "node:fs/promises";
import { pool, transaction } from "../apps/api/src/db.js";
import { fullCard } from "../apps/api/src/cards.js";
const target = new URL(process.env.DATABASE_URL || "");
const staging =
  target.hostname ===
    "ep-autumn-voice-az2i6e27.c-3.ap-southeast-1.aws.neon.tech" &&
  target.pathname === "/neondb";
if (
  !staging &&
  !(target.hostname === "127.0.0.1" && target.pathname === "/duit_2026_pilot")
)
  throw Error("Only isolated DUIT local/staging is allowed.");
const marker = `.local/deployment/card-layout-${staging ? "staging" : "local"}.json`;
// Six of the thirty authored showcase profiles retain both card sides.
// User-created cards and the legacy archive are outside this migration.
const twoSides = new Set([
  "meera-joshi-saanjh-textiles",
  "nina-kindredspaces",
  "noah-morgan-demo",
  "business-bluetokai",
  "leena-carethread",
  "raka-pratama-demo",
]);
try {
  if (
    await fs.access(marker).then(
      () => true,
      () => false,
    )
  )
    throw Error(
      "Already applied. Inspect the private change record before rerunning.",
    );
  await fs.mkdir(".local/deployment", { recursive: true });
  const result = await transaction(async (db) => {
    await db.query("SELECT pg_advisory_xact_lock(26091846)");
    const cards = (
      await db.query(
        "SELECT * FROM cards WHERE data_origin IN ('fictional_demo','public_reference') AND image_url IS NOT NULL AND business_card_url IS NOT NULL ORDER BY slug FOR UPDATE",
      )
    ).rows;
    if (
      cards.length !== 30 ||
      [...twoSides].some(
        (slug) =>
          !cards.some((c) => c.slug === slug && c.business_card_back_url),
      )
    )
      throw Error("Unexpected showcase inventory; review before applying.");
    await fs.writeFile(marker + ".backup", JSON.stringify(cards), {
      mode: 0o600,
    });
    for (const c of cards) {
      if (twoSides.has(c.slug)) continue;
      const next = (
        await db.query(
          "UPDATE cards SET business_card_back_url=NULL, updated_at=now() WHERE id=$1 RETURNING *",
          [c.id],
        )
      ).rows[0];
      await db.query(
        "UPDATE people SET business_card_back_url=NULL WHERE source_card_id=$1 AND data_origin IN ('fictional_demo','public_reference')",
        [c.id],
      );
      if (c.is_published) {
        const snapshot = await fullCard(next, db);
        const version = (
          await db.query(
            "INSERT INTO card_versions(card_id,snapshot) VALUES($1,$2) RETURNING id",
            [c.id, snapshot],
          )
        ).rows[0];
        await db.query("UPDATE cards SET published_version_id=$2 WHERE id=$1", [
          c.id,
          version.id,
        ]);
      }
    }
    return {
      at: new Date().toISOString(),
      profiles: cards.length,
      twoSided: twoSides.size,
    };
  });
  await fs.writeFile(marker, JSON.stringify(result), { mode: 0o600 });
  console.log({ target: staging ? "staging" : "local", ...result });
} finally {
  await pool.end();
}
