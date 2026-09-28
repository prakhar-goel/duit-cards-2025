import test from "node:test";
import assert from "node:assert/strict";
import { verifyTruecallerIdentity } from "../src/truecaller.js";
const input = {
  authorizationCode: "one-use-code",
  codeVerifier: "v".repeat(43),
};
const token = { access_token: "server-only-token", token_type: "Bearer" };
const profile = {
  sub: "provider-subject",
  phone_number: "919876543210",
  phone_number_verified: true,
  given_name: "Maya",
  family_name: "Desai",
};
function stub(responses, calls = []) {
  return async (url, options) => {
    calls.push({ url, options });
    const r = responses.shift();
    if (r instanceof Error) throw r;
    return new Response(JSON.stringify(r.body ?? r), {
      status: r.status || 200,
    });
  };
}
test("Truecaller exchanges PKCE code on fixed provider URLs and only trusts verified server profile", async () => {
  const calls = [];
  const identity = await verifyTruecallerIdentity(input, {
    clientId: "duit-client",
    fetcher: stub([token, profile], calls),
  });
  assert.deepEqual(identity, {
    uid: "provider-subject",
    phone: "+919876543210",
    name: "Maya Desai",
  });
  const body = new URLSearchParams(calls[0].options.body);
  assert.equal(body.get("client_id"), "duit-client");
  assert.equal(body.get("code_verifier"), input.codeVerifier);
  assert.equal(body.get("grant_type"), "authorization_code");
  assert.equal(
    calls[1].url,
    "https://oauth-account-noneu.truecaller.com/v1/userinfo",
  );
  assert.equal(
    calls[1].options.headers.Authorization,
    "Bearer server-only-token",
  );
  assert.equal(calls[0].options.redirect, "error");
});
test("Truecaller rejects unverified, missing, malformed and mis-typed phone identities", async () => {
  for (const value of [
    { ...profile, phone_number_verified: false },
    { ...profile, phone_number_verified: "true" },
    { ...profile, phone_number: "not-a-number" },
    { ...profile, sub: "" },
    { ...profile, phone_number: 919876543210 },
  ])
    await assert.rejects(
      verifyTruecallerIdentity(input, {
        clientId: "duit",
        fetcher: stub([token, value]),
      }),
      (e) => e.status === 401,
    );
});
test("Truecaller rejects replayed codes and hides upstream secrets/errors from client", async () => {
  for (const response of [
    { status: 403, body: { error: "private-provider-details" } },
    new Error("private-network-details"),
  ])
    await assert.rejects(
      verifyTruecallerIdentity(input, {
        clientId: "duit",
        fetcher: stub([response]),
      }),
      (e) => !e.message.includes("private-"),
    );
  await assert.rejects(
    verifyTruecallerIdentity(input, { clientId: null }),
    (e) => e.status === 503,
  );
});
