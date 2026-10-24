import path from 'node:path';
import crypto from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import { sessionLoader, csrfGuard } from './middleware/auth.js';
import { invalidateOnWrite } from './middleware/cache.js';
import { errorHandler } from './middleware/errors.js';
import { apiRouter } from './routes/index.js';

const CSP = {
  useDefaults: false,
  directives: {
    'default-src': ["'self'"], 'script-src': ["'self'"], 'style-src': ["'self'"], 'img-src': ["'self'", 'data:'],
    'font-src': ["'self'"], 'connect-src': ["'self'"], 'manifest-src': ["'self'"], 'worker-src': ["'self'"],
    'object-src': ["'none'"], 'base-uri': ["'self'"], 'form-action': ["'self'"], 'frame-ancestors': ["'none'"],
    ...(config.cookieSecure ? { 'upgrade-insecure-requests': [] } : {}),   // only when the site is really served over https
  },
};

/** Browser features the portal never uses are switched off, so injected code could not turn them on either. */
const PERMISSIONS = 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=(), interest-cohort=()';

/**
 * Builds the Express app.
 *  - `rateLimits: false` is for the test-suite only.
 *  - `ready` is the readiness probe (defaults to "always ready"; index.js wires it to a database ping).
 */
export function createApp({ rateLimits = true, ready = async () => true } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  app.use(pinoHttp({
    logger, genReqId: (req, res) => { const id = req.get('x-request-id')?.slice(0, 64) || crypto.randomUUID(); res.setHeader('X-Request-Id', id); return id; },
    autoLogging: { ignore: (req) => req.url === '/healthz' || req.url === '/readyz' },
    serializers: { req: (req) => ({ id: req.id, method: req.method, url: req.url }), res: (res) => ({ status: res.statusCode }) },
  }));
  app.use(helmet({ contentSecurityPolicy: CSP, crossOriginEmbedderPolicy: false, referrerPolicy: { policy: 'same-origin' } }));
  app.use((_req, res, next) => { res.set('Permissions-Policy', PERMISSIONS); next(); });

  // ── probes (cheap, unauthenticated, never cached) ───────
  app.get('/healthz', (_req, res) => res.set('Cache-Control', 'no-store').json({ status: 'ok' }));
  app.get('/readyz', async (_req, res) => {
    res.set('Cache-Control', 'no-store');
    const ok = await ready().catch(() => false);
    res.status(ok ? 200 : 503).json({ status: ok ? 'ready' : 'unavailable' });
  });

  app.use(compression());
  app.use(express.json({ limit: '32kb', strict: true }));
  app.use(cookieParser());

  // ── API (the "controller" tier) ──────────────────────────
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  if (rateLimits) {
    app.use('/api', rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests. Slow down a little.' } }));
  }
  app.use('/api', csrfGuard, sessionLoader, invalidateOnWrite, apiRouter({ limits: rateLimits }));

  // ── React build (the "view" tier) ────────────────────────
  const dist = config.clientDist;
  app.use(express.static(dist, {
    index: false, etag: true,
    setHeaders(res, file) {
      const name = path.basename(file);
      // Vite fingerprints everything under /assets, so it can be cached for a year
      res.set('Cache-Control', file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable'
        : name === 'sw.js' || name.endsWith('.html') ? 'no-cache' : 'public, max-age=3600');
    },
  }));
  // History-API fallback so deep links such as /attendance work on refresh
  app.use((req, res, next) => {
    if (req.method !== 'GET' || !req.accepts('html')) return next();
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(dist, 'index.html'), (err) => err && next());
  });

  app.use(errorHandler);
  return app;
}
