import { fail } from "./common.js";

export const truecallerClientId = () =>
  process.env.TRUECALLER_CLIENT_ID?.trim() || null;
const origin = "https://oauth-account-noneu.truecaller.com";

// Exchange a one-use authorization code with its PKCE verifier on the server.
// Neither a client-supplied phone number nor a client-supplied access token is trusted.
export async function verifyTruecallerIdentity(
  { authorizationCode, codeVerifier },
  { fetcher = fetch, clientId = truecallerClientId() } = {},
) {
  if (!clientId)
    fail(503, "Use your mobile number to sign in.", "TRUECALLER_UNAVAILABLE");
  async function request(path, options) {
    let response;
    try {
      response = await fetcher(`${origin}${path}`, {
        ...options,
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      fail(
        503,
        "Truecaller is unavailable. Use your mobile number instead.",
        "TRUECALLER_UNAVAILABLE",
      );
    }
    if (!response.ok)
      fail(
        response.status >= 500 || response.status === 429 ? 503 : 401,
        "Truecaller could not verify you. Try again or use your mobile number.",
        "TRUECALLER_VERIFICATION_FAILED",
      );
    try {
      return await response.json();
    } catch {
      fail(
        502,
        "Truecaller returned an invalid response. Use your mobile number.",
        "TRUECALLER_VERIFICATION_FAILED",
      );
    }
  }
  const token = await request("/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      code: authorizationCode,
      code_verifier: codeVerifier,
    }).toString(),
  });
  if (
    typeof token.access_token !== "string" ||
    !token.access_token ||
    token.token_type?.toLowerCase() !== "bearer"
  )
    fail(
      401,
      "Truecaller verification failed.",
      "TRUECALLER_VERIFICATION_FAILED",
    );
  const profile = await request("/v1/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const rawPhone =
    typeof profile.phone_number === "string" ? profile.phone_number : "";
  const phone = rawPhone.startsWith("+") ? rawPhone : `+${rawPhone}`;
  if (
    profile.phone_number_verified !== true ||
    !/^\+[1-9]\d{7,14}$/.test(phone) ||
    typeof profile.sub !== "string" ||
    !profile.sub ||
    profile.sub.length > 200
  )
    fail(
      401,
      "A verified mobile number is required. Use the SMS option.",
      "TRUECALLER_UNVERIFIED_PHONE",
    );
  return {
    uid: profile.sub,
    phone,
    name: [profile.given_name, profile.family_name]
      .filter((v) => typeof v === "string")
      .join(" ")
      .slice(0, 120),
  };
}
