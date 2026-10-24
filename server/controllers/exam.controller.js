import { AcademicSession, Course, Enrollment, ExamPaper, Faculty, Op, OnlineExam, Program, SeatAllocation, Section, Student } from '../models/index.js';
import { parse } from '../middleware/errors.js';
import { admitCardQuery } from '../validators/index.js';
import { ledgerWithBalance } from '../services/fees.js';

// a function, not a shared object: Sequelize mutates include objects, so each query needs its own
const withCourse = () => ({ model: Section, as: 'section', include: [{ model: Course, as: 'course', attributes: ['title', 'code'] }] });

async function myPapers(studentId, kind) {
  const papers = await ExamPaper.findAll({
    where: kind ? { kind } : {},
    include: [{ model: SeatAllocation, as: 'seats', where: { studentId }, required: true }, withCourse()],
    order: [['examDate', 'ASC'], ['startTime', 'ASC']],
  });
  return papers.map((p) => ({
    kind: p.kind, date: p.examDate, start: p.startTime, end: p.endTime, room: p.room, seat: p.seats[0].seatNo,
    title: p.section.course.title, code: p.section.course.code, course: `${p.section.course.title} (${p.section.course.code})`,
  }));
}

export async function seating(req, res) {
  res.json({ rows: await myPapers(req.student.id) });
}

export async function online(req, res) {
  const sectionIds = (await Enrollment.findAll({ where: { studentId: req.student.id }, attributes: ['sectionId'], raw: true })).map((e) => e.sectionId);
  const exams = await OnlineExam.findAll({
    where: { sectionId: { [Op.in]: sectionIds } }, order: ['opensAt'],
    include: [{ model: Section, as: 'section', include: [{ model: Course, as: 'course', attributes: ['title', 'code'] }, { model: Faculty, as: 'faculty', attributes: ['name'] }, { model: AcademicSession, as: 'session', attributes: ['name'] }] }],
  });
  const now = new Date();
  res.json({
    rows: exams.map((o) => ({
      id: o.id, title: o.title, opensAt: o.opensAt, closesAt: o.closesAt, durationMin: o.durationMin,
      course: o.section.course.title, code: o.section.course.code, faculty: o.section.faculty?.name ?? 'To be Confirmed', session: o.section.session.name, status: now < o.opensAt ? 'Upcoming' : now > o.closesAt ? 'Closed' : 'Open',
    })),
  });
}

/** Admit card for theory or lab papers — withheld while fee dues exist. */
export async function admitCard(req, res) {
  const { kind } = parse(admitCardQuery, req.query);
  const me = await Student.findByPk(req.student.id, { include: [{ model: Program, as: 'program', attributes: ['name'] }] });
  const student = { name: me.fullName, regNo: me.regNo, enrollmentNo: me.enrollmentNo, program: me.program.name };
  const { balance } = await ledgerWithBalance(req.student.id);
  const rows = await myPapers(req.student.id, kind);

  if (balance > 0) return res.json({ eligible: false, student, rows: [], reason: `Admit card is withheld because you have outstanding dues of Rs ${balance.toLocaleString('en-PK')}. Clear them at the Accounts Office.` });
  if (!rows.length) return res.json({ eligible: false, student, rows: [], reason: 'No exam schedule has been published for you yet.' });
  res.json({ eligible: true, student, kind, rows, issuedOn: new Date().toISOString().slice(0, 10) });
}
