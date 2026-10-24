import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../server/seed/data.js';
import { overlaps } from '../server/services/academics.js';

const codes = D.CURRICULUM.map((c) => c[1]);
const rowFor = (code) => D.CURRICULUM.find((c) => c[1] === code);

test('seed: course codes are unique and every prerequisite exists', () => {
  assert.equal(new Set(codes).size, codes.length);
  for (const [, code, , , , , , prereq] of D.CURRICULUM) if (prereq) assert.ok(codes.includes(prereq), `${code} → missing prerequisite ${prereq}`);
});

test('seed: prerequisites are always taught in an earlier or equal semester (no impossible plans)', () => {
  for (const [sem, code, , , , , , prereq] of D.CURRICULUM) if (prereq) assert.ok(rowFor(prereq)[0] <= sem, `${code} (sem ${sem}) needs ${prereq} (sem ${rowFor(prereq)[0]})`);
});

test('seed: every term referenced exists and faculty indexes are in range', () => {
  const names = D.SESSIONS.map((s) => s[0]);
  for (const c of D.CURRICULUM) { assert.ok(names.includes(c[8]), `${c[1]} → unknown session ${c[8]}`); if (c[9] != null) assert.ok(c[9] < D.FACULTY.length); }
});

test('seed: weekly slots reference real courses of the right term, with sane times', () => {
  for (const [term, slots] of [[D.CURRENT_SESSION, D.FALL26_SLOTS], [D.NEXT_SESSION, D.SPRING27_SLOTS]]) {
    for (const [code, blocks] of Object.entries(slots)) {
      assert.equal(rowFor(code)?.[8], term, `${code} slots belong to ${term}`);
      for (const [day, start, end] of blocks) { assert.ok(/^(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day$/.test(day)); assert.ok(start < end, `${code} ${day} ${start}-${end}`); }
    }
  }
});

test('seed: the demo student’s current timetable has NO clashes (so their schedule is realistic)', () => {
  const flat = Object.entries(D.FALL26_SLOTS).flatMap(([code, bs]) => bs.map(([day, start, end]) => ({ code, day, start, end })));
  for (let i = 0; i < flat.length; i++) for (let j = i + 1; j < flat.length; j++) assert.ok(!overlaps(flat[i], flat[j]), `${flat[i].code} clashes with ${flat[j].code}`);
});

test('seed: next-term slots contain exactly the intentional clash used to demo clash detection', () => {
  const flat = Object.entries(D.SPRING27_SLOTS).flatMap(([code, bs]) => bs.map(([day, start, end]) => ({ code, day, start, end })));
  const clashes = [];
  for (let i = 0; i < flat.length; i++) for (let j = i + 1; j < flat.length; j++) if (overlaps(flat[i], flat[j])) clashes.push([flat[i].code, flat[j].code].sort().join('+'));
  assert.deepEqual(clashes, ['CSE-401+CSE-407']);
});

test('seed: term credit totals match the portal shape (5, 8, 6, 5, 1, 7, 8, 8 courses) and credits stay in 0–6', () => {
  const perTerm = Object.fromEntries(D.SESSIONS.map(([n]) => [n, D.CURRICULUM.filter((c) => c[8] === n).length]));
  assert.deepEqual(Object.values(perTerm).slice(0, 8), [5, 8, 6, 5, 1, 7, 8, 8]);
  for (const c of D.CURRICULUM) assert.ok(c[4] >= 0 && c[4] <= 6);
  const nextCredits = D.CURRICULUM.filter((c) => c[8] === D.NEXT_SESSION).reduce((a, c) => a + c[4], 0);
  assert.ok(nextCredits >= 18, 'enough offered credits to satisfy the 9–18 window');
});

test('seed: grade scale is strictly descending and final exams reference current-term courses', () => {
  const pts = D.GRADES.map((g) => g[1]);
  assert.deepEqual([...pts].sort((a, b) => b - a), pts);
  for (const [code] of D.FINALS) assert.equal(rowFor(code)[8], D.CURRENT_SESSION);
});
