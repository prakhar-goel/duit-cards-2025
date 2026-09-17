import express from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { authRouter } from './auth.js';
import { cardsRouter } from './cards.js';
import { sharesRouter } from './shares.js';
import { relationshipsRouter } from './relationships.js';
import { mediaRouter } from './media.js';
import { adminRouter } from './admin.js';
import { aiRouter } from './ai-jobs.js';
import { webRouter } from './web.js';
import { rateLimit } from './common.js';
export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    req.requestId = crypto.randomUUID();
    res.setHeader('X-Request-ID', req.requestId);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(self)');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https: http:; connect-src 'self'; media-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'");
    next();
  });
  const origins = (process.env.APP_ORIGIN || 'http://localhost:48153').split(',').map(v => v.trim());
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && origins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  app.get('/health', (_req, res) => res.json({
    status: 'ok',
    service: 'duit-private-pilot'
  }));
  app.use(rateLimit({
    max: 300
  }));
  app.use(express.json({
    limit: '18mb'
  }));
  app.use('/api/v1', authRouter(), cardsRouter(), sharesRouter(), mediaRouter(), adminRouter(), aiRouter(), relationshipsRouter());
  app.use(webRouter());
  app.use((req, res) => res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    },
    requestId: req.requestId
  }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    let status = error.status || 500;
    let code = error.code || 'INTERNAL_ERROR';
    let message = error.message;
    let details;
    if (error instanceof z.ZodError) {
      status = 400;
      code = 'INVALID_REQUEST';
      message = 'Please check the supplied details';
      details = error.issues;
    } else if (error.code === '23505') {
      status = 409;
      code = 'ALREADY_EXISTS';
      message = 'That value is already in use';
    } else if (['22P02', '22007', '22008'].includes(error.code)) {
      status = 400;
      code = 'INVALID_REQUEST';
      message = 'A supplied ID or date is invalid';
    } else if (error.code === '23503') {
      status = 409;
      code = 'RELATED_RECORD_UNAVAILABLE';
      message = 'A related record is no longer available';
    } else if (error.type === 'entity.too.large') {
      status = 413;
      code = 'UPLOAD_TOO_LARGE';
      message = 'Upload is too large';
    } else if (error instanceof SyntaxError && 'body' in error) {
      status = 400;
      code = 'INVALID_JSON';
      message = 'Invalid JSON request';
    }
    if (status >= 500 && !['AiProviderError', 'HttpError'].includes(error.name)) {
      console.error('API request failed', {
        requestId: req.requestId,
        code: error.code || 'UNKNOWN',
        message: error.message
      });
      message = 'The request could not be completed. Please try again.';
    }
    res.status(status).json({
      error: {
        code,
        message,
        ...(details ? {
          details
        } : {})
      },
      requestId: req.requestId
    });
  });
  return app;
}
