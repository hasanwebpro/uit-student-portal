import test from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../server/middleware/errors.js';
import * as v from '../server/validators/index.js';

const fails = (schema, input) => { try { parse(schema, input); return null; } catch (e) { return e.details; } };

test('login: trims reg no, rejects empty fields with friendly messages', () => {
  assert.deepEqual(parse(v.loginBody, { regNo: '  23FA-001-SE ', password: 'x' }), { regNo: '23FA-001-SE', password: 'x', remember: false });
  assert.ok(fails(v.loginBody, { regNo: '', password: '' }).regNo);
  assert.ok(fails(v.loginBody, {}).password);
});

test('password: strength rules, match and "must differ" are all enforced', () => {
  const base = { currentPassword: 'Old@12345', newPassword: 'NewPass123', confirmPassword: 'NewPass123' };
  assert.doesNotThrow(() => parse(v.passwordBody, base));
  assert.ok(fails(v.passwordBody, { ...base, newPassword: 'short1A', confirmPassword: 'short1A' }).newPassword);
  assert.ok(fails(v.passwordBody, { ...base, newPassword: 'alllowercase1', confirmPassword: 'alllowercase1' }).newPassword);
  assert.ok(fails(v.passwordBody, { ...base, newPassword: 'NoDigitsHere', confirmPassword: 'NoDigitsHere' }).newPassword);
  assert.ok(fails(v.passwordBody, { ...base, confirmPassword: 'Different123' }).confirmPassword);
  assert.ok(fails(v.passwordBody, { ...base, newPassword: 'Old@12345', confirmPassword: 'Old@12345' }).newPassword);
});

test('todo: task required, valid enums/dates, defaults applied', () => {
  const ok = parse(v.todoBody, { task: ' Buy book ' });
  assert.deepEqual(ok, { task: 'Buy book', active: true, status: 'Not Started', priority: 'Medium' });
  assert.ok(fails(v.todoBody, { task: '' }).task);
  assert.ok(fails(v.todoBody, { task: 'x', priority: 'Urgent' }).priority);
  assert.ok(fails(v.todoBody, { task: 'x', dueDate: '24/10/2026' }).dueDate);
  assert.ok(fails(v.todoBody, { task: 'x'.repeat(201) }).task);
});

test('compose: 1–25 recipients with integer ids, subject and body required', () => {
  const rc = [{ type: 'faculty', id: 3 }];
  assert.doesNotThrow(() => parse(v.composeBody, { recipients: rc, subject: 'Hi', body: 'Hello' }));
  assert.ok(fails(v.composeBody, { recipients: [], subject: 'Hi', body: 'x' })?.recipients);
  assert.ok(fails(v.composeBody, { recipients: [{ type: 'alien', id: 1 }], subject: 'Hi', body: 'x' }));
  assert.ok(fails(v.composeBody, { recipients: [{ type: 'student', id: '1; DROP' }], subject: 'Hi', body: 'x' }));
  assert.ok(fails(v.composeBody, { recipients: Array(26).fill(rc[0]), subject: 'Hi', body: 'x' })?.recipients);
});

test('registration body only accepts integer section ids (max 12)', () => {
  assert.deepEqual(parse(v.registrationBody, { sectionIds: [1, '2'] }).sectionIds, [1, 2]);
  assert.ok(fails(v.registrationBody, { sectionIds: ['abc'] }));
  assert.ok(fails(v.registrationBody, { sectionIds: Array.from({ length: 13 }, (_, i) => i + 1) }));
});

test('profile: formats validated, and unknown/identity fields are stripped, not accepted', () => {
  const good = {
    tax: { payeeName: 'A B', payeeNic: '4220156789013', selfPayee: false, ntn: '1234567-8', isFiler: true },
    guardian: { relation: 'Father', name: 'G', occupation: '', cell: '+92 300 0000001', cnic: '4220156789013', email: 'G@Example.com' },
    address: { permanent: '12 Some Street', present: '12 Some Street' },
    personal: { cell: '+92 300 0000002', personalEmail: 'a@b.co', cnic: '4220112345671', fullName: 'HACKED', officialEmail: 'x@y.z' },
    fullName: 'HACKED',
  };
  const out = parse(v.profileBody, good);
  assert.equal(out.guardian.email, 'g@example.com');            // normalised
  assert.equal(out.fullName, undefined);                        // identity fields never pass through
  assert.equal(out.personal.fullName, undefined);
  assert.equal(out.personal.officialEmail, undefined);
  const bad = fails(v.profileBody, { ...good, personal: { ...good.personal, cnic: '123' }, tax: { ...good.tax, ntn: 'abc' } });
  assert.ok(bad['personal.cnic']); assert.ok(bad['tax.ntn']);
});

test('query validators: assessment/transcript ids and date ranges', () => {
  assert.deepEqual(parse(v.assessmentQuery, { session: '3' }), { session: 3 });
  assert.ok(fails(v.assessmentQuery, { session: 'x' }));
  assert.ok(fails(v.dateRangeQuery, { from: 'yesterday' }));
  assert.equal(parse(v.admitCardQuery, {}).kind, 'FINAL');
  assert.ok(fails(v.admitCardQuery, { kind: 'OTHER' }));
});

test('login: "remember me" defaults to false and must be a boolean', () => {
  assert.equal(parse(v.loginBody, { regNo: '23FA-001-SE', password: 'x' }).remember, false);
  assert.equal(parse(v.loginBody, { regNo: '23FA-001-SE', password: 'x', remember: true }).remember, true);
  assert.ok(fails(v.loginBody, { regNo: '23FA-001-SE', password: 'x', remember: 'yes' }));
});

test('compose: communication metadata defaults match the original form and are validated', () => {
  const base = { recipients: [{ type: 'faculty', id: 1 }], subject: 'Hi', body: 'Hello' };
  const ok = parse(v.composeBody, base);
  assert.deepEqual([ok.commType, ok.priority, ok.category, ok.followUp, ok.reminder], ['Announcement', 'Low', 'Information', false, false]);
  assert.ok(fails(v.composeBody, { ...base, commType: 'Spam' }).commType);
  assert.ok(fails(v.composeBody, { ...base, priority: 'Urgent' }).priority);
  assert.ok(fails(v.composeBody, { ...base, dueDate: '25/10/2026' }).dueDate);
  assert.equal(parse(v.recipientQuery, { type: 'student', course: '7' }).course, 7);
});

test('roadmap verification: boolean flag and optional trimmed comments', () => {
  assert.deepEqual(parse(v.verificationBody, { verified: true, comments: '  Looks right ' }), { verified: true, comments: 'Looks right' });
  assert.equal(parse(v.verificationBody, { verified: false }).comments, null);
  assert.ok(fails(v.verificationBody, { verified: 'yes' }));
  assert.ok(fails(v.verificationBody, { verified: true, comments: 'x'.repeat(501) }));
});
