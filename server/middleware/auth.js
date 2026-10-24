import { config } from '../config.js';
import { verifyAccessToken } from '../lib/jwt.js';
import { isSessionActive } from '../services/session.js';
import { unauthorized, forbidden } from './errors.js';

const cookieBase = { httpOnly: true, sameSite: 'strict', secure: config.cookieSecure };

/** Access token: short-lived, only sent to /api. */
export const accessCookie = () => ({ ...cookieBase, path: '/api', maxAge: config.accessTokenSeconds * 1000 });
/** Refresh token: lives as long as the session, but is only ever sent to /api/auth. */
export const refreshCookie = (maxAge) => ({ ...cookieBase, path: '/api/auth', maxAge });

/** Writes (or clears) both cookies in one place so they can never drift apart. */
export function setAuthCookies(res, { accessToken, refreshToken, refreshMaxAgeMs }) {
  res.cookie(config.accessCookie, accessToken, accessCookie());
  if (refreshToken) res.cookie(config.refreshCookie, refreshToken, refreshCookie(refreshMaxAgeMs));
}
export function clearAuthCookies(res) {
  res.clearCookie(config.accessCookie, { ...cookieBase, path: '/api' });
  res.clearCookie(config.refreshCookie, { ...cookieBase, path: '/api/auth' });
}

/**
 * Resolves the signed-in student from the access JWT. No database call on the hot path: the signature proves the
 * claims, and a 30 s cache answers whether the session behind it has been revoked.
 */
export async function sessionLoader(req, _res, next) {
  const raw = req.cookies?.[config.accessCookie];
  if (!raw) return next();
  const claims = await verifyAccessToken(raw);
  if (claims && await isSessionActive(claims.sid)) {
    req.student = { id: claims.id, regNo: claims.regNo, fullName: claims.fullName, programId: claims.programId };
    req.sessionId = claims.sid;
  }
  next();
}

export function requireAuth(req, _res, next) {
  if (!req.student) return next(unauthorized());
  next();
}

/**
 * CSRF defence in depth (on top of SameSite=Strict): every state-changing API call must carry a custom header that a
 * cross-site form or <img> cannot send, and — when the browser sends an Origin — it must be this site.
 */
export function csrfGuard(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('x-requested-with') !== 'uit-portal') return next(forbidden('Missing request header.'));
  const origin = req.get('origin');
  if (origin) {
    let host = null;
    try { host = new URL(origin).host; } catch { /* malformed → rejected below */ }
    if (host !== req.get('host')) return next(forbidden('Cross-site request blocked.'));
  }
  next();
}
