import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query, transaction } from './db.js';
import { wrap, email, text, httpUrl, hash, secretToken, fail, rateLimit, camel, audit } from './common.js';
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) throw new Error('JWT_SECRET must be set to a random value of at least 32 characters.');
export const userDto = row => ({
  id: row.id,
  email: row.email,
  displayName: row.display_name,
  role: row.role,
  status: row.status,
  verifiedAt: row.verified_at,
  onboardingCompleted: row.onboarding_completed,
  createdAt: row.created_at,
  profile: row.profile,
  dataOrigin: row.data_origin
});
const accessToken = (user, sid) => jwt.sign({
  sub: user.id,
  sid
}, jwtSecret, {
  expiresIn: '30m',
  issuer: 'duit-pilot',
  audience: 'duit-app'
});
async function session(db, user) {
  const refresh = secretToken();
  const row = (await db.query("INSERT INTO auth_sessions(user_id,refresh_hash,expires_at) VALUES($1,$2,now()+interval '30 days') RETURNING id", [user.id, hash(refresh)])).rows[0];
  return {
    user: userDto(user),
    accessToken: accessToken(user, row.id),
    refreshToken: refresh
  };
}
export const auth = wrap(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) fail(401, 'Sign in to continue', 'AUTH_REQUIRED');
  let claims;
  try {
    claims = jwt.verify(header.slice(7), jwtSecret, {
      issuer: 'duit-pilot',
      audience: 'duit-app',
      algorithms: ['HS256']
    });
  } catch {
    fail(401, 'Your session expired. Please sign in again', 'SESSION_EXPIRED');
  }
  const row = (await query('SELECT u.*,s.id AS session_id FROM users u JOIN auth_sessions s ON s.user_id=u.id WHERE u.id=$1 AND s.id=$2 AND s.revoked_at IS NULL AND s.expires_at>now()', [claims.sub, claims.sid])).rows[0];
  if (!row || row.status !== 'active') fail(401, 'Session unavailable', 'SESSION_EXPIRED');
  req.user = row;
  req.userId = row.id;
  req.sessionId = row.session_id;
  next();
});
export const admin = (req, res, next) => {
  if (req.user?.role !== 'admin') return next(Object.assign(new Error('Administrator access required'), {
    status: 403,
    code: 'FORBIDDEN'
  }));
  next();
};
export const profileSchema = z.object({
  fullName: text(120),
  headline: text(220),
  company: text(120),
  role: text(120),
  bio: text(3000),
  city: text(100),
  countryCode: text(8),
  photoUrl: httpUrl.nullable(),
  website: httpUrl.nullable(),
  phone: text(40),
  offers: z.array(text(250)).max(12),
  needs: z.array(text(250)).max(12)
}).partial();
export function authRouter() {
  const router = Router();
  const limiter = rateLimit({
    max: 20,
    windowMs: 15 * 60 * 1000
  });
  router.get('/auth/capabilities', (_req, res) => res.json({
    inviteRequired: Boolean(process.env.PILOT_INVITE_CODE),
    verificationDelivery: process.env.LOCAL_OUTBOX === 'true' ? 'local_outbox' : 'unconfigured'
  }));
  router.post('/auth/signup', limiter, wrap(async (req, res) => {
    const input = z.object({
      email,
      password: z.string().min(10).max(128).refine(value => !bcrypt.truncates(value), 'Password must be at most 72 UTF-8 bytes'),
      displayName: text(120).optional(),
      onboardingProfile: profileSchema.optional(),
      inviteCode: text(200).optional(),
      claimToken: text(200).optional()
    }).parse(req.body);
    if (process.env.PILOT_INVITE_CODE) {
      const codeMatches = input.inviteCode && hash(input.inviteCode) === hash(process.env.PILOT_INVITE_CODE);
      let verifiedClaim = false;
      if (input.claimToken) {
        const proof = (await query('SELECT p.email FROM claim_proofs p JOIN share_links s ON s.id=p.share_id WHERE p.token_hash=$1 AND p.consumed_at IS NULL AND p.expires_at>now() AND s.claimed_at IS NULL AND s.revoked_at IS NULL AND s.expires_at>now()', [hash(input.claimToken)])).rows[0];
        verifiedClaim = Boolean(proof && proof.email === input.email);
      }
      if (!codeMatches && !verifiedClaim) fail(403, 'Use your private pilot invitation code, or verify the invitation sent to your email.', 'INVITE_REQUIRED');
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const result = await transaction(async db => {
      const user = (await db.query('INSERT INTO users(email,password_hash,display_name,profile) VALUES($1,$2,$3,$4) RETURNING *', [input.email, passwordHash, input.displayName || '', input.onboardingProfile || {}])).rows[0];
      return session(db, user);
    });
    res.status(201).json(result);
  }));
  router.post('/auth/login', limiter, wrap(async (req, res) => {
    const input = z.object({
      email,
      password: z.string().min(1).max(128).refine(value => !bcrypt.truncates(value), 'Password must be at most 72 UTF-8 bytes')
    }).parse(req.body);
    const user = (await query('SELECT * FROM users WHERE email=$1', [input.email])).rows[0];
    if (!user || !(await bcrypt.compare(input.password, user.password_hash)) || user.status !== 'active') fail(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    res.json(await transaction(db => session(db, user)));
  }));
  router.post('/auth/refresh', limiter, wrap(async (req, res) => {
    const {
      refreshToken
    } = z.object({
      refreshToken: z.string().min(20).max(200)
    }).parse(req.body);
    const response = await transaction(async db => {
      const row = (await db.query('SELECT s.*,u.status FROM auth_sessions s JOIN users u ON u.id=s.user_id WHERE refresh_hash=$1 FOR UPDATE OF s', [hash(refreshToken)])).rows[0];
      if (!row || row.revoked_at || new Date(row.expires_at) <= new Date() || row.status !== 'active') fail(401, 'Refresh session expired', 'SESSION_EXPIRED');
      await db.query('UPDATE auth_sessions SET revoked_at=now() WHERE id=$1', [row.id]);
      const user = (await db.query('SELECT * FROM users WHERE id=$1', [row.user_id])).rows[0];
      return session(db, user);
    });
    res.json(response);
  }));
  router.post('/auth/logout', auth, wrap(async (req, res) => {
    await query('UPDATE auth_sessions SET revoked_at=now() WHERE id=$1 AND user_id=$2', [req.sessionId, req.userId]);
    res.sendStatus(204);
  }));
  router.get('/auth/sessions', auth, wrap(async (req, res) => {
    const rows = (await query('SELECT id,created_at,last_used_at,expires_at FROM auth_sessions WHERE user_id=$1 AND revoked_at IS NULL AND expires_at>now() ORDER BY created_at DESC', [req.userId])).rows;
    res.json({
      sessions: camel(rows)
    });
  }));
  router.delete('/auth/sessions/:id', auth, wrap(async (req, res) => {
    const result = await query('UPDATE auth_sessions SET revoked_at=now() WHERE id=$1 AND user_id=$2 RETURNING id', [req.params.id, req.userId]);
    if (!result.rowCount) fail(404, 'Session not found');
    res.sendStatus(204);
  }));
  router.get('/me', auth, (req, res) => res.json({
    user: userDto(req.user)
  }));
  router.get('/me/profile', auth, (req, res) => res.json({
    profile: {
      fullName: req.user.display_name,
      ...req.user.profile
    }
  }));
  router.patch('/me/profile', auth, wrap(async (req, res) => {
    const input = profileSchema.parse(req.body);
    const row = (await query("UPDATE users SET profile=profile || $1::jsonb,display_name=COALESCE($2,display_name),onboarding_completed=true,updated_at=now() WHERE id=$3 RETURNING *", [JSON.stringify(input), input.fullName, req.userId])).rows[0];
    res.json({
      profile: {
        fullName: row.display_name,
        ...row.profile
      }
    });
  }));
  return router;
}
