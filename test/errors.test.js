import test from 'node:test';
import assert from 'node:assert/strict';
import { errorHandler, HttpError, notFound } from '../server/middleware/errors.js';
import { csrfGuard, requireAuth } from '../server/middleware/auth.js';

const run = (err) => {
  const out = {};
  const res = { status(s) { out.status = s; return this; }, json(b) { out.body = b; return this; } };
  errorHandler(err, { method: 'GET', originalUrl: '/x' }, res, () => {});
  return out;
};

test('HttpError keeps its status and message; details are passed through', () => {
  const o = run(new HttpError(422, 'Fix fields', { a: 'bad' }));
  assert.equal(o.status, 422); assert.deepEqual(o.body, { error: 'Fix fields', details: { a: 'bad' } });
});

test('unexpected errors become a generic 500 that never leaks internals', () => {
  const o = run(new Error('SELECT secret FROM users failed at 10.0.0.5'));
  assert.equal(o.status, 500);
  assert.ok(!JSON.stringify(o.body).includes('secret'));
});

test('database errors map to friendly HTTP statuses', () => {
  assert.equal(run({ name: 'SequelizeUniqueConstraintError' }).status, 409);
  assert.equal(run({ name: 'SequelizeForeignKeyConstraintError' }).status, 409);
  const v = run({ name: 'SequelizeValidationError', errors: [{ path: 'rating', message: 'too high' }] });
  assert.equal(v.status, 422); assert.deepEqual(v.body.details, { rating: 'too high' });
  assert.equal(run({ type: 'entity.parse.failed' }).status, 400);
  assert.equal(run(notFound()).status, 404);
});

test('CSRF guard: writes need the custom header, and an Origin (when sent) must be this site; reads are free', () => {
  const call = (method, headers = {}) => {
    let err = 'none';
    csrfGuard({ method, get: (name) => headers[name.toLowerCase()] }, {}, (e) => { err = e ? e.status : 'none'; });
    return err;
  };
  const ok = { 'x-requested-with': 'uit-portal', host: 'portal.test' };
  assert.equal(call('GET'), 'none');
  assert.equal(call('POST'), 403);
  assert.equal(call('POST', { 'x-requested-with': 'something-else' }), 403);
  assert.equal(call('POST', ok), 'none');
  assert.equal(call('DELETE', ok), 'none');
  assert.equal(call('POST', { ...ok, origin: 'https://portal.test' }), 'none');
  assert.equal(call('POST', { ...ok, origin: 'https://evil.example' }), 403);
  assert.equal(call('POST', { ...ok, origin: 'null' }), 403);
  assert.equal(call('PUT', { ...ok, origin: 'https://portal.test.evil.example' }), 403);
});

test('requireAuth rejects anonymous requests with 401', () => {
  let status; requireAuth({}, {}, (e) => { status = e?.status; });
  assert.equal(status, 401);
  let passed = false; requireAuth({ student: { id: 1 } }, {}, (e) => { passed = !e; });
  assert.ok(passed);
});
