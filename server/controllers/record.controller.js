/** Academic record views: degree road map, unofficial transcript and outcome (PLO/SO) attainment. */
import { Program, RoadmapVerification, Student } from '../models/index.js';
import { notFound, parse } from '../middleware/errors.js';
import { transcriptQuery, verificationBody } from '../validators/index.js';
import { cgpaOf, currentSession, gpaHistory, enrollmentsOf, programWithPlan, PASSED } from '../services/academics.js';
import { ledgerWithBalance } from '../services/fees.js';
import { log } from '../services/activity.js';

const LEGEND = [['PASS', 'Pass'], ['IN_PROG', 'In progress'], ['ETR', 'Eligible To Register'], ['NETR', 'Not Eligible To Register'], ['SUB_PASS', 'Substitute Course Pass'], ['SUB_IN_PROG', 'Substitute in progress'], ['PENDING', 'Registration pending'], ['FAIL', 'Failed']];

export async function roadmap(req, res) {
  const me = await Student.findByPk(req.student.id);
  const [enr, program] = await Promise.all([enrollmentsOf(req.student.id), programWithPlan(me.programId)]);
  const latest = new Map(enr.map((e) => [e.courseId, e]));          // enr is oldest→newest, so the last attempt wins
  const passed = new Set(enr.filter((e) => PASSED.includes(e.status)).map((e) => e.code));

  const rows = program.curriculum.map(({ course, semesterNo, requirement }) => {
    const attempt = latest.get(course.id);
    const prereqMet = !course.prereqCode || passed.has(course.prereqCode);
    const status = attempt?.status ?? (prereqMet ? 'ETR' : 'NETR');       // never taken: eligible only if the prerequisite is passed
    return {
      semesterNo, session: attempt?.sessionName ?? '', courseType: course.category, requirement,
      course: `${course.title} - (${course.code})`, code: course.code, kind: course.kind, creditHrs: course.creditHrs,
      prereq: course.prereqCode ? `(${course.prereqCode})` : '', prereqStatus: course.prereqCode ? (passed.has(course.prereqCode) ? 'PASS' : 'PENDING') : '',
      status, creditsEarned: PASSED.includes(status) ? course.creditHrs : 0, grade: attempt?.grade ?? '',
    };
  }).sort((a, b) => a.semesterNo - b.semesterNo || a.code.localeCompare(b.code));

  const history = gpaHistory(enr);
  const [{ balance }, verification, session] = await Promise.all([ledgerWithBalance(req.student.id), RoadmapVerification.findByPk(req.student.id), currentSession()]);
  res.json({
    student: { name: me.fullName, regNo: me.regNo, program: program.name, session: session.name }, rows, totalEarned: rows.reduce((a, r) => a + r.creditsEarned, 0),
    cgpa: cgpaOf(history), history, legend: LEGEND, fee: { balance, loan: 0 },
    verification: { verified: !!verification?.verified, comments: verification?.comments ?? '', updatedAt: verification?.updatedAt ?? null },
  });
}

export async function saveVerification(req, res) {
  const { verified, comments } = parse(verificationBody, req.body);
  await RoadmapVerification.upsert({ studentId: req.student.id, verified, comments });
  await log(req.student.id, 'Road Map', verified ? 'Road map verified' : 'Road map verification withdrawn', req.ip);
  res.json({ verification: { verified, comments: comments ?? '' } });
}

export async function transcriptPrograms(req, res) {
  const me = await Student.findByPk(req.student.id, { include: [{ model: Program, as: 'program', attributes: ['id', 'name'] }] });
  res.json({ programs: [{ id: me.program.id, name: me.program.name }] });
}

export async function transcript(req, res) {
  const { program } = parse(transcriptQuery, req.query);
  const me = await Student.findOne({ where: { id: req.student.id, programId: program }, include: [{ model: Program, as: 'program', attributes: ['name'] }] });
  if (!me) throw notFound('You are not enrolled in that program.');

  const past = (await enrollmentsOf(req.student.id)).filter((e) => !e.isCurrent && e.gradePts != null);
  const history = gpaHistory(past);
  res.json({
    student: { name: me.fullName, regNo: me.regNo, enrollmentNo: me.enrollmentNo, program: me.program.name },
    terms: history.map((h) => ({ ...h, courses: past.filter((e) => e.sessionName === h.session).map((e) => ({ code: e.code, title: e.title, creditHrs: e.creditHrs, grade: e.grade, points: e.gradePts })) })),
    cgpa: cgpaOf(history), creditsEarned: past.filter((e) => e.status !== 'FAIL').reduce((a, e) => a + e.creditHrs, 0),
    generatedOn: new Date().toISOString().slice(0, 10), notice: 'Unofficial copy — not valid for submission without the Registrar\'s stamp.',
  });
}

/** Student-outcome attainment grouped by semester, with a weighted grand total per outcome. */
export async function plo(req, res) {
  const me = await Student.findByPk(req.student.id);
  const program = await programWithPlan(me.programId);
  const semesterOf = new Map(program.curriculum.map((c) => [c.courseId, c.semesterNo]));
  const past = (await enrollmentsOf(req.student.id)).filter((e) => !e.isCurrent && e.plo.length);
  const allScores = past.flatMap((e) => e.plo);
  const sos = [...new Set(allScores.map((s) => s.so))].sort((a, b) => a - b);

  const groups = new Map();
  for (const e of past) {
    const n = semesterOf.get(e.courseId) ?? 0;
    const g = groups.get(n) ?? { semesterNo: n, rows: [] };
    g.rows.push({
      course: `${e.code} - ${e.title}`, faculty: e.facultyName ? `${e.facultyName} (${e.facultyCode})` : '—', credit: e.kind === 'LAB' ? `0 + ${e.creditHrs}` : `${e.creditHrs} + 0`, creditHrs: e.creditHrs, room: e.sectionCode,
      scores: Object.fromEntries(e.plo.map((s) => [s.so, { percent: s.percent, weight: s.weight }])),
    });
    groups.set(n, g);
  }
  const total = Object.fromEntries(sos.map((so) => {
    const mine = allScores.filter((s) => s.so === so);
    const weight = mine.reduce((a, s) => a + s.weight, 0);
    return [so, { percent: weight ? Math.round((mine.reduce((a, s) => a + s.percent * s.weight, 0) / weight) * 100) / 100 : 0, weight }];
  }));
  const batchPrefix = me.regNo.split('-')[0];
  res.json({
    student: { regNo: me.regNo, name: me.fullName, program: program.code === 'BSSE' ? 'BS SE' : program.code, batch: `${batchPrefix} - ${program.code.slice(0, 2)}` },
    reportDate: new Date().toISOString(), sos, semesters: [...groups.values()].sort((a, b) => a.semesterNo - b.semesterNo), total,
  });
}
