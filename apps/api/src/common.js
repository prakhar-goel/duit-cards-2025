import crypto from 'node:crypto';
import { z } from 'zod';
import { query } from './db.js';
export const hash = value => crypto.createHash('sha256').update(value).digest('hex');
export const secretToken = () => crypto.randomBytes(32).toString('base64url');
export class HttpError extends Error {
  constructor(status, message, code = 'REQUEST_FAILED') {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}
export const fail = (status, message, code) => {
  throw new HttpError(status, message, code);
};
export const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export const uuid = z.string().uuid();
export const email = z.string().trim().toLowerCase().email().max(254);
export const text = max => z.string().trim().max(max);
export const httpUrl = z.string().url().max(2048).refine(v => ['http:', 'https:'].includes(new URL(v).protocol), 'Use http or https');
export const date = z.string().datetime({
  offset: true
});
export const pagination = req => ({
  limit: Math.min(200, Math.max(1, Number.parseInt(req.query.limit) || 50)),
  offset: Math.max(0, Number.parseInt(req.query.offset) || 0)
});
export const camel = value => {
  if (Array.isArray(value)) return value.map(camel);
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), camel(v)]));
  return value;
};
export async function owned(table, id, ownerId, db = {
  query
}) {
  uuid.parse(id);
  const row = (await db.query(`SELECT * FROM ${table} WHERE id=$1 AND owner_id=$2`, [id, ownerId])).rows[0];
  if (!row) fail(404, 'Not found', 'NOT_FOUND');
  return row;
}
export async function updateRow(table, id, ownerId, input, mapping, db = {
  query
}) {
  const entries = Object.entries(input).filter(([key]) => mapping[key]);
  if (!entries.length) return owned(table, id, ownerId, db);
  const values = entries.map(([, v]) => v);
  values.push(id, ownerId);
  const result = await db.query(`UPDATE ${table} SET ${entries.map(([k], i) => `${mapping[k]}=$${i + 1}`).join(',')} WHERE id=$${values.length - 1} AND owner_id=$${values.length} RETURNING *`, values);
  if (!result.rowCount) fail(404, 'Not found', 'NOT_FOUND');
  return result.rows[0];
}
export async function audit(actorId, action, targetType, targetId, details = {}, db = {
  query
}) {
  await db.query('INSERT INTO audit_logs(actor_id,action,target_type,target_id,details) VALUES($1,$2,$3,$4,$5)', [actorId, action, targetType, targetId, details]);
}
export function rateLimit({
  windowMs = 60000,
  max = 120,
  key = req => req.ip
} = {}) {
  const buckets = new Map();
  let cleanupAt = 0;
  return (req, res, next) => {
    const now = Date.now();
    if (now > cleanupAt) {
      for (const [k, v] of buckets) if (v.until < now) buckets.delete(k);
      cleanupAt = now + windowMs;
    }
    const k = key(req);
    const entry = buckets.get(k) || {
      count: 0,
      until: now + windowMs
    };
    if (entry.until < now) {
      entry.count = 0;
      entry.until = now + windowMs;
    }
    entry.count++;
    buckets.set(k, entry);
    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.until - now) / 1000));
      return next(new HttpError(429, 'Please try again shortly', 'RATE_LIMITED'));
    }
    next();
  };
}
export const publicOrigin = () => (process.env.PUBLIC_WEB_ORIGIN || process.env.PUBLIC_WEB_URL || 'http://localhost:48153').replace(/\/$/, '');
export const apiOrigin = () => (process.env.API_PUBLIC_ORIGIN || `http://localhost:${process.env.PORT || 48152}`).replace(/\/$/, '');
export const patchInput = (schema, body) => Object.fromEntries(Object.entries(schema.parse(body)).filter(([key]) => Object.hasOwn(body, key)));
export function requestApiOrigin(req) {
  const configured = process.env.API_PUBLIC_ORIGIN;
  if (configured && !['localhost', '127.0.0.1', '0.0.0.0'].includes(new URL(configured).hostname)) return configured.replace(/\/$/, '');
  const host = req.get('host');
  if (!host || !/^[-a-zA-Z0-9.:[\]]+$/.test(host)) return apiOrigin();
  return `${req.protocol}://${host}`;
}
export function presentPublicCard(snapshot, req) {
  const value = structuredClone(snapshot);
  for (const key of ['imageUrl', 'coverUrl', 'businessCardUrl']) {
    if (!value[key]) continue;
    try {
      const url = new URL(value[key], apiOrigin());
      const media = url.pathname.match(/\/api\/v1\/(?:public\/)?media\/([a-f0-9-]{36})$/i);
      if (media) value[key] = `${requestApiOrigin(req)}/api/v1/public/media/${media[1]}`;else if (url.pathname.startsWith('/demo/') && ['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname)) value[key] = `${requestApiOrigin(req)}${url.pathname}`;
    } catch {}
  }
  return value;
}
