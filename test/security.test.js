import test from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import { hashPassword, verifyPassword, needsRehash, sha256, randomToken, SCRYPT } from '../server/lib/crypto.js';
import { signAccessToken, verifyAccessToken } from '../server/lib/jwt.js';
import { evaluateRefresh } from '../server/services/session.js';
import { loadConfig } from '../server/config.js';

test('passwords: scrypt hashes verify, salt differs, wrong/odd inputs fail without throwing', async () => {
  const a = await hashPassword('Portal@2026');
  const b = await hashPassword('Portal@2026');
  assert.notEqual(a, b, 'every hash has its own salt');
  assert.ok(a.startsWith('scrypt$32768$8$3$'));
  assert.equal(await verifyPassword('Portal@2026', a), true);
  assert.equal(await verifyPassword('portal@2026', a), false);
  for (const junk of [undefined, null, '', 'plaintext', 'scrypt$x$y$z$a$b', 'bcrypt$10$abc', 'scrypt$1073741824$8$1$AAAA$AAAA']) {
    assert.equal(await verifyPassword('x', junk), false, `rejects ${junk}`);
  }
  assert.equal(needsRehash(a), false);
  assert.equal(needsRehash('$2a$10$abcdefghijklmnopqrstuuG0C0'), true);
  assert.ok(SCRYPT.N >= 2 ** 15);
});

test('passwords: Unicode is normalised so the same text typed on different keyboards matches', async () => {
  const h = await hashPassword('café-Pass1');
  assert.equal(await verifyPassword('café-Pass1', h), true);
});

test('tokens: random, URL-safe, long enough; sha256 is stable', () => {
  const t = randomToken();
  assert.match(t, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(t, randomToken());
  assert.equal(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

const claims = { sub: 42, sid: 'sess-1', reg: '23FA-001-SE', name: 'Demo Student', pid: 1 };

test('JWT: round-trips the claims', async () => {
  const out = await verifyAccessToken(await signAccessToken(claims));
  assert.deepEqual(out, { id: 42, sid: 'sess-1', regNo: '23FA-001-SE', fullName: 'Demo Student', programId: 1 });
});

test('JWT: rejects tampering, other keys, wrong audience, alg=none, expiry and junk', async () => {
  const good = await signAccessToken(claims);
  const [h, p, s] = good.split('.');
  const forgedPayload = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(p, 'base64url')), sub: '1' })).toString('base64url');
  assert.equal(await verifyAccessToken(`${h}.${forgedPayload}.${s}`), null, 'edited payload');

  const other = new TextEncoder().encode('x'.repeat(48));
  const mk = (key, aud = 'uit-portal-web', exp = '5m') => new SignJWT({ sid: 's' }).setProtectedHeader({ alg: 'HS256' }).setSubject('1').setIssuer('uit-portal').setAudience(aud).setExpirationTime(exp).sign(key);
  assert.equal(await verifyAccessToken(await mk(other)), null, 'signed with another secret');
  assert.equal(await verifyAccessToken(await mk(other, 'someone-else')), null, 'wrong audience');

  const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${p}.`;
  assert.equal(await verifyAccessToken(none), null, 'alg none');

  const expired = await new SignJWT({ sid: 's' }).setProtectedHeader({ alg: 'HS256' }).setSubject('1').setIssuer('uit-portal').setAudience('uit-portal-web')
    .setIssuedAt(Math.floor(Date.now() / 1000) - 3600).setExpirationTime(Math.floor(Date.now() / 1000) - 600).sign(new TextEncoder().encode(process.env.__never ?? 'irrelevant'));
  assert.equal(await verifyAccessToken(expired), null, 'expired (and wrong key)');
  for (const junk of ['', 'a.b.c', 'not-a-jwt', undefined]) assert.equal(await verifyAccessToken(junk), null);
});

test('refresh decision table: rotate, grace, reuse, expired, unknown', () => {
  const now = Date.now();
  const row = (over = {}) => ({ refreshHash: 'NEW', prevRefreshHash: 'OLD', rotatedAt: new Date(now - 2_000), expiresAt: new Date(now + 3_600_000), revokedAt: null, ...over });
  assert.equal(evaluateRefresh(row(), 'NEW', now, 10_000), 'rotate');
  assert.equal(evaluateRefresh(row(), 'OLD', now, 10_000), 'grace', 'two tabs racing');
  assert.equal(evaluateRefresh(row({ rotatedAt: new Date(now - 60_000) }), 'OLD', now, 10_000), 'reuse', 'replayed after the grace window = theft');
  assert.equal(evaluateRefresh(row(), 'GUESS', now, 10_000), 'unknown');
  assert.equal(evaluateRefresh(null, 'NEW', now, 10_000), 'unknown');
  assert.equal(evaluateRefresh(row({ revokedAt: new Date(now - 1) }), 'NEW', now, 10_000), 'expired');
  assert.equal(evaluateRefresh(row({ expiresAt: new Date(now - 1) }), 'NEW', now, 10_000), 'expired');
});

test('config: defaults, validation and production safety', () => {
  const dev = loadConfig({});
  assert.equal(dev.port, 3000); assert.equal(dev.db.database, 'uit_portal'); assert.equal(dev.jwt.ephemeral, true); assert.equal(dev.isProd, false);
  assert.throws(() => loadConfig({ NODE_ENV: 'production' }), /JWT_SECRET/, 'production refuses to boot without a secret');
  assert.throws(() => loadConfig({ JWT_SECRET: 'short' }), /at least 32/);
  assert.throws(() => loadConfig({ PORT: '99999' }), /PORT/);
  assert.throws(() => loadConfig({ MYSQL_DATABASE: 'bad name; DROP' }), /MYSQL_DATABASE/);
  const prod = loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(40), MYSQL_PASSWORD: 'p' });
  assert.equal(prod.seedDemo, false, 'no public demo password in production'); assert.equal(prod.cookieSecure, true);
  assert.equal(loadConfig({ SEED_DEMO: 'true' }).seedDemo, true);
  assert.equal(prod.isProd, true); assert.equal(prod.jwt.ephemeral, false); assert.equal(prod.trustProxy, 1); assert.equal(prod.logLevel, 'info');
});
