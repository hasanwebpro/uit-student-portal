import {
  AcademicSession, Course, CurriculumItem, Enrollment, Faculty, Op, RegistrationWindow, Section, TimetableSlot, sequelize,
} from '../models/index.js';
import { HttpError, conflict } from '../middleware/errors.js';
import { today } from '../lib/ids.js';
import { loadEnrollments, overlaps, sortedSlots, PASSED } from './academics.js';
import { log } from './activity.js';

const isOpen = (w) => { const t = today(); return t >= w.opensOn && t <= w.closesOn; };

const windowFor = (programId) => RegistrationWindow.findOne({
  where: { programId }, order: [['closesOn', 'DESC']], include: [{ model: AcademicSession, as: 'session', attributes: ['id', 'name'] }],
});

async function offeredSections(window, programId) {
  const plan = new Map((await CurriculumItem.findAll({ where: { programId }, raw: true })).map((c) => [c.courseId, c.requirement]));
  const sections = await Section.findAll({
    where: { sessionId: window.sessionId },
    include: [{ model: Course, as: 'course' }, { model: Faculty, as: 'faculty', attributes: ['name'] }, { model: TimetableSlot, as: 'slots' }],
  });
  return sections.filter((s) => plan.has(s.courseId)).map((s) => ({
    sectionId: s.id, sectionCode: s.code, code: s.course.code, title: s.course.title, creditHrs: s.course.creditHrs, kind: s.course.kind,
    category: s.course.category, prereq: s.course.prereqCode ?? null, faculty: s.faculty?.name ?? 'To be Confirmed',
    requirement: plan.get(s.courseId), timings: sortedSlots(s.slots.map((x) => x.get({ plain: true }))),
  })).sort((a, b) => a.code.localeCompare(b.code));
}

const passedCodes = (history) => new Set(history.filter((e) => PASSED.includes(e.status)).map((e) => e.code));

export async function registrationOverview(student) {
  const window = await windowFor(student.programId);
  if (!window) return { window: null, message: 'Registration has not been scheduled for your program yet.' };

  const history = await loadEnrollments(student.id);
  const passed = passedCodes(history);
  const mine = new Set(history.filter((e) => e.sessionId === window.sessionId).map((e) => e.sectionId));

  const offered = (await offeredSections(window, student.programId)).map((o) => {
    const reasons = [];
    if (passed.has(o.code)) reasons.push('Already passed');
    if (o.prereq && !passed.has(o.prereq)) reasons.push(`Prerequisite ${o.prereq} not passed`);
    return { ...o, eligible: reasons.length === 0, reasons, selected: mine.has(o.sectionId) };
  });
  return {
    window: { session: window.session.name, semesterNo: window.semesterNo, minCredits: window.minCredits, maxCredits: window.maxCredits, opensOn: window.opensOn, closesOn: window.closesOn, open: isOpen(window) },
    offered,
    registeredCredits: offered.filter((o) => o.selected).reduce((a, o) => a + o.creditHrs, 0),
  };
}

/** Checks every rule and returns human-readable problems (empty ⇒ the selection is valid). */
export function validateSelection(chosen, window, passed) {
  const problems = [];
  for (const c of chosen) {
    if (passed.has(c.code)) problems.push(`${c.code}: you have already passed this course.`);
    else if (c.prereq && !passed.has(c.prereq)) problems.push(`${c.code}: prerequisite ${c.prereq} has not been passed.`);
  }
  for (let i = 0; i < chosen.length; i += 1) for (let j = i + 1; j < chosen.length; j += 1) {
    if (chosen[i].timings.some((a) => chosen[j].timings.some((b) => overlaps(a, b)))) problems.push(`${chosen[i].code} and ${chosen[j].code} meet at the same time.`);
  }
  const credits = chosen.reduce((a, c) => a + c.creditHrs, 0);
  if (credits < window.minCredits) problems.push(`Select at least ${window.minCredits} credit hours (you have ${credits}).`);
  if (credits > window.maxCredits) problems.push(`You can register for at most ${window.maxCredits} credit hours (you have ${credits}).`);
  return { problems, credits };
}

export async function register(student, sectionIds, ip) {
  const window = await windowFor(student.programId);
  if (!window || !isOpen(window)) throw conflict('Registration is not open right now.');

  const pool = new Map((await offeredSections(window, student.programId)).map((o) => [o.sectionId, o]));
  const chosen = [...new Set(sectionIds)].map((id) => {
    const o = pool.get(id);
    if (!o) throw new HttpError(422, 'One of the selected courses is not offered this term.');
    return o;
  });
  const { problems, credits } = validateSelection(chosen, window, passedCodes(await loadEnrollments(student.id)));
  if (problems.length) throw new HttpError(422, 'Your selection cannot be registered.', { problems });

  const sections = await Section.findAll({ where: { id: { [Op.in]: chosen.map((c) => c.sectionId) } }, raw: true });
  await sequelize.transaction(async (transaction) => {
    await Enrollment.destroy({ where: { studentId: student.id, status: 'PENDING', sectionId: { [Op.in]: [...pool.keys()] } }, transaction });
    await Enrollment.bulkCreate(sections.map((s) => ({ studentId: student.id, sectionId: s.id, courseId: s.courseId, sessionId: s.sessionId, status: 'PENDING' })), { transaction });
  });
  await log(student.id, 'Registration', `Registered ${chosen.length} courses (${credits} cr) for ${window.session.name}`, ip);
  return { credits, courses: chosen.length };
}
