import { attendanceSummary, liveEnrollments, pct } from '../services/academics.js';
import { ownEnrollment } from './course.controller.js';

export async function index(req, res) {
  const { session, rows } = await liveEnrollments(req.student.id);
  const list = rows.map((e) => ({
    enrollmentId: e.id, course: e.title, code: e.code, sectionCode: e.sectionCode, faculty: e.facultyName ?? 'To be Confirmed', ...attendanceSummary(e),
  }));
  const conducted = list.reduce((a, x) => a + x.conducted, 0);
  const attended = list.reduce((a, x) => a + x.attended, 0);
  res.json({ session: session.name, rows: list, overall: pct(attended, conducted) });
}

export async function show(req, res) {
  const e = await ownEnrollment(req.student.id, req.params.id);
  const records = [...e.attendance].sort((a, b) => b.date.localeCompare(a.date));
  res.json({ course: `${e.title} (${e.code})`, summary: attendanceSummary(e), records });
}
