import test from 'node:test';
import assert from 'node:assert/strict';

// The browser client's silent-refresh behaviour, exercised with a scripted fetch.
const events = [];
globalThis.window = { location: { origin: 'http://portal.test' }, dispatchEvent: (e) => events.push(e.type) };
globalThis.Event = class { constructor(type) { this.type = type; } };
Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true });
const { api } = await import('../client/src/models/api.js');

const reply = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body });
const script = (handler) => { const calls = []; globalThis.fetch = async (url, init) => { const u = new URL(url, 'http://portal.test'); calls.push(`${init?.method ?? 'GET'} ${u.pathname}`); return handler(u.pathname, calls); }; return calls; };

test('a 401 triggers ONE silent refresh and the original call is replayed', async () => {
  let dashboardHits = 0;
  const calls = script((path) => {
    if (path === '/api/auth/refresh') return reply(200, { student: {} });
    dashboardHits += 1;
    return dashboardHits === 1 ? reply(401, { error: 'expired' }) : reply(200, { ok: 1 });
  });
  assert.deepEqual(await api.get('/dashboard'), { ok: 1 });
  assert.deepEqual(calls, ['GET /api/dashboard', 'POST /api/auth/refresh', 'GET /api/dashboard']);
});

test('parallel 401s share a single refresh request', async () => {
  const seen = new Set();
  const calls = script((path) => {
    if (path === '/api/auth/refresh') return new Promise((r) => setTimeout(() => r(reply(200, {})), 20));
    if (!seen.has(path)) { seen.add(path); return reply(401, {}); }
    return reply(200, { path });
  });
  const out = await Promise.all([api.get('/courses'), api.get('/todos'), api.get('/attendance')]);
  assert.equal(out.length, 3);
  assert.equal(calls.filter((c) => c.includes('refresh')).length, 1);
});

test('when refresh fails the session is reported expired (and not retried forever)', async () => {
  events.length = 0;
  const calls = script(() => reply(401, { error: 'no' }));
  await assert.rejects(api.get('/dashboard'), (e) => e.status === 401);
  assert.deepEqual(events, ['auth:expired']);
  assert.equal(calls.filter((c) => c === 'GET /api/dashboard').length, 1);
});

test('sign-in failures are not "expired sessions": no refresh, no logout event', async () => {
  events.length = 0;
  const calls = script(() => reply(401, { error: 'Registration number or password is incorrect.' }));
  await assert.rejects(api.post('/auth/login', {}), (e) => e.status === 401);
  assert.deepEqual(events, []); assert.equal(calls.length, 1);
});
