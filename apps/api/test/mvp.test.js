import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { migrate, pool, query } from "../src/db.js";

let server;
let baseUrl;
let userEmail;

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, { headers: { "Content-Type": "application/json", ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) }, ...options });
  return { status: response.status, body: response.status === 204 ? undefined : await response.json() };
}

test.before(async () => {
  await migrate();
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  userEmail = `mvp-${crypto.randomUUID()}@example.test`;
});

test.after(async () => {
  await query("DELETE FROM users WHERE email = $1", [userEmail]);
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test("creates an approved public pitch, captures a lead, and preserves relationship context", async () => {
  const signup = await request("/auth/signup", { method: "POST", body: JSON.stringify({ email: userEmail, password: "correct-horse-battery" }) });
  assert.equal(signup.status, 201);
  const token = signup.body.accessToken;

  const draft = await request("/pitches/draft", { method: "POST", token, body: JSON.stringify({ company: "Acme", audience: "Founders", problem: "follow-ups are forgotten", offer: "turns intros into clear next steps", proof: "20 founder interviews", desiredAction: "Book a demo" }) });
  assert.equal(draft.body.panels.length, 6);

  const card = await request("/cards", { method: "POST", token, body: JSON.stringify({ slug: `acme-${crypto.randomUUID().slice(0, 8)}`, title: "Acme", subtitle: "Remember every introduction", ctaType: "book", ctaLabel: "Book a demo" }) });
  assert.equal(card.status, 201);
  const cardId = card.body.card.id;
  const approved = draft.body.panels.map((panel) => ({ ...panel, approved: true, provenance: "approved_ai" }));
  assert.equal((await request(`/cards/${cardId}/panels`, { method: "POST", token, body: JSON.stringify({ panels: approved }) })).status, 200);
  assert.equal((await request(`/cards/${cardId}/publish`, { method: "POST", token })).status, 200);

  const publicCard = await request(`/public/cards/${card.body.card.slug}`);
  assert.equal(publicCard.status, 200);
  assert.equal(publicCard.body.card.panels.length, 6);
  const lead = await request(`/public/cards/${card.body.card.slug}/leads`, { method: "POST", body: JSON.stringify({ name: "Ada", email: "ada@example.test", intent: "Interested in a pilot", consent: true }) });
  assert.equal(lead.status, 201);
  assert.equal((await request("/leads", { token })).body.leads.length, 1);

  const person = await request("/people", { method: "POST", token, body: JSON.stringify({ name: "Ada Lovelace", company: "Analytical Engines", tags: ["founder", "pilot"] }) });
  assert.equal(person.status, 201);
  const encounter = await request(`/people/${person.body.person.id}/encounters`, { method: "POST", token, body: JSON.stringify({ originalNote: "Ada wants a pilot after her September event.", commitments: [{ text: "Send pilot outline" }] }) });
  assert.equal(encounter.status, 201);
  assert.match(encounter.body.insight.proposedFollowUp, /Ada/);
  assert.equal((await request("/need-offers", { method: "POST", token, body: JSON.stringify({ kind: "need", text: "pilot" }) })).status, 201);
  const feed = await request("/feed", { token });
  assert.equal(feed.status, 200);
  assert.ok(feed.body.items.some((item) => item.type === "due_commitment"));
});
