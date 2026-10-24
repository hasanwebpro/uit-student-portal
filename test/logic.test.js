import test from 'node:test';
import assert from 'node:assert/strict';
import { attendanceSummary, cgpaOf, gpaHistory, overlaps, pct, sortedSlots } from '../server/services/academics.js';
import { validateSelection } from '../server/services/registration.js';
import { nextClass } from '../server/services/dashboard.js';
import { parseId } from '../server/lib/ids.js';

const enr = (sessionId, sessionName, startDate, creditHrs, gradePts) => ({ sessionId, sessionName, startDate, creditHrs, gradePts });

test('gpaHistory computes credit-weighted GPA and running CGPA per term', () => {
  const h = gpaHistory([
    enr(1, 'Fall 2023', '2023-08-14', 3, 4.0), enr(1, 'Fall 2023', '2023-08-14', 1, 2.0),   // (12+2)/4 = 3.50
    enr(2, 'Spring 2024', '2024-02-19', 3, 3.0),                                              // 3.00; cumulative (14+9)/7 = 3.2857
    enr(3, 'Fall 2026', '2026-08-17', 3, null),                                               // in progress: ignored
  ]);
  assert.deepEqual(h.map((t) => [t.session, t.gpa, t.cgpa]), [['Fall 2023', 3.5, 3.5], ['Spring 2024', 3.0, 3.29]]);
  assert.equal(cgpaOf(h), 3.29);
  assert.equal(cgpaOf([]), 0);
});

test('gpaHistory orders terms chronologically even if input is shuffled', () => {
  const h = gpaHistory([enr(2, 'B', '2024-01-01', 3, 3.0), enr(1, 'A', '2023-01-01', 3, 4.0)]);
  assert.deepEqual(h.map((t) => t.session), ['A', 'B']);
});

test('pct rounds and never divides by zero', () => {
  assert.equal(pct(15, 18), 83);
  assert.equal(pct(0, 0), 0);
});

test('attendanceSummary levels: good ≥85, warn ≥75, risk <75, none when no classes', () => {
  const mk = (present, total) => ({ scheduled: 48, attendance: Array.from({ length: total }, (_, i) => ({ present: i < present })) });
  assert.equal(attendanceSummary(mk(17, 20)).level, 'good');      // 85%
  assert.equal(attendanceSummary(mk(16, 20)).level, 'warn');      // 80%
  assert.equal(attendanceSummary(mk(15, 20)).level, 'warn');      // 75% exactly
  assert.equal(attendanceSummary(mk(14, 20)).level, 'risk');      // 70%
  assert.equal(attendanceSummary(mk(0, 0)).level, 'none');
  assert.deepEqual(attendanceSummary(mk(15, 18)), { scheduled: 48, conducted: 18, attended: 15, absent: 3, percentage: 83, level: 'warn' });
});

test('overlaps: same day and intersecting times only; touching edges do not clash', () => {
  const a = { day: 'Tuesday', start: '10:30', end: '12:25' };
  assert.equal(overlaps(a, { day: 'Tuesday', start: '11:30', end: '13:25' }), true);
  assert.equal(overlaps(a, { day: 'Tuesday', start: '12:25', end: '13:25' }), false);
  assert.equal(overlaps(a, { day: 'Monday', start: '10:30', end: '12:25' }), false);
});

test('sortedSlots orders Sunday→Saturday then by start time and renames fields', () => {
  const out = sortedSlots([
    { day: 'Tuesday', startTime: '14:30', endTime: '15:25', room: 'B' }, { day: 'Sunday', startTime: '16:30', endTime: '17:25', room: 'A' },
    { day: 'Tuesday', startTime: '10:30', endTime: '11:25', room: 'C' },
  ]);
  assert.deepEqual(out.map((s) => `${s.day} ${s.start}`), ['Sunday 16:30', 'Tuesday 10:30', 'Tuesday 14:30']);
});

test('validateSelection enforces prerequisites, clashes and credit limits', () => {
  const window = { minCredits: 9, maxCredits: 18 };
  const course = (code, creditHrs, timings, prereq = null) => ({ code, creditHrs, timings, prereq });
  const tue = [{ day: 'Tuesday', start: '10:30', end: '12:25' }];
  const wed = [{ day: 'Wednesday', start: '10:30', end: '12:25' }];

  const ok = validateSelection([course('A', 3, tue), course('B', 3, wed), course('C', 3, [{ day: 'Thursday', start: '09:00', end: '10:00' }])], window, new Set());
  assert.deepEqual(ok, { problems: [], credits: 9 });

  const bad = validateSelection([course('A', 3, tue), course('B', 3, tue, 'X')], window, new Set(['A']));
  assert.ok(bad.problems.some((p) => p.includes('A: you have already passed')));
  assert.ok(bad.problems.some((p) => p.includes('B: prerequisite X')));
  assert.ok(bad.problems.some((p) => p.includes('A and B meet at the same time')));
  assert.ok(bad.problems.some((p) => p.includes('at least 9')));

  const tooMany = validateSelection(Array.from({ length: 7 }, (_, i) => course(`C${i}`, 3, [{ day: 'Monday', start: `0${i + 1}:00`, end: `0${i + 1}:30` }])), window, new Set());
  assert.ok(tooMany.problems.some((p) => p.includes('at most 18')));
});

test('nextClass picks the soonest upcoming block, rolling to next week when today’s has ended', () => {
  const courses = [{ title: 'Early', timings: [{ day: 'Monday', start: '08:30', end: '09:25', room: 'R1' }] }, { title: 'Late', timings: [{ day: 'Monday', start: '16:30', end: '17:25', room: 'R2' }] }];
  const monday10 = new Date('2026-10-26T10:00:00');            // a Monday, local time
  assert.equal(nextClass(courses, monday10).title, 'Late');    // 08:30 class is over
  const monday18 = new Date('2026-10-26T18:00:00');
  const wrapped = nextClass(courses, monday18);
  assert.equal(wrapped.title, 'Early');
  assert.equal(wrapped.inDays, 7);
  assert.equal(nextClass([], monday10), null);
});

test('parseId accepts only positive integers', () => {
  assert.equal(parseId('42'), 42);
  assert.equal(parseId(7), 7);
  for (const bad of ['0', '-1', '1.5', 'abc', '1; DROP TABLE x', '', undefined, null, '99999999999']) {
    assert.throws(() => parseId(bad, 'nope'), (e) => e.status === 404, `should reject ${JSON.stringify(bad)}`);
  }
});

import { lifetimeMs } from '../server/services/session.js';
test('session lifetime: 8 hours normally, 30 days with "remember me"', () => {
  assert.equal(lifetimeMs(false), 8 * 3600 * 1000);
  assert.equal(lifetimeMs(true), 30 * 86400 * 1000);
});
