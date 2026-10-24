import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';
import * as auth from '../controllers/auth.controller.js';

const limiter = (options) => rateLimit({ standardHeaders: true, legacyHeaders: false, ...options });

/** 30 attempts / 15 min / IP … */
const perIp = limiter({ windowMs: 15 * 60_000, limit: 30, message: { error: 'Too many sign-in attempts. Please wait a few minutes.' } });
/** … and 10 / 15 min per IP+account, so one address cannot grind a single student's password. */
const perAccount = limiter({
  windowMs: 15 * 60_000, limit: 10, message: { error: 'Too many sign-in attempts. Please wait a few minutes.' },
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}|${String(req.body?.regNo ?? '').trim().toLowerCase().slice(0, 40)}`,
});
const perIpRefresh = limiter({ windowMs: 60_000, limit: 60, message: { error: 'Too many requests. Slow down a little.' } });

const passThrough = (_req, _res, next) => next();

export function authRoutes({ limits = true } = {}) {
  const r = Router();
  r.post('/login', ...(limits ? [perIp, perAccount] : [passThrough]), auth.login);
  r.post('/refresh', limits ? perIpRefresh : passThrough, auth.refresh);
  r.post('/logout', auth.logout);
  r.get('/me', auth.me);
  r.post('/change-password', requireAuth, auth.changePassword);
  return r;
}
