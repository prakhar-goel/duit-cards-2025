import { Router } from 'express';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { query } from './db.js';
import { auth, admin } from './auth.js';
import { wrap, fail, text, uuid, owned, apiOrigin, requestApiOrigin } from './common.js';
const exec = promisify(execFile);
export const mediaDir = process.env.MEDIA_DIR || fileURLToPath(new URL('../../../.local/media/', import.meta.url));
const types = {
  'image/jpeg': {
    ext: 'jpg',
    test: b => b[0] === 255 && b[1] === 216 && b[2] === 255
  },
  'image/png': {
    ext: 'png',
    test: b => b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  },
  'image/webp': {
    ext: 'webp',
    test: b => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP'
  },
  'video/mp4': { ext: 'mp4', test: b => b.toString('ascii', 4, 8) === 'ftyp' },
  'audio/mpeg': {
    ext: 'mp3',
    test: b => b.toString('ascii', 0, 3) === 'ID3' || b[0] === 255 && (b[1] & 224) === 224
  },
  'audio/mp4': {
    ext: 'm4a',
    test: b => b.toString('ascii', 4, 8) === 'ftyp'
  },
  'audio/webm': {
    ext: 'webm',
    test: b => b.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163]))
  }
};
export function mediaDto(row, req) {
  return {
    id: row.id,
    url: `${req ? requestApiOrigin(req) : apiOrigin()}/api/v1/media/${row.id}`,
    mimeType: row.mime_type,
    size: row.size_bytes,
    purpose: row.purpose,
    createdAt: row.created_at
  };
}
export async function storeMedia(ownerId, {
  filename,
  mimeType,
  data,
  purpose
}) {
  const spec = types[mimeType];
  if (!spec) fail(400, 'Unsupported media format', 'UNSUPPORTED_MEDIA');
  if (typeof data !== 'string' || !data.length || !/^[A-Za-z0-9+/]*={0,2}$/.test(data) || data.length % 4 !== 0) fail(400, 'Invalid base64 media', 'INVALID_MEDIA');
  const bytes = Buffer.from(data, 'base64');
  const max = (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) ? 12 * 1024 * 1024 : 8 * 1024 * 1024;
  if (bytes.length < 12 || bytes.length > max || !spec.test(bytes)) fail(400, 'Media content does not match its format or size limit', 'INVALID_MEDIA');
  if (mimeType.startsWith('video/') && purpose !== 'cover') fail(400, 'Video must use cover purpose');
  if (mimeType.startsWith('audio/') && purpose !== 'voice_note') fail(400, 'Audio must use voice_note purpose');
  const id = crypto.randomUUID();
  await fs.mkdir(mediaDir, {
    recursive: true,
    mode: 0o700
  });
  const storagePath = path.join(mediaDir, `${id}.${spec.ext}`);
  await fs.writeFile(storagePath, bytes, {
    flag: 'wx',
    mode: 0o600
  });
  try {
    const row = (await query('INSERT INTO media_assets(id,owner_id,filename,mime_type,size_bytes,storage_path,sha256,purpose) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [id, ownerId, path.basename(filename), mimeType, bytes.length, storagePath, crypto.createHash('sha256').update(bytes).digest('hex'), purpose])).rows[0];
    return row;
  } catch (error) {
    await fs.unlink(storagePath).catch(() => {});
    throw error;
  }
}
export async function mediaForAi(ownerId, ids) {
  const result = [];
  for (const id of ids) {
    const row = await owned('media_assets', id, ownerId);
    const bytes = await fs.readFile(row.storage_path);
    const item = {
      id: row.id,
      mimeType: row.mime_type,
      bytes
    };
    if (row.mime_type.startsWith('audio/')) {
      let duration;
      try {
        const {
          stdout
        } = await exec(process.env.FFPROBE_PATH || 'ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', row.storage_path], {
          timeout: 10000,
          maxBuffer: 10000
        });
        duration = Number(stdout.trim());
      } catch {
        fail(422, 'This recording cannot be measured safely. Try a shorter MP3 or M4A recording.', 'AUDIO_DURATION_UNAVAILABLE');
      }
      if (!Number.isFinite(duration) || duration <= 0 || duration > 600) fail(422, 'Voice notes must be shorter than 10 minutes', 'AUDIO_TOO_LONG');
      Object.assign(item, {
        durationSeconds: duration,
        durationVerified: true
      });
    }
    result.push(item);
  }
  return result;
}
export function mediaRouter() {
  const router = Router();
  router.post('/media', auth, wrap(async (req, res) => {
    const input = z.object({
      filename: text(180).min(1),
      mimeType: z.enum(Object.keys(types)),
      data: z.string().max(17 * 1024 * 1024),
      purpose: z.enum(['portrait', 'business_card', 'cover', 'voice_note'])
    }).parse(req.body);
    res.status(201).json({
      media: mediaDto(await storeMedia(req.userId, input), req)
    });
  }));
  router.get('/admin/media/:id', auth, admin, wrap(async (req, res) => {
    uuid.parse(req.params.id);
    const row = (await query("SELECT m.* FROM media_assets m WHERE m.id=$1 AND m.mime_type LIKE 'image/%' AND (m.owner_id=$2 OR EXISTS(SELECT 1 FROM archive_profiles a WHERE a.profile::text LIKE '%'||m.id::text||'%') OR EXISTS(SELECT 1 FROM cards c JOIN card_versions v ON v.id=c.published_version_id WHERE c.is_published=true AND (v.snapshot->>'imageUrl' LIKE '%/public/media/'||m.id::text OR v.snapshot->>'coverUrl' LIKE '%/public/media/'||m.id::text OR v.snapshot->>'businessCardUrl' LIKE '%/public/media/'||m.id::text OR v.snapshot->>'businessCardBackUrl' LIKE '%/public/media/'||m.id::text OR EXISTS(SELECT 1 FROM jsonb_array_elements(COALESCE(v.snapshot->'businessMedia','[]'::jsonb)) slide WHERE slide->>'url' LIKE '%/public/media/'||m.id::text))))", [req.params.id, req.userId])).rows[0];
    if (!row) fail(404, 'Image not found');
    res.setHeader('Content-Type', row.mime_type);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(row.storage_path, {
      dotfiles: 'allow'
    });
  }));
  router.get('/media/:id', auth, wrap(async (req, res) => {
    const row = await owned('media_assets', req.params.id, req.userId);
    res.setHeader('Content-Type', row.mime_type);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(row.storage_path, {
      dotfiles: 'allow'
    });
  }));
  router.get('/public/media/:id', wrap(async (req, res) => {
    uuid.parse(req.params.id);
    const row = (await query("SELECT m.* FROM media_assets m WHERE m.id=$1 AND EXISTS(SELECT 1 FROM cards c JOIN card_versions v ON v.id=c.published_version_id WHERE c.is_published=true AND (v.snapshot->>'imageUrl' LIKE '%/public/media/'||m.id::text OR v.snapshot->>'coverUrl' LIKE '%/public/media/'||m.id::text OR v.snapshot->>'businessCardUrl' LIKE '%/public/media/'||m.id::text OR v.snapshot->>'businessCardBackUrl' LIKE '%/public/media/'||m.id::text OR EXISTS(SELECT 1 FROM jsonb_array_elements(COALESCE(v.snapshot->'businessMedia','[]'::jsonb)) slide WHERE slide->>'url' LIKE '%/public/media/'||m.id::text)))", [req.params.id])).rows[0];
    if (!row) fail(404, 'Image not found');
    res.setHeader('Content-Type', row.mime_type);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(row.storage_path, {
      dotfiles: 'allow'
    });
  }));
  return router;
}
