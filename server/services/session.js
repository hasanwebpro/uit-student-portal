/**
 * Session lifecycle (Single Responsibility: *when* a sign-in is valid — credentials are services/auth.js).
 *
 *   sign in ──► access JWT (15 min, stateless)  +  refresh token (opaque, rotating, stored hashed)
 *   refresh ──► new access JWT + NEW refresh token; the old one is remembered for `refreshGraceSeconds`
 *   replay  ──► an older refresh token presented after the grace window means it leaked: the whole session is revoked
 *
 * Access tokens are verified without a database call; a short-lived cache answers "was this session revoked?" so that
 * sign-out and password changes take effect within `sessionCheckTtlMs` even though JWTs are stateless.
 */
import { config } from '../config.js';
import { AuthSession, Op, Student } from '../models/index.js';
import { appCache } from '../lib/cache.js';
import { randomToken, sha256 } from '../lib/crypto.js';
import { signAccessToken } from '../lib/jwt.js';
import { unauthorized } from '../middleware/errors.js';
import { log } from './activity.js';

export const lifetimeMs = (remember) => (remember ? config.rememberDays * 86_400_000 : config.sessionHours * 3_600_000);
const activeKey = (sid) => `g:session:${sid}`;

/** Pure decision table for a presented refresh token — kept separate from I/O so every branch is unit-tested. */
export function evaluateRefresh(session, presentedHash, now = Date.now(), graceMs = config.refreshGraceSeconds * 1000) {
  if (!session) return 'unknown';
  if (session.revokedAt || new Date(session.expiresAt).getTime() <= now) return 'expired';
  if (session.refreshHash === presentedHash) return 'rotate';
  if (session.prevRefreshHash === presentedHash) return now - new Date(session.rotatedAt).getTime() <= graceMs ? 'grace' : 'reuse';
  return 'unknown';
}

const accessFor = (student, sid) => signAccessToken({ sub: student.id, sid, reg: student.regNo, name: student.fullName, pid: student.programId });

export async function openSession(student, { remember = false, ip, userAgent } = {}) {
  const refreshToken = randomToken();
  const ttl = lifetimeMs(remember);
  const session = await AuthSession.create({
    studentId: student.id, refreshHash: sha256(refreshToken), ip, userAgent: (userAgent ?? '').slice(0, 200), expiresAt: new Date(Date.now() + ttl),
  });
  return { accessToken: await accessFor(student, session.id), refreshToken, refreshMaxAgeMs: ttl, sessionId: session.id };
}

/**
 * Exchanges a refresh token for fresh credentials. Throws 401 for anything but a valid token.
 * `refreshToken` in the result is null during the grace window (the winning request already set the new cookie).
 */
export async function refreshSession(rawToken, { ip } = {}) {
  if (!rawToken) throw unauthorized();
  const presented = sha256(rawToken);
  const session = await AuthSession.findOne({ where: { [Op.or]: [{ refreshHash: presented }, { prevRefreshHash: presented }] } });
  const verdict = evaluateRefresh(session, presented);

  if (verdict === 'reuse') {
    await revokeSession(session.id);
    await log(session.studentId, 'Security', 'Refresh token reuse detected — session revoked', ip);
  }
  if (verdict !== 'rotate' && verdict !== 'grace') throw unauthorized();

  const student = await Student.findByPk(session.studentId);
  if (!student) throw unauthorized();

  if (verdict === 'grace') {
    return { student, accessToken: await accessFor(student, session.id), refreshToken: null, refreshMaxAgeMs: 0, sessionId: session.id };
  }
  const next = randomToken();
  // compare-and-set: if a parallel request rotated first, this updates 0 rows and we treat ourselves as the loser (grace)
  const [won] = await AuthSession.update(
    { refreshHash: sha256(next), prevRefreshHash: presented, rotatedAt: new Date() },
    { where: { id: session.id, refreshHash: presented, revokedAt: null } },
  );
  const accessToken = await accessFor(student, session.id);
  return won
    ? { student, accessToken, refreshToken: next, refreshMaxAgeMs: Math.max(0, new Date(session.expiresAt).getTime() - Date.now()), sessionId: session.id }
    : { student, accessToken, refreshToken: null, refreshMaxAgeMs: 0, sessionId: session.id };
}

/** Cached "is this session still alive?" — positive answers only, so a revocation is never hidden by a cached `false`. */
export async function isSessionActive(sid) {
  if (appCache.get(activeKey(sid))) return true;
  const row = await AuthSession.findOne({ where: { id: sid, revokedAt: null, expiresAt: { [Op.gt]: new Date() } }, attributes: ['id'], raw: true });
  if (row) appCache.set(activeKey(sid), true, config.sessionCheckTtlMs);
  return !!row;
}

export async function revokeSession(sid) {
  appCache.delete(activeKey(sid));
  await AuthSession.update({ revokedAt: new Date() }, { where: { id: sid, revokedAt: null } });
}

export async function revokeByRefreshToken(rawToken) {
  const hash = sha256(rawToken);
  const session = await AuthSession.findOne({ where: { [Op.or]: [{ refreshHash: hash }, { prevRefreshHash: hash }] }, attributes: ['id'], raw: true });
  if (session) await revokeSession(session.id);
}

/** "Sign out everywhere else" — used after a password change. */
export async function revokeOtherSessions(studentId, keepSid) {
  const others = await AuthSession.findAll({ where: { studentId, revokedAt: null, ...(keepSid ? { id: { [Op.ne]: keepSid } } : {}) }, attributes: ['id'], raw: true });
  for (const { id } of others) appCache.delete(activeKey(id));
  await AuthSession.update({ revokedAt: new Date() }, { where: { id: { [Op.in]: others.map((o) => o.id) } } });
}

/** MySQL has no TTL indexes: expired or long-revoked rows are swept at boot and hourly (see server/index.js). */
export const sweepSessions = () => AuthSession.destroy({
  where: { [Op.or]: [{ expiresAt: { [Op.lte]: new Date() } }, { revokedAt: { [Op.lte]: new Date(Date.now() - 7 * 86_400_000) } }] },
});
