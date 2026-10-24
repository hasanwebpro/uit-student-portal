/**
 * Access tokens: short-lived, signed (HS256) JWTs carried in an httpOnly cookie, never in JavaScript-readable storage.
 * The algorithm is pinned on both sides, and issuer, audience and expiry are always checked, which rules out the
 * classic `alg: none` / algorithm-confusion and token-replay-across-services mistakes.
 */
import { SignJWT, jwtVerify } from 'jose';
import { config } from '../config.js';

const key = new TextEncoder().encode(config.jwt.secret);
const ALG = 'HS256';
const base = { issuer: config.jwt.issuer, audience: config.jwt.audience };

/** claims: { sub: studentId, sid: sessionId, reg, name, pid } */
export function signAccessToken(claims, ttlSeconds = config.accessTokenSeconds) {
  return new SignJWT({ sid: claims.sid, reg: claims.reg, name: claims.name, pid: claims.pid })
    .setProtectedHeader({ alg: ALG, typ: 'JWT' })
    .setSubject(String(claims.sub))
    .setIssuer(base.issuer)
    .setAudience(base.audience)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(key);
}

/** Returns the claims, or null for anything wrong (bad signature, expired, wrong audience, malformed …). */
export async function verifyAccessToken(token) {
  try {
    const { payload } = await jwtVerify(token, key, { ...base, algorithms: [ALG], clockTolerance: 5 });
    const id = Number(payload.sub);
    if (!Number.isInteger(id) || typeof payload.sid !== 'string') return null;
    return { id, sid: payload.sid, regNo: payload.reg, fullName: payload.name, programId: payload.pid };
  } catch {
    return null;
  }
}
