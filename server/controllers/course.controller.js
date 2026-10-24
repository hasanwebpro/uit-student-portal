import { Assessment, AssessmentMark, Op } from '../models/index.js';
import { notFound } from '../middleware/errors.js';
import { parseId } from '../lib/ids.js';
import { attendanceSummary, liveEnrollments, enrollmentsOf } from '../services/academics.js';

const TBC = 'To be Confirmed';

/** Looks up one of the *signed-in student's own* enrolments; anything else is a 404, never a 403, to avoid leaking existence. */
export async function ownEnrollment(studentId, rawId) {
  const id = parseId(rawId, 'That course is not in your record.');
  const found = (await enrollmentsOf(studentId)).find((e) => e.id === id);
  if (!found) throw notFound('That course is not in your record.');
  return found;
}

export async function index(req, res) {
  const { session, rows } = await liveEnrollments(req.student.id);
  res.json({
    session: session.name,
    courses: rows.map((e) => ({
      enrollmentId: e.id, title: e.title, code: e.code, sectionCode: e.sectionCode, kind: e.kind, creditHrs: e.creditHrs,
      faculty: e.facultyName ?? TBC, timings: e.slots, attendance: attendanceSummary(e),
    })),
  });
}

export async function show(req, res) {
  const e = await ownEnrollment(req.student.id, req.params.id);
  const assessments = await Assessment.findAll({ where: { sectionId: e.sectionId }, order: ['id'], raw: true });
  const marks = new Map((await AssessmentMark.findAll({ where: { studentId: req.student.id, assessmentId: { [Op.in]: assessments.map((a) => a.id) } }, raw: true }))
    .map((m) => [m.assessmentId, Number(m.obtained)]));
  const rows = assessments.map((a) => ({ kind: a.kind, name: a.name, total: Number(a.total), passing: Number(a.passing), obtained: marks.get(a.id) ?? null }));
  const graded = rows.filter((m) => m.obtained != null);
  res.json({
    course: { title: e.title, code: e.code, sectionCode: e.sectionCode, kind: e.kind, creditHrs: e.creditHrs, category: e.category, prereq: e.prereqCode, faculty: e.facultyName ?? TBC, session: e.sessionName, status: e.status },
    timings: e.slots, attendance: attendanceSummary(e), marks: rows,
    progress: { obtained: graded.reduce((a, m) => a + m.obtained, 0), total: graded.reduce((a, m) => a + m.total, 0) },
  });
}
