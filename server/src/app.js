import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import { createUrl, findByCode, incrementClicks, listUrls } from './store.js';
import { validCode, validUrl } from './validation.js';

const DEFAULT_RATE_LIMIT = 10;
const DEFAULT_RATE_WINDOW_MS = 60 * 1000;

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function createRateLimiter({ limit, windowMs }) {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const current = requests.get(key);
    const entry = current && now - current.startedAt < windowMs
      ? current
      : { startedAt: now, count: 0 };

    entry.count += 1;
    requests.set(key, entry);

    if (entry.count > limit) {
      const retryAfter = Math.ceil((entry.startedAt + windowMs - now) / 1000);
      res.set('Retry-After', String(Math.max(1, retryAfter)));
      return res.status(429).json({ error: 'Too many URL creation requests. Try again later.' });
    }

    return next();
  };
}

function generateCode() {
  return crypto.randomBytes(6).toString('base64url').slice(0, 6);
}

function getShortUrl(req, code) {
  const configuredBaseUrl = process.env.BASE_URL;
  const baseUrl = configuredBaseUrl || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl.replace(/\/+$/, '')}/${code}`;
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export function createApp() {
  const app = express();
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const rateLimit = positiveNumber(process.env.URL_RATE_LIMIT, DEFAULT_RATE_LIMIT);
  const rateWindowMs = positiveNumber(process.env.URL_RATE_WINDOW_MS, DEFAULT_RATE_WINDOW_MS);

  app.disable('x-powered-by');
  app.use(cors({ origin: clientUrl }));
  app.use(express.json({ limit: '10kb', strict: true }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.get('/api/urls', (_req, res) => res.json({ urls: listUrls() }));

  app.post('/api/urls', createRateLimiter({ limit: rateLimit, windowMs: rateWindowMs }), asyncHandler(async (req, res) => {
    const originalUrl = req.body?.originalUrl;
    if (typeof originalUrl !== 'string' || !validUrl(originalUrl.trim())) {
      return res.status(400).json({ error: 'Enter a valid HTTP or HTTPS URL.' });
    }

    const normalizedUrl = originalUrl.trim();
    let record;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = generateCode();
      if (findByCode(code)) continue;

      record = {
        code,
        originalUrl: normalizedUrl,
        clicks: 0,
        createdAt: new Date().toISOString(),
      };

      try {
        await createUrl(record);
        break;
      } catch (error) {
        if (error.code !== 'DUPLICATE_CODE') throw error;
        record = undefined;
      }
    }

    if (!record) return res.status(503).json({ error: 'Could not allocate a short code. Try again.' });
    return res.status(201).json({ ...record, shortUrl: getShortUrl(req, record.code) });
  }));

  app.get('/:code', asyncHandler(async (req, res) => {
    if (!validCode(req.params.code)) return res.status(404).json({ error: 'Short URL not found.' });

    const item = findByCode(req.params.code);
    if (!item) return res.status(404).json({ error: 'Short URL not found.' });
    if (!validUrl(item.originalUrl)) {
      return res.status(410).json({ error: 'This short URL points to an unsafe destination.' });
    }

    await incrementClicks(item.code);
    return res.redirect(302, item.originalUrl);
  }));

  app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));

  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Request body must contain valid JSON.' });
    }
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body is too large.' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}

export const app = createApp();
export { validCode, validUrl };
