import { ActivityLog, Announcement, Enrollment, Message, Op, Program, Student, Survey, SurveyResponse, Todo, literal } from '../models/index.js';
import { today } from '../lib/ids.js';
import { attendanceSummary, cgpaOf, degreeProgress, gpaHistory, liveEnrollments, enrollmentsOf, pct } from './academics.js';
import { ledgerWithBalance } from './fees.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Soonest upcoming class within a week, using the server clock (a hint, not a contract). */
export function nextClass(courses, now = new Date()) {
  const hhmm = now.toTimeString().slice(0, 5);
  let best = null;
  for (const c of courses) for (const t of c.timings) {
    let ahead = (DAYS.indexOf(t.day) - now.getDay() + 7) % 7;
    if (ahead === 0 && t.end <= hhmm) ahead = 7;
    const key = ahead * 2400 + Number(t.start.replace(':', ''));
    if (!best || key < best.key) best = { key, title: c.title, day: t.day, start: t.start, end: t.end, room: t.room, inDays: ahead };
  }
  if (!best) return null;
  return { title: best.title, day: best.day, start: best.start, end: best.end, room: best.room, inDays: best.inDays };
}

/** Open forms this student has not answered yet (for the dashboard's "Feedbacks / Surveys" card). */
async function pendingSurveys(studentId) {
  const sectionIds = (await Enrollment.findAll({ where: { studentId }, attributes: ['sectionId'], raw: true })).map((e) => e.sectionId);
  const t = today();
  const open = await Survey.findAll({
    where: { opensOn: { [Op.lte]: t }, closesOn: { [Op.gte]: t }, [Op.or]: [{ sectionId: null }, { sectionId: { [Op.in]: sectionIds } }] },
    order: ['closesOn'], raw: true,
  });
  const done = new Set((await SurveyResponse.findAll({ where: { studentId, surveyId: { [Op.in]: open.map((s) => s.id) } }, attributes: ['surveyId'], raw: true })).map((r) => r.surveyId));
  return open.filter((s) => !done.has(s.id)).map((s) => ({ id: s.id, kind: s.kind, title: s.title, closesOn: s.closesOn }));
}

/** One round-trip for everything the dashboard shows (fewer requests on slow mobile links). */
export async function buildDashboard(studentId) {
  const me = await Student.findByPk(studentId, { include: [{ model: Program, as: 'program', attributes: ['name'] }] });
  const [{ session, rows: live }, all, ledger] = await Promise.all([liveEnrollments(studentId), enrollmentsOf(studentId), ledgerWithBalance(studentId)]);
  const history = gpaHistory(all);

  const courses = live.map((e) => ({
    enrollmentId: e.id, title: e.title, code: e.code, faculty: e.facultyName ?? 'To be Confirmed', rooms: [...new Set(e.slots.map((s) => s.room))],
    timings: e.slots, attendance: attendanceSummary(e),
  }));
  const conducted = courses.reduce((a, c) => a + c.attendance.conducted, 0);
  const attended = courses.reduce((a, c) => a + c.attendance.attended, 0);

  const [degree, activity, announcements, todos, surveys, unreadMessages] = await Promise.all([
    degreeProgress(studentId, me.programId),
    ActivityLog.findAll({ where: { studentId }, order: [['createdAt', 'DESC'], ['id', 'DESC']], limit: 6 }),
    Announcement.findAll({ order: [['postedOn', 'DESC'], ['id', 'DESC']], limit: 3 }),
    Todo.findAll({ where: { studentId, active: true, status: { [Op.ne]: 'Completed' } }, order: [[literal('due_date IS NULL'), 'ASC'], ['dueDate', 'ASC']], limit: 5 }),
    pendingSurveys(studentId),
    Message.count({ where: { ownerId: studentId, box: 'inbox', readAt: null } }),
  ]);

  return {
    me: { fullName: me.fullName, regNo: me.regNo, enrollmentNo: me.enrollmentNo, section: me.sectionLabel, status: me.status, program: me.program.name, session: session.name },
    stats: { currentBalance: ledger.balance, cgpa: cgpaOf(history), registeredCourses: live.length, averageAttendance: pct(attended, conducted) },
    courses, gpaTrend: history, degree,
    activity: activity.map((a) => ({ action: a.action, detail: a.detail, at: a.createdAt })),
    announcements: announcements.map((a) => ({ id: a.id, title: a.title, body: a.body, postedOn: a.postedOn })),
    todos: todos.map((t) => ({ id: t.id, task: t.task, dueDate: t.dueDate ?? null, status: t.status, priority: t.priority })),
    surveys, pendingSurveys: surveys.length, unreadMessages,
    ledger: { balance: ledger.balance, entries: ledger.entries, recent: ledger.entries.slice(-6).reverse() },
    nextClass: nextClass(courses),
  };
}
