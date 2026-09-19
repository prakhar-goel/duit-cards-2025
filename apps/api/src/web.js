import express, { Router } from 'express';
import { createApkReleaseReader } from './apk-release.js';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { query } from './db.js';
import { publishedCard, publicCardById } from './cards.js';
import { wrap, fail, hash, presentPublicCard, publicOrigin } from './common.js';
const defaultDist = fileURLToPath(new URL('../../web/dist/', import.meta.url));
const defaultApk = fileURLToPath(new URL('../../../artifacts/DUIT-2026-Pilot.apk', import.meta.url));
const escape = value => String(value || '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[c]);
const basePath = () => {
  try {
    return new URL(process.env.PUBLIC_WEB_ORIGIN || process.env.PUBLIC_WEB_URL || 'http://localhost').pathname.replace(/\/$/, '');
  } catch {
    return '';
  }
};
function minimal(card) {
  return `<main class="duit-server-card" style="max-width:720px;margin:48px auto;padding:24px;font:18px/1.65 system-ui;color:#163d35"><p>DUIT · BUSINESS PROFILE</p><h1>${escape(card.title)}</h1><p>${escape([card.role, card.company].filter(Boolean).join(' · '))}</p><p>${escape(card.subtitle || card.bio)}</p>${(card.panels || []).map(p => `<section><h2>${escape(p.panelType)}</h2><p>${escape(p.body)}</p></section>`).join('')}<p><a href="${escape(`${basePath()}/api/v1/public/cards/${card.slug}/vcard`)}">Save contact</a> · <a href="${escape(`${basePath()}/download`)}">Get DUIT</a></p></main>`;
}
async function shell(dist, card) {
  let html;
  try {
    html = await fs.readFile(path.join(dist, 'index.html'), 'utf8');
  } catch {
    html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DUIT private pilot</title></head><body><div id="root"></div></body></html>';
  }
  const prefix = basePath();
  const title = card ? `${card.title} · ${card.company || 'Business profile'} · DUIT` : 'DUIT — Make the next meeting count';
  const description = card ? (card.subtitle || card.bio || card.panels?.[0]?.body || 'A business introduction on DUIT').slice(0, 250) : 'Share what you do. Remember who you met. Make the next meeting count.';
  html = html.replace(/<title>[\s\S]*?<\/title>/i, '').replace(/<meta[^>]+name=["']description["'][^>]*>/gi, '');
  const metadata = `<title>${escape(title)}</title><meta name="description" content="${escape(description)}"><meta name="robots" content="noindex,nofollow"><meta name="duit-base-path" content="${escape(prefix)}"><base href="${escape(prefix || '')}/"><meta property="og:type" content="profile"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}">${card?.imageUrl ? `<meta property="og:image" content="${escape(card.imageUrl)}">` : ''}${card ? `<meta property="og:url" content="${escape(`${publicOrigin()}/c/${card.slug}`)}">` : ''}`;
  html = html.replace('</head>', metadata + '</head>');
  if (prefix) html = html.replace(/((?:src|href)=["'])\/(assets|demo)\//g, `$1${prefix}/$2/`);
  if (card) html = html.replace(/<div id=["']root["']><\/div>/, `<div id="root">${minimal(card)}</div>`);
  return html;
}
const readApkRelease = createApkReleaseReader();
export function webRouter() {
  const router = Router();
  const dist = process.env.WEB_DIST_DIR || defaultDist;
  const staticOptions = {
    dotfiles: 'deny',
    fallthrough: false,
    index: false,
    maxAge: '1d',
    setHeaders: res => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
  };
  router.use('/assets', express.static(path.join(dist, 'assets'), staticOptions));
  router.use('/demo', express.static(path.join(dist, 'demo'), staticOptions));
  router.get('/robots.txt', (_req, res) => res.type('text/plain').send('User-agent: *\nDisallow: /\n'));
  router.get('/downloads/release.json', wrap(async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!process.env.PILOT_APK_URL) fail(404, 'No published APK release is configured', 'APK_UNAVAILABLE');
    try {
      res.json(await readApkRelease(process.env.PILOT_APK_URL));
    } catch {
      fail(503, 'Release details are temporarily unavailable', 'APK_METADATA_UNAVAILABLE');
    }
  }));
  router.get('/downloads/DUIT-2026-Pilot.apk', wrap(async (req, res) => {
    if (process.env.PILOT_APK_URL) {
      const target = new URL(process.env.PILOT_APK_URL);
      if (target.protocol !== 'https:' || target.hostname !== 'github.com' || !target.pathname.startsWith('/prakhar-goel/duit-cards-2025/releases/download/')) fail(500, 'Invalid APK release URL');
      // Keep the browser availability probe on this origin; GitHub redirects do not allow fetch CORS.
      res.setHeader('Cache-Control', 'private, no-store');
      if (req.method === 'HEAD') return res.type('application/vnd.android.package-archive').status(200).end();
      // The stable channel remains the entry point; use the verified versioned
      // asset so Android's Downloads folder identifies the installed release.
      if (target.pathname.includes('/staging-latest/')) {
        try {
          const release = await readApkRelease(target.href);
          return res.redirect(302, release.downloadUrl);
        } catch {
          // Preserve download availability during a metadata provider outage.
        }
      }
      return res.redirect(302, target.href);
    }
    const apk = process.env.PILOT_APK_PATH || defaultApk;
    try {
      await fs.access(apk);
    } catch {
      fail(404, 'The pilot APK has not been built yet', 'APK_UNAVAILABLE');
    }
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="DUIT-2026-Pilot.apk"');
    res.setHeader('Cache-Control', 'private, no-store');
    res.sendFile(apk, {
      dotfiles: 'allow'
    });
  }));
  router.get('/c/:slug', wrap(async (req, res) => {
    const published = await publishedCard(req.params.slug);
    const card = presentPublicCard(published.snapshot, req);
    res.type('html').send(await shell(dist, card));
  }));
  router.get('/s/:token', wrap(async (req, res) => {
    const share = (await query('SELECT card_id FROM share_links WHERE token_hash=$1 AND expires_at>now() AND revoked_at IS NULL', [hash(req.params.token)])).rows[0];
    if (!share) fail(404, 'Invitation not found');
    const published = await publicCardById(share.card_id);
    res.type('html').send(await shell(dist, presentPublicCard(published.snapshot, req)));
  }));
  router.get(['/', '/download', '/admin', '/admin/{*path}'], wrap(async (req, res) => res.type('html').send(await shell(dist))));
  return router;
}
