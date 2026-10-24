/**
 * Cryptographic helpers (no third-party code): token generation, hashing for lookup, and password hashing.
 *  - Password hashes use scrypt (memory-hard, runs on libuv's thread-pool so it never blocks the event loop).
 *    Parameters live inside each stored hash, so they can be raised later without invalidating old hashes.
 *  - Opaque tokens are 256 random bits; only their SHA-256 is ever stored, so a database leak yields nothing replayable.
 */
import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);

export const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');
export const uuid = () => crypto.randomUUID();

/** OWASP-recommended scrypt cost (N=2^15, r=8, p=3 ≈ 32 MiB). */
export const SCRYPT = Object.freeze({ N: 2 ** 15, r: 8, p: 3, keyLen: 32, saltLen: 16 });
const maxmem = (n, r) => 256 * n * r;                                  // comfortably above the 128·N·r the algorithm needs

export async function hashPassword(plain, params = SCRYPT) {
  const salt = crypto.randomBytes(params.saltLen);
  const key = await scrypt(plain.normalize('NFKC'), salt, params.keyLen, { N: params.N, r: params.r, p: params.p, maxmem: maxmem(params.N, params.r) });
  return ['scrypt', params.N, params.r, params.p, salt.toString('base64'), key.toString('base64')].join('$');
}

/** Constant-time check. Malformed or foreign hashes simply fail — they never throw. */
export async function verifyPassword(plain, stored) {
  const [scheme, n, r, p, salt, key] = String(stored ?? '').split('$');
  if (scheme !== 'scrypt' || !key) return false;
  const params = { N: Number(n), r: Number(r), p: Number(p) };
  if (![params.N, params.r, params.p].every(Number.isInteger) || params.N < 2 ** 14 || params.N > 2 ** 20) return false;   // refuse absurd/forged costs
  const expected = Buffer.from(key, 'base64');
  const actual = await scrypt(plain.normalize('NFKC'), Buffer.from(salt, 'base64'), expected.length, { ...params, maxmem: maxmem(params.N, params.r) });
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

/** True when a stored hash was made with weaker parameters than today's — rehash on next successful sign-in. */
export const needsRehash = (stored) => {
  const [scheme, n, r, p] = String(stored ?? '').split('$');
  return scheme !== 'scrypt' || Number(n) < SCRYPT.N || Number(r) < SCRYPT.r || Number(p) < SCRYPT.p;
};
