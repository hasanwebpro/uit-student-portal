/**
 * End-to-end API tests against a REAL MySQL/MariaDB. They are skipped unless RUN_DB_TESTS=1, because they drop and
 * re-create every table in MYSQL_DATABASE (use a scratch database, e.g. uit_portal_test). CI runs them on every push.
 *
 *   RUN_DB_TESTS=1 MYSQL_DATABASE=uit_portal_test MYSQL_PASSWORD=… npm run test:integration
 */
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';

const enabled = process.env.RUN_DB_TESTS === '1';
const suite = enabled ? test : test.skip;
process.env.NODE_ENV = 'test';

let server; let base; let models; let db;

/** Minimal cookie-jar client so tests behave like a browser (and can assert on the cookie attributes). */
class Browser {
  jar = new Map(); attrs = new Map();
  async call(method, path, body, headers = {}) {
    const cookie = [...this.jar].map(([k, v]) => `${k}=${v}`).join('; ');
    const res = await fetch(`${base}${path}`, {
      method, redirect: 'manual',
      headers: { 'X-Requested-With': 'uit-portal', ...(body !== undefined && { 'Content-Type': 'application/json' }), ...(cookie && { Cookie: cookie }), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    for (const line of res.headers.getSetCookie()) {
      const [pair, ...attrs] = line.split('; ');
      const i = pair.indexOf('=');
      const [name, value] = [pair.slice(0, i), pair.slice(i + 1)];
      if (value === '' || /expires=Thu, 01 Jan 1970/i.test(attrs.join(';'))) { this.jar.delete(name); this.attrs.delete(name); } else { this.jar.set(name, value); this.attrs.set(name, attrs.join('; ')); }
    }
    const text = await res.text();
    let json = null; try { json = JSON.parse(text); } catch { /* not JSON */ }
    return { status: res.status, json, headers: res.headers };
  }
  get = (p) => this.call('GET', p);
  post = (p, b = {}) => this.call('POST', p, b);
  put = (p, b = {}) => this.call('PUT', p, b);
  del = (p) => this.call('DELETE', p);
  async login(regNo = '23FA-001-SE', password = 'Portal@2026', remember = false) { return this.post('/api/auth/login', { regNo, password, remember }); }
}

before(async () => {
  if (!enabled) return;
  db = await import('../../server/db.js');
  models = await import('../../server/models/index.js');
  const { seed } = await import('../../server/seed/index.js');
  const { createApp } = await import('../../server/app.js');
  await db.connectWithRetry();
  await seed();
  server = createApp({ rateLimits: false, ready: db.pingDb }).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (!enabled) return;
  await new Promise((r) => server.close(r));
  await db.disconnectDb();
});

suite('probes: /healthz and /readyz (database ping)', async () => {
  const b = new Browser();
  assert.equal((await b.get('/healthz')).status, 200);
  assert.deepEqual((await b.get('/readyz')).json, { status: 'ready' });
});

suite('security headers are present on every kind of response', async () => {
  const { headers } = await new Browser().get('/api/auth/me');
  assert.match(headers.get('content-security-policy'), /default-src 'self'/);
  assert.match(headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.equal(headers.get('x-content-type-options'), 'nosniff');
  assert.equal(headers.get('cache-control'), 'no-store');
  assert.match(headers.get('permissions-policy'), /camera=\(\)/);
  assert.equal(headers.get('x-powered-by'), null);
  assert.ok(headers.get('x-request-id'));
});

suite('anonymous: /auth/me is 200 {student:null}; protected routes are 401; unknown API is 404 JSON', async () => {
  const b = new Browser();
  assert.deepEqual((await b.get('/api/auth/me')).json, { student: null });
  for (const p of ['/api/dashboard', '/api/courses', '/api/todos', '/api/profile', '/api/fees/ledger']) assert.equal((await b.get(p)).status, 401, p);
  const missing = await b.get('/api/nope');
  assert.ok([401, 404].includes(missing.status));
});

suite('CSRF: writes without the custom header or with a foreign Origin are refused', async () => {
  const b = new Browser();
  await b.login();
  const noHeader = await fetch(`${base}/api/todos`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: [...b.jar].map(([k, v]) => `${k}=${v}`).join('; ') }, body: '{}' });
  assert.equal(noHeader.status, 403);
  const foreign = await b.call('POST', '/api/todos', { task: 'x' }, { Origin: 'https://evil.example' });
  assert.equal(foreign.status, 403);
});

suite('login: wrong password → 401 with no account hint; unknown user → same answer', async () => {
  const b = new Browser();
  const wrong = await b.login('23FA-001-SE', 'nope');
  const unknown = await b.login('99XX-999-ZZ', 'nope');
  assert.equal(wrong.status, 401); assert.equal(unknown.status, 401);
  assert.equal(wrong.json.error, unknown.json.error);
  assert.equal(b.jar.size, 0, 'no cookies on failure');
  assert.equal((await b.post('/api/auth/login', { regNo: '', password: '' })).status, 422);
});

suite('login: sets httpOnly SameSite=Strict cookies scoped to the right paths; no token in the body', async () => {
  const b = new Browser();
  const res = await b.login('23fa-001-se');
  assert.equal(res.status, 200);
  assert.equal(res.json.student.regNo, '23FA-001-SE');
  assert.ok(!JSON.stringify(res.json).match(/eyJ/), 'JWT never appears in JSON');
  assert.match(b.attrs.get('uit_at'), /HttpOnly/i); assert.match(b.attrs.get('uit_at'), /SameSite=Strict/i); assert.match(b.attrs.get('uit_at'), /Path=\/api(;|$)/);
  assert.match(b.attrs.get('uit_rt'), /HttpOnly/i); assert.match(b.attrs.get('uit_rt'), /SameSite=Strict/i); assert.match(b.attrs.get('uit_rt'), /Path=\/api\/auth/);
  assert.equal(b.jar.get('uit_at').split('.').length, 3, 'access token is a JWT');
  assert.equal((await b.get('/api/auth/me')).json.student.regNo, '23FA-001-SE');
});

suite('every read endpoint answers 200 with JSON for a signed-in student', async () => {
  const b = new Browser(); await b.login();
  const programs = (await b.get('/api/transcript/programs')).json;
  const programId = (programs.programs ?? programs)[0]?.id;
  const paths = ['/api/dashboard', '/api/courses', '/api/attendance', '/api/timetable', '/api/assessments/filters', '/api/assessments', '/api/roadmap',
    '/api/transcript/programs', `/api/transcript?program=${programId}`, '/api/plo', '/api/exams/seating', '/api/exams/online', '/api/exams/admit-card?kind=FINAL',
    '/api/fees/ledger', '/api/fees/advance', '/api/todos', '/api/messages', '/api/messages/recipients?type=student', '/api/workflows', '/api/announcements', '/api/surveys',
    '/api/activity', '/api/registration', '/api/profile'];
  for (const p of paths) {
    const r = await b.get(p);
    assert.equal(r.status, 200, `${p} → ${r.status} ${JSON.stringify(r.json)?.slice(0, 200)}`);
    assert.ok(r.json && typeof r.json === 'object', p);
  }
});

suite('to-do CRUD, validation, and student isolation (other students get 404)', async () => {
  const a = new Browser(); await a.login();
  const created = await a.post('/api/todos', { task: 'Read chapter 4', dueDate: '2026-12-01', priority: 'High' });
  assert.equal(created.status, 201, JSON.stringify(created.json));
  const id = (created.json.todo ?? created.json).id;
  assert.equal((await a.post('/api/todos', { task: '' })).status, 422);
  assert.equal((await a.put(`/api/todos/${id}`, { task: 'Read chapter 5', status: 'Completed', priority: 'Low', active: true })).status, 200);

  const other = new Browser(); await other.login('23FA-002-SE');
  assert.equal((await other.put(`/api/todos/${id}`, { task: 'hijack', status: 'Completed', priority: 'Low', active: true })).status, 404);
  assert.equal((await other.del(`/api/todos/${id}`)).status, 404);
  assert.equal((await a.del(`/api/todos/${id}`)).status, 204);
  assert.equal((await a.del(`/api/todos/${id}`)).status, 404);
  assert.equal((await a.get('/api/todos/abc')).status, 404);
});

suite('cache: a write is visible on the very next read (invalidation works)', async () => {
  const b = new Browser(); await b.login();
  const before = (await b.get('/api/todos')).json;
  const list = (j) => j.rows;
  await b.get('/api/dashboard'); await b.get('/api/dashboard');          // warm the cache
  const made = await b.post('/api/todos', { task: 'cache probe' });
  assert.equal(made.status, 201);
  assert.equal(list((await b.get('/api/todos')).json).length, list(before).length + 1);
  await b.del(`/api/todos/${(made.json.todo ?? made.json).id}`);
});

suite('refresh: rotates the token; an old one replayed after the grace window revokes the whole session', async () => {
  const b = new Browser(); await b.login();
  const oldRefresh = b.jar.get('uit_rt'); const oldAccess = b.jar.get('uit_at');
  const r1 = await b.post('/api/auth/refresh');
  assert.equal(r1.status, 200);
  assert.notEqual(b.jar.get('uit_rt'), oldRefresh, 'refresh token rotated');
  assert.notEqual(b.jar.get('uit_at'), oldAccess, 'new access token');
  assert.equal((await b.get('/api/dashboard')).status, 200);

  // inside the grace window the old token still yields a session (two tabs racing) …
  const racer = new Browser(); racer.jar.set('uit_rt', oldRefresh);
  assert.equal((await racer.post('/api/auth/refresh')).status, 200);
  // … after it, it is treated as theft
  await models.AuthSession.update({ rotatedAt: new Date(Date.now() - 120_000) }, { where: { prevRefreshHash: (await import('../../server/lib/crypto.js')).sha256(oldRefresh) } });
  const thief = new Browser(); thief.jar.set('uit_rt', oldRefresh);
  assert.equal((await thief.post('/api/auth/refresh')).status, 401);
  const legit = await b.post('/api/auth/refresh');
  assert.equal(legit.status, 401, 'the legitimate holder is signed out too — the family is revoked');
});

suite('an expired access token is renewed transparently by /auth/me via the refresh cookie', async () => {
  const b = new Browser(); await b.login();
  b.jar.delete('uit_at');                                            // as if the 15-minute cookie had lapsed
  const me = await b.get('/api/auth/me');
  assert.equal(me.json.student.regNo, '23FA-001-SE');
  assert.ok(b.jar.get('uit_at'), 'a fresh access cookie was issued');
});

suite('logout revokes the session server-side: the old access token stops working', async () => {
  const b = new Browser(); await b.login();
  const stolen = b.jar.get('uit_at'); const stolenRefresh = b.jar.get('uit_rt');
  assert.equal((await b.post('/api/auth/logout')).status, 204);
  assert.equal(b.jar.size, 0);
  const replay = new Browser(); replay.jar.set('uit_at', stolen);
  assert.equal((await replay.get('/api/dashboard')).status, 401, 'revoked session, even though the JWT has not expired');
  replay.jar.set('uit_rt', stolenRefresh);
  assert.equal((await replay.post('/api/auth/refresh')).status, 401);
});

suite('forged and tampered access tokens are rejected', async () => {
  const b = new Browser(); await b.login();
  const [h, p, s] = b.jar.get('uit_at').split('.');
  const evil = new Browser();
  evil.jar.set('uit_at', `${h}.${Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(p, 'base64url')), sub: '2' })).toString('base64url')}.${s}`);
  assert.equal((await evil.get('/api/dashboard')).status, 401);
  evil.jar.set('uit_at', 'garbage'); assert.equal((await evil.get('/api/dashboard')).status, 401);
});

suite('change password: needs the current password, signs out other devices, keeps this one', async () => {
  const mine = new Browser(); await mine.login('23FA-002-SE');
  const phone = new Browser(); await phone.login('23FA-002-SE');
  const weak = await mine.post('/api/auth/change-password', { currentPassword: 'Portal@2026', newPassword: 'short', confirmPassword: 'short' });
  assert.equal(weak.status, 422);
  const wrong = await mine.post('/api/auth/change-password', { currentPassword: 'wrong', newPassword: 'Sup3rSecret!', confirmPassword: 'Sup3rSecret!' });
  assert.equal(wrong.status, 422); assert.ok(wrong.json.details.currentPassword);
  assert.equal((await mine.post('/api/auth/change-password', { currentPassword: 'Portal@2026', newPassword: 'Sup3rSecret!', confirmPassword: 'Sup3rSecret!' })).status, 200);
  assert.equal((await mine.get('/api/dashboard')).status, 200, 'this device stays signed in');
  assert.equal((await phone.get('/api/dashboard')).status, 401, 'other device is signed out');
  assert.equal((await new Browser().login('23FA-002-SE', 'Portal@2026')).status, 401);
  assert.equal((await new Browser().login('23FA-002-SE', 'Sup3rSecret!')).status, 200);
});

suite('lockout: 5 wrong passwords lock the account (423), even for the right password', async () => {
  const b = new Browser();
  for (let i = 0; i < 5; i += 1) assert.equal((await b.login('23FA-001-SE', 'bad')).status, 401);
  assert.equal((await b.login('23FA-001-SE', 'Portal@2026')).status, 423);
  await models.Student.update({ lockedUntil: null, failedLogins: 0 }, { where: { regNo: '23FA-001-SE' } });
  assert.equal((await b.login()).status, 200);
});

suite('rate limiting: repeated sign-ins from one address are throttled (429)', async () => {
  const { createApp } = await import('../../server/app.js');
  const limited = createApp({ rateLimits: true }).listen(0);
  await new Promise((r) => limited.once('listening', r));
  try {
    const url = `http://127.0.0.1:${limited.address().port}/api/auth/login`;
    const codes = [];
    for (let i = 0; i < 12; i += 1) {
      codes.push((await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'uit-portal' }, body: JSON.stringify({ regNo: '23FA-009-SE', password: 'x' }) })).status);
    }
    assert.ok(codes.includes(429), `expected a 429 in ${codes}`);
  } finally { await new Promise((r) => limited.close(r)); }
});
