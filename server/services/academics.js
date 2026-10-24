/**
 * Read-models and calculations shared by several controllers.
 * Everything here is data in → data out; Express never leaks into this layer.
 */
import { appCache, studentKey } from '../lib/cache.js';
import {
  AcademicSession, AttendanceRecord, Course, CurriculumItem, Enrollment, Faculty, PloScore, Program, Section, TimetableSlot, DAYS,
} from '../models/index.js';

export const round2 = (n) => Math.round(n * 100) / 100;
export const pct = (num, den) => (den > 0 ? Math.round((num / den) * 100) : 0);
export const PASSED = ['PASS', 'SUB_PASS'];
const dayRank = (d) => DAYS.indexOf(d);

// Reference data changes once a term, so a minute of caching removes a query from nearly every request.
const REFERENCE_TTL = 60_000;
const STUDENT_TTL = 30_000;
export const currentSession = () => appCache.wrap('g:currentSession', REFERENCE_TTL, () => AcademicSession.findOne({ where: { isCurrent: true }, raw: true }));

/** Slots sorted Sunday→Saturday then by start time, with the portal's field names. */
export const sortedSlots = (slots = []) => slots
  .map((s) => ({ day: s.day, start: s.startTime, end: s.endTime, room: s.room }))
  .sort((a, b) => dayRank(a.day) - dayRank(b.day) || a.start.localeCompare(b.start));

const toView = (e) => ({
  id: e.id, status: e.status, grade: e.grade ?? null, gradePts: e.gradePts == null ? null : Number(e.gradePts),
  courseId: e.course.id, code: e.course.code, title: e.course.title, creditHrs: e.course.creditHrs,
  kind: e.course.kind, category: e.course.category, prereqCode: e.course.prereqCode ?? null,
  sectionId: e.section.id, sectionCode: e.section.code, scheduled: e.section.scheduled,
  slots: sortedSlots(e.section.slots), facultyId: e.section.faculty?.id ?? null, facultyName: e.section.faculty?.name ?? null, facultyCode: e.section.faculty?.code ?? null,
  sessionId: e.session.id, sessionName: e.session.name, isCurrent: !!e.session.isCurrent, startDate: e.session.startDate,
  attendance: (e.attendance ?? []).map((a) => ({ date: a.heldOn, topic: a.topic, present: !!a.present })).sort((a, b) => a.date.localeCompare(b.date)),
  plo: (e.plo ?? []).map((p) => ({ so: p.soNo, percent: Number(p.percent), weight: Number(p.weight) })),
});

/** All of a student's enrolments, oldest term first, fully loaded (child collections fetched separately to avoid join blow-up). */
export async function loadEnrollments(studentId, where = {}) {
  const rows = await Enrollment.findAll({
    where: { studentId, ...where },
    include: [
      { model: Course, as: 'course' },
      { model: AcademicSession, as: 'session' },
      { model: Section, as: 'section', include: [{ model: Faculty, as: 'faculty' }, { model: TimetableSlot, as: 'slots', separate: true }] },
      { model: AttendanceRecord, as: 'attendance', separate: true },
      { model: PloScore, as: 'plo', separate: true },
    ],
  });
  return rows.map((r) => toView(r.get({ plain: true })))
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.code.localeCompare(b.code));
}

/**
 * Cached, read-only view of loadEnrollments for the request path (dropped automatically after any write by that student —
 * see middleware/cache.js). Code that decides whether to *write* (registration) must call loadEnrollments directly.
 */
export const enrollmentsOf = (studentId) => appCache.wrap(studentKey(studentId, 'enrollments'), STUDENT_TTL, () => loadEnrollments(studentId));

/** Enrolments for the running term only (excludes pending next-term registrations). */
export async function liveEnrollments(studentId) {
  const session = await currentSession();
  return { session, rows: (await enrollmentsOf(studentId)).filter((e) => e.sessionId === session.id && e.status === 'IN_PROG') };
}

/** GPA per term plus the cumulative CGPA after each term (graded courses only). */
export function gpaHistory(enrollments) {
  const terms = new Map();
  for (const e of enrollments) {
    if (e.gradePts == null) continue;
    const t = terms.get(e.sessionId) ?? { session: e.sessionName, startDate: e.startDate, courses: 0, points: 0, credits: 0 };
    t.courses += 1; t.points += e.gradePts * e.creditHrs; t.credits += e.creditHrs;
    terms.set(e.sessionId, t);
  }
  let cumPts = 0; let cumCr = 0;
  return [...terms.values()].sort((a, b) => a.startDate.localeCompare(b.startDate)).map((t) => {
    cumPts += t.points; cumCr += t.credits;
    return { session: t.session, courses: t.courses, credits: t.credits, gpa: round2(t.points / t.credits), cgpa: round2(cumPts / cumCr) };
  });
}
export const cgpaOf = (history) => (history.length ? history.at(-1).cgpa : 0);

export function attendanceSummary(enrollment) {
  const conducted = enrollment.attendance.length;
  const attended = enrollment.attendance.filter((a) => a.present).length;
  const percentage = pct(attended, conducted);
  return {
    scheduled: enrollment.scheduled, conducted, attended, absent: conducted - attended, percentage,
    level: conducted === 0 ? 'none' : percentage >= 85 ? 'good' : percentage >= 75 ? 'warn' : 'risk',
  };
}

export async function degreeProgress(studentId, programId) {
  const plan = await CurriculumItem.findAll({ where: { programId }, include: [{ model: Course, as: 'course', attributes: ['creditHrs'] }], raw: true, nest: true });
  const required = plan.reduce((a, c) => a + c.course.creditHrs, 0);
  const earned = (await enrollmentsOf(studentId)).filter((e) => PASSED.includes(e.status)).reduce((a, e) => a + e.creditHrs, 0);
  return { earned, required, percent: pct(earned, required), remaining: Math.max(0, required - earned) };
}

export const programWithPlan = (programId) => appCache.wrap(`g:program:${programId}`, 5 * REFERENCE_TTL, async () => {
  const program = await Program.findByPk(programId, { include: [{ model: CurriculumItem, as: 'curriculum', include: [{ model: Course, as: 'course' }] }] });
  return program?.get({ plain: true }) ?? null;           // plain object: safe to share and freeze
});

/** True when two day/time blocks overlap. */
export const overlaps = (a, b) => a.day === b.day && a.start < b.end && b.start < a.end;
