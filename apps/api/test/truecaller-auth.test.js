import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || new URL(testUrl).pathname !== "/duit_2026_pilot_test")
  throw new Error("Truecaller tests require disposable duit_2026_pilot_test");
process.env.DATABASE_URL = testUrl;
process.env.JWT_SECRET = crypto.randomBytes(48).toString("hex");
const { migrate, pool, query } = await import("../src/db.js");
const { createApp } = await import("../src/app.js");
const suffix = crypto.randomUUID(),
  ids = [];
let server, base, identity;
const proof = {
  authorizationCode: "test-one-use-code",
  codeVerifier: "v".repeat(43),
};
async function call(route, body) {
  const r = await fetch(base + route, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: r.status, body: await r.json() };
}
test.before(async () => {
  await migrate();
  server = createApp({
    verifyPhone: async () => identity,
    verifyTruecaller: async () => identity,
  }).listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}/api/v1`;
});
test.after(async () => {
  for (const id of ids) await query("DELETE FROM users WHERE id=$1", [id]);
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  await pool.end();
});
test("both verified providers share one account without trusting profile contacts or merging changed identities", async () => {
  for (const first of ["phone", "truecaller"]) {
    const phone = "+919" + String(crypto.randomInt(100000000, 999999999));
    identity = { uid: `${first}-${suffix}`, phone, name: "Aarav" };
    const body = first === "phone" ? { idToken: "t".repeat(120) } : proof;
    const a = await call("/auth/" + first, body);
    assert.equal(a.status, 200, JSON.stringify(a.body));
    ids.push(a.body.user.id);
    const uid2 = `other-${first}-${suffix}`;
    identity = { uid: uid2, phone };
    const route = first === "phone" ? "truecaller" : "phone";
    const body2 = route === "phone" ? { idToken: "t".repeat(120) } : proof;
    const b = await call("/auth/" + route, body2);
    assert.equal(b.status, 200, JSON.stringify(b.body));
    assert.equal(b.body.user.id, a.body.user.id);
    const again = await call("/auth/" + route, body2);
    assert.equal(again.body.user.id, a.body.user.id);
    identity = { uid: "different-" + uid2, phone };
    assert.equal((await call("/auth/" + route, body2)).status, 409);
    identity = {
      uid: uid2,
      phone: "+918" + String(crypto.randomInt(100000000, 999999999)),
    };
    assert.equal((await call("/auth/" + route, body2)).status, 409);
    identity = { uid: uid2, phone };
    await query("UPDATE users SET status='suspended' WHERE id=$1", [
      a.body.user.id,
    ]);
    assert.equal((await call("/auth/" + route, body2)).status, 403);
  }
  identity = {
    uid: `strict-${suffix}`,
    phone: "+919" + String(crypto.randomInt(100000000, 999999999)),
  };
  assert.equal(
    (await call("/auth/truecaller", { ...proof, phone: "+919999999999" }))
      .status,
    400,
  );
  assert.equal(
    (await call("/auth/truecaller", { ...proof, codeVerifier: "short" }))
      .status,
    400,
  );
});
