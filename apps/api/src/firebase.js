import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { fail } from './common.js';

// ID-token verification needs Google's public certificates, not a service-account key.
export async function verifyPhoneIdentity(token) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) fail(503, 'Phone sign-in is not configured on this server.', 'PHONE_AUTH_UNAVAILABLE');
  const app = getApps().find(a => a.name === 'duit-phone') || initializeApp({ projectId }, 'duit-phone');
  let identity;
  try { identity = await getAuth(app).verifyIdToken(token); }
  catch { fail(401, 'Verify your phone number again.', 'INVALID_PHONE_TOKEN'); }
  if (identity.firebase?.sign_in_provider !== 'phone' || !/^\+[1-9]\d{7,14}$/.test(identity.phone_number || '') ||
      !identity.auth_time || Math.abs(Date.now() / 1000 - identity.auth_time) > 600) {
    fail(401, 'A recent phone verification is required.', 'INVALID_PHONE_TOKEN');
  }
  return { uid: identity.uid, phone: identity.phone_number };
}
