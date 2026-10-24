import { Assessment, AssessmentMark, Op } from '../models/index.js';
import { parse } from '../middleware/errors.js';
import { assessmentQuery } from '../validators/index.js';
import { enrollmentsOf } from '../services/academics.js';

/** Sessions and courses the student can filter by (only ones they were enrolled in). */
export async function filters(req, res) {
  const all = await enrollmentsOf(req.student.id);
  const sessions = [...new Map(all.map((e) => [e.sessionId, { id: e.sessionId, name: e.sessionName, isCurrent: e.isCurrent }])).values()].reverse();
  res.json({ sessions, courses: all.map((e) => ({ sessionId: e.sessionId, id: e.courseId, label: `${e.title} (${e.code})` })) });
}

export async function index(req, res) {
  const q = parse(assessmentQuery, req.query);
  const mine = (await enrollmentsOf(req.student.id)).filter((e) => (!q.session || e.sessionId === q.session) && (!q.course || e.courseId === q.course));
  const bySection = new Map(mine.map((e) => [e.sectionId, e]));

  const assessments = await Assessment.findAll({ where: { sectionId: { [Op.in]: [...bySection.keys()] } }, order: ['id'], raw: true });
  const marks = new Map((await AssessmentMark.findAll({ where: { studentId: req.student.id, assessmentId: { [Op.in]: assessments.map((a) => a.id) } }, raw: true }))
    .map((m) => [m.assessmentId, Number(m.obtained)]));

  const rows = assessments.filter((a) => marks.has(a.id)).map((a) => {
    const e = bySection.get(a.sectionId);
    const obtained = marks.get(a.id);
    return { type: a.kind, assessment: a.name, title: e.title, code: e.code, sectionCode: e.sectionCode, teacher: e.facultyName, total: Number(a.total), passing: Number(a.passing), obtained, passed: obtained >= Number(a.passing), session: e.sessionName };
  }).sort((x, y) => y.session.localeCompare(x.session) || x.code.localeCompare(y.code));
  res.json({ rows });
}
