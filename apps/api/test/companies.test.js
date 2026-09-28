import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
const mediaDir = await fs.mkdtemp(
  path.join(os.tmpdir(), "duit-company-media-"),
);
process.env.MEDIA_DIR = mediaDir;
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || new URL(testUrl).pathname !== "/duit_2026_pilot_test")
  throw new Error(
    "Company integration tests require disposable duit_2026_pilot_test",
  );
process.env.DATABASE_URL = testUrl;
process.env.JWT_SECRET = crypto.randomBytes(48).toString("hex");
delete process.env.PILOT_INVITE_CODE;
const { migrate, query, pool } = await import("../src/db.js");
const { createApp } = await import("../src/app.js");
const suffix = crypto.randomUUID().slice(0, 8),
  users = [],
  companies = [];
let server, base;
async function call(
  path,
  token,
  body,
  method = body === undefined ? "GET" : "POST",
) {
  const r = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { status: r.status, body: await r.json() };
}
async function user(name) {
  const r = await call("/auth/signup", null, {
    email: `${name}-${suffix}@example.test`,
    displayName: name,
    password: "correct-horse-battery-staple",
  });
  assert.equal(r.status, 201);
  users.push(r.body.user.id);
  return r.body;
}
test.before(async () => {
  await migrate();
  server = createApp().listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}/api/v1`;
});
test.after(async () => {
  for (const id of companies)
    await query("DELETE FROM companies WHERE id=$1", [id]);
  await query("DELETE FROM company_members WHERE created_by=ANY($1::uuid[])", [
    users,
  ]);
  for (const id of users) await query("DELETE FROM users WHERE id=$1", [id]);
  await new Promise((r) => server.close(r));
  await pool.end();
  await fs.rm(mediaDir, { recursive: true, force: true });
});
test("company onboarding, phone claim, team permissions, card controls and lead assignment are isolated", async () => {
  const admin = await user("operator"),
    owner = await user("owner"),
    employee = await user("employee"),
    outsider = await user("outsider");
  await query("UPDATE users SET role='admin' WHERE id=$1", [admin.user.id]);
  let r = await call("/business/companies", owner.accessToken, {
    name: "Forbidden",
  });
  assert.equal(r.status, 403);
  r = await call("/business/companies", admin.accessToken, {
    name: "Northstar Studio",
    description: "Digital tools for growing teams",
    website: "https://northstar.example",
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const company = r.body.company;
  companies.push(company.id);
  r = await call(`/business/companies/${company.id}/link`, admin.accessToken, {
    userId: owner.user.id,
    role: "owner",
  });
  assert.equal(r.status, 201);
  r = await call(`/business/companies/${company.id}`, outsider.accessToken);
  assert.equal(r.status, 404);
  const personal = await call("/cards", outsider.accessToken, {
    slug: `private-${suffix}`,
    title: "Private card",
  });
  assert.equal(personal.status, 201);
  r = await call(`/business/companies/${company.id}/link`, admin.accessToken, {
    userId: owner.user.id,
    cardId: personal.body.card.id,
  });
  assert.equal(r.status, 409);
  const photo = await call("/media", owner.accessToken, {
    filename: "portrait.png",
    mimeType: "image/png",
    purpose: "portrait",
    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9V8AAAAASUVORK5CYII=",
  });
  assert.equal(photo.status, 201);
  r = await call("/business/onboarding", owner.accessToken, {
    photoUrl: photo.body.media.url,
    companyId: company.id,
    name: "Isha Rao",
    phone: "+919900001111",
    title: "Partnerships",
    department: "Growth",
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const invitation = r.body;
  const photoResponse = await fetch(
    base + `/business/members/${invitation.member.id}/photo`,
    { headers: { Authorization: `Bearer ${owner.accessToken}` } },
  );
  assert.equal(photoResponse.status, 200);
  assert.equal(photoResponse.headers.get("content-type"), "image/png");
  await photoResponse.arrayBuffer();
  const privatePhoto = await fetch(
    base + `/business/members/${invitation.member.id}/photo`,
    { headers: { Authorization: `Bearer ${outsider.accessToken}` } },
  );
  assert.equal(privatePhoto.status, 404);
  await privatePhoto.arrayBuffer();

  // Unverified profile fields do not establish identity.
  await query(
    "UPDATE users SET profile=jsonb_build_object('phone','+919900001111') WHERE id=$1",
    [employee.user.id],
  );
  r = await call("/business/claim", employee.accessToken, {
    invitationCode: invitation.invitationCode,
  });
  assert.equal(r.status, 403);
  await query("UPDATE users SET phone_number=$2,firebase_uid=$3,verified_at=now() WHERE id=$1", [
    outsider.user.id,
    "+919900001112",
    "outsider-" + suffix,
  ]);
  r = await call("/business/claim", outsider.accessToken, {
    invitationCode: invitation.invitationCode,
  });
  assert.equal(r.status, 403);
  await query("UPDATE users SET phone_number=$2,truecaller_uid=$3,verified_at=now() WHERE id=$1", [
    employee.user.id,
    "+919900001111",
    "employee-" + suffix,
  ]);
  r = await call("/business/claim", employee.accessToken, {
    invitationCode: invitation.invitationCode,
  });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const cardId = r.body.cardId;
  r = await call("/business/claim", employee.accessToken, {
    invitationCode: invitation.invitationCode,
  });
  assert.equal(r.status, 404);
  r = await call(`/cards/${cardId}`, employee.accessToken);
  assert.equal(r.body.card.isPublished, false);
  const clonedId = r.body.card.imageUrl.split("/").pop();
  assert.notEqual(clonedId, photo.body.media.id);
  const cloned = (
    await query("SELECT owner_id FROM media_assets WHERE id=$1", [clonedId])
  ).rows[0];
  assert.equal(cloned.owner_id, employee.user.id);
  assert.equal(
    (
      await query("SELECT owner_id FROM media_assets WHERE id=$1", [
        photo.body.media.id,
      ])
    ).rows[0].owner_id,
    owner.user.id,
  );
  assert.equal(r.body.card.companyProfile.name, "Northstar Studio");
  assert.equal(r.body.card.panels.length, 6);
  assert.equal(
    r.body.card.panels.every((p) => !p.approved),
    true,
  );
  r = await call("/business/companies", employee.accessToken);
  assert.equal(r.body.companies.length, 1);
  r = await call(`/business/companies/${company.id}`, employee.accessToken);
  assert.equal(r.body.members.length, 1);
  assert.equal(r.body.members[0].userId, employee.user.id);
  r = await call("/business/onboarding", employee.accessToken, {
    companyId: company.id,
    name: "Unallowed",
    phone: "+919900001113",
  });
  assert.equal(r.status, 403);
  r = await call(`/business/companies/${company.id}`, owner.accessToken);
  assert.equal(r.body.members.length, 2);
  const memberId = r.body.members.find((m) => m.userId === employee.user.id).id;
  const lead = (
    await query(
      "INSERT INTO leads(card_id,name,email,intent,consent) VALUES($1,'New customer','customer@example.test','Talk about a project',true) RETURNING id",
      [cardId],
    )
  ).rows[0];
  r = await call(
    `/business/companies/${company.id}/leads/${lead.id}`,
    outsider.accessToken,
    { status: "qualified", assignedMemberId: memberId },
    "PATCH",
  );
  assert.equal(r.status, 404);
  r = await call(
    `/business/companies/${company.id}/leads/${lead.id}`,
    employee.accessToken,
    { status: "qualified", assignedMemberId: memberId },
    "PATCH",
  );
  assert.equal(r.status, 403);
  r = await call(
    `/business/companies/${company.id}/leads/${lead.id}`,
    owner.accessToken,
    { status: "qualified", assignedMemberId: crypto.randomUUID() },
    "PATCH",
  );
  assert.equal(r.status, 400);
  r = await call(
    `/business/companies/${company.id}/leads/${lead.id}`,
    owner.accessToken,
    { status: "qualified", assignedMemberId: memberId },
    "PATCH",
  );
  assert.equal(r.status, 200);
  r = await call(`/business/companies/${company.id}`, owner.accessToken);
  assert.equal(r.body.leads[0].assignedMemberId, memberId);
  assert.equal(r.body.leads[0].status, "qualified");
  await query("UPDATE cards SET is_published=true WHERE id=$1", [cardId]);
  r = await call(
    `/business/companies/${company.id}/members/${memberId}`,
    owner.accessToken,
    { status: "paused", title: "Partnerships", department: "Growth" },
    "PATCH",
  );
  assert.equal(r.status, 200);
  assert.equal(
    (await query("SELECT is_published FROM cards WHERE id=$1", [cardId]))
      .rows[0].is_published,
    false,
  );
  r = await call(`/cards/${cardId}/publish`, employee.accessToken, {});
  assert.equal(r.status, 403);
  r = await call(`/business/companies/${company.id}`, employee.accessToken);
  assert.equal(r.status, 404);
  r = await call(`/cards/${cardId}`, employee.accessToken);
  assert.equal(r.status, 200); // personal account remains usable
  r = await call(
    `/business/companies/${company.id}/cards/${personal.body.card.id}/pause`,
    owner.accessToken,
    {},
  );
  assert.equal(r.status, 404);
  r = await call("/business/onboarding", admin.accessToken, {
    name: "Independent consultant",
    phone: "+919900001114",
  });
  assert.equal(r.status, 201);
  const pending = r.body;
  const renewed = await call(
    `/business/members/${pending.member.id}/invitation`,
    admin.accessToken,
    {},
  );
  assert.equal(renewed.status, 200);
  assert.notEqual(renewed.body.invitationCode, pending.invitationCode);
  await query("UPDATE users SET phone_number=$2 WHERE id=$1", [
    outsider.user.id,
    "+919900001114",
  ]);
  r = await call("/business/claim", outsider.accessToken, {
    invitationCode: pending.invitationCode,
  });
  assert.equal(r.status, 404);
  await query(
    "UPDATE company_members SET invite_expires_at=now()-interval '1 day' WHERE id=$1",
    [pending.member.id],
  );
  r = await call("/business/claim", outsider.accessToken, {
    invitationCode: renewed.body.invitationCode,
  });
  assert.equal(r.status, 404);
});
