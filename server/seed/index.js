/**
 *   npm run seed        → drops and re-creates every table, then loads the demo data
 *   seed({ today })     → used by the test-suite against a scratch database
 */
import { fileURLToPath } from 'node:url';
import { connectDb, disconnectDb } from '../db.js';
import * as M from '../models/index.js';
import { hashPassword } from '../lib/crypto.js';
import * as D from './data.js';

const rng = (seed) => () => {                       // mulberry32: small, fast, deterministic
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const noon = (s) => new Date(`${s}T12:00:00Z`);
const at = (day, hhmm) => new Date(`${day}T${hhmm}:00Z`);
const counter = () => { let n = 0; return () => (n += 1); };
const DAY_INDEX = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

export async function seed({ today = new Date() } = {}) {
  const T = typeof today === 'string' ? noon(today) : today;
  await M.sequelize.sync({ force: true });                         // fresh schema every time

  // ── reference data ─────────────────────────────────────
  const sessions = {};
  await M.AcademicSession.bulkCreate(D.SESSIONS.map(([name, startDate, endDate], i) => {
    sessions[name] = i + 1;
    return { id: i + 1, name, startDate, endDate, isCurrent: name === D.CURRENT_SESSION };
  }));
  await M.Faculty.bulkCreate(D.FACULTY.map(([code, name], i) => ({ id: i + 1, code, name, email: `${code}@uit.example` })));
  await M.Staff.bulkCreate(D.STAFF.map(([code, name, role], i) => ({ id: i + 1, code, name, role })));

  const courses = {};
  await M.Course.bulkCreate(D.CURRICULUM.map(([, code, title, kind, creditHrs, category, , prereqCode], i) => {
    courses[code] = i + 1;
    return { id: i + 1, code, title, kind, creditHrs, category, prereqCode };
  }));
  await M.Program.create({ id: 1, code: 'BSSE', name: 'BS - Software Engineering - 4Yr', degreeYears: 4 });
  await M.CurriculumItem.bulkCreate(D.CURRICULUM.map(([semesterNo, code, , , , , requirement]) => ({ programId: 1, courseId: courses[code], semesterNo, requirement })));

  // ── sections (+ timetable) ─────────────────────────────
  const sections = {};
  const slotId = counter();
  const sectionRows = []; const slotRows = [];
  D.CURRICULUM.forEach(([, code, , kind, cr, , , , sessionName, facultyIdx], i) => {
    const slots = (sessionName === D.CURRENT_SESSION ? D.FALL26_SLOTS : sessionName === D.NEXT_SESSION ? D.SPRING27_SLOTS : {})[code] ?? [];
    const batch = ['CSE-301', 'CSE-301 (P)', 'CSE-304', 'MSC-203'].includes(code) ? '24SP' : '23FA';
    sections[code] = i + 1;
    sectionRows.push({
      id: i + 1, courseId: courses[code], sessionId: sessions[sessionName], facultyId: facultyIdx == null ? null : facultyIdx + 1,
      code: `${sessionName}-${batch}-BS SE-${code}-A-${8701 + i}`, scheduled: slots.length ? slots.length * 16 : (kind === 'LAB' ? 16 : cr * 16),
    });
    for (const [day, startTime, endTime, room] of slots) slotRows.push({ id: slotId(), sectionId: i + 1, day, startTime, endTime, room });
  });
  await M.Section.bulkCreate(sectionRows);
  await M.TimetableSlot.bulkCreate(slotRows);

  // ── people ─────────────────────────────────────────────
  const passwordHash = await hashPassword(D.DEMO_PASSWORD);
  const person = (n, fullName, extra = {}) => ({
    id: n, regNo: `23FA-${String(n).padStart(3, '0')}-SE`, enrollmentNo: `UITU-23FA-UGRAD-${String(n).padStart(5, '0')}`, passwordHash,
    fullName, programId: 1, sectionLabel: 'A', dob: '2004-03-12', nic: '4210100000000', gender: 'Female', ...extra,
  });
  await M.Student.bulkCreate([
    person(1, 'Ayesha Rahman', { dob: '2004-05-17', nic: '4220112345671' }),
    person(2, 'Bilal Ahmed', { dob: '2003-11-02', nic: '4220198765433', gender: 'Male' }),
    ...D.CLASSMATES.map((name, i) => person(i + 3, name)),
  ]);
  await M.StudentProfile.bulkCreate([
    { studentId: 1, taxPayeeName: 'Rahman Ahmed', taxPayeeNic: '4220156789013', ntnNumber: '1234567-8', isFiler: true, guardianRelation: 'Father', guardianName: 'Rahman Ahmed', guardianOccupation: 'Business', guardianCell: '+92 300 0000001', guardianCnic: '4220156789013', guardianEmail: 'guardian.demo@example.com', permanentAddress: 'House 12, Street 4, Block B, Gulshan-e-Iqbal, Karachi', presentAddress: 'House 12, Street 4, Block B, Gulshan-e-Iqbal, Karachi', cell: '+92 300 0000002', personalEmail: 'ayesha.demo@example.com', officialEmail: '23fa-001-se@uit.example', cnic: '4220112345671' },
    { studentId: 2, taxPayeeName: 'Ahmed Khan', taxPayeeNic: '4220111111113', ntnNumber: '7654321-0', isFiler: true, guardianRelation: 'Father', guardianName: 'Ahmed Khan', guardianOccupation: 'Engineer', guardianCell: '+92 300 0000003', guardianCnic: '4220111111113', guardianEmail: 'guardian2.demo@example.com', permanentAddress: 'Flat 5, Sector 11-A, North Karachi, Karachi', presentAddress: 'Flat 5, Sector 11-A, North Karachi, Karachi', cell: '+92 300 0000004', personalEmail: 'bilal.demo@example.com', officialEmail: '23fa-002-se@uit.example', cnic: '4220198765433' },
  ]);

  // ── academic history, attendance, marks ────────────────
  const assessmentId = counter();
  const termAssessments = {}; const assessmentRows = [];
  for (const code of Object.keys(D.FALL26_SLOTS).filter((c) => c !== 'CSE-496')) {
    termAssessments[code] = [['Quiz', 'Quiz 1', 10, 4], ['Assignment', 'Assignment 1', 10, 4], ['Quiz', 'Quiz 2', 10, 4], ['Mid Term', 'Mid Term Exam', 30, 12]]
      .map(([kind, name, total, passing]) => ({ id: assessmentId(), sectionId: sections[code], kind, name, total, passing }));
    assessmentRows.push(...termAssessments[code]);
  }
  await M.Assessment.bulkCreate(assessmentRows);

  const termStart = noon(D.SESSIONS.find((s) => s[0] === D.CURRENT_SESSION)[1]);
  const enrollmentId = counter();
  const buildHistory = async (studentId, seedNo, skill) => {
    const rr = rng(seedNo);
    const enrollments = []; const attendance = []; const plo = []; const marks = [];
    for (const [, code, , , , , , , sessionName] of D.CURRICULUM) {
      if (sessionName === D.NEXT_SESSION) continue;
      const live = sessionName === D.CURRENT_SESSION;
      const [grade, gradePts] = D.GRADES[Math.min(D.GRADES.length - 1, Math.floor(Math.pow(rr(), 1.4 / skill) * 5.4))];
      const id = enrollmentId();
      enrollments.push({ id, studentId, sectionId: sections[code], courseId: courses[code], sessionId: sessions[sessionName], status: live ? 'IN_PROG' : 'PASS', grade: live ? null : grade, gradePts: live ? null : gradePts });

      const sos = [...D.SO_POOL].sort(() => rr() - 0.5).slice(0, 2 + Math.floor(rr() * 2));
      for (const soNo of sos) plo.push({ enrollmentId: id, soNo, percent: live ? 0 : Math.round((70 + rr() * 30) * 100) / 100, weight: [0.5, 1, 1.5, 2, 4.5, 5][Math.floor(rr() * 6)] });

      if (!live) continue;
      const p = 0.8 + rr() * 0.19;
      for (const [day, start] of D.FALL26_SLOTS[code]) {
        let d = addDays(termStart, (DAY_INDEX[day] - termStart.getUTCDay() + 7) % 7);
        for (let w = 1; d <= T && w <= 16; w += 1, d = addDays(d, 7)) attendance.push({ enrollmentId: id, heldOn: iso(d), topic: `Lecture ${w} (${start})`, present: rr() < p });
      }
      for (const a of termAssessments[code] ?? []) marks.push({ assessmentId: a.id, studentId, obtained: Math.round(a.total * (0.55 + rr() * 0.42) * 2) / 2 });
    }
    await M.Enrollment.bulkCreate(enrollments);
    await M.AttendanceRecord.bulkCreate(attendance);
    await M.PloScore.bulkCreate(plo);
    await M.AssessmentMark.bulkCreate(marks);
  };
  await buildHistory(1, 11, 1.2);
  await buildHistory(2, 29, 0.8);

  // ── fees ───────────────────────────────────────────────
  let receipt = 90290;
  const ledger = []; const receipts = [];
  for (const studentId of [1, 2]) {
    D.SESSIONS.slice(0, 8).forEach(([name, start], i) => {
      const tuition = (name.startsWith('Summer') ? 38000 : 165000) + i * 4500;
      const charges = name.startsWith('Summer') ? 0 : 8000;
      const no = String((receipt += 37)).padStart(10, '0');
      const paidOn = iso(addDays(noon(start), -9));
      receipts.push({ studentId, receiptNo: `${no}-23FA-${String(studentId).padStart(3, '0')}-SE`, receivedOn: paidOn, amount: tuition + charges });
      ledger.push({ studentId, sessionId: sessions[name], postedOn: paidOn, description: `Advance (${no}), Pay Order No ${26856431 + i * 311} HBL`, feeNature: 'Tuition Fee', debit: 0, credit: tuition + charges });
      ledger.push({ studentId, sessionId: sessions[name], postedOn: start, description: `${name} tuition fee`, feeNature: 'Tuition Fee', debit: tuition, credit: 0 });
      if (charges) ledger.push({ studentId, sessionId: sessions[name], postedOn: start, description: `${name} semester charges`, feeNature: 'Semester Charges', debit: charges, credit: 0 });
    });
  }
  await M.AdvanceReceipt.bulkCreate(receipts);
  await M.LedgerEntry.bulkCreate(ledger);

  // ── exams ──────────────────────────────────────────────
  const papers = [
    ...D.FINALS.map(([code, examDate], i) => ({ id: i + 1, sectionId: sections[code], kind: 'FINAL', examDate, startTime: '09:00', endTime: '12:00', room: `Exam Hall ${1 + (i % 3)}` })),
    { id: D.FINALS.length + 1, sectionId: sections['CSE-301 (P)'], kind: 'LAB', examDate: '2026-12-18', startTime: '14:30', endTime: '17:25', room: 'Communication System Lab' },
  ];
  await M.ExamPaper.bulkCreate(papers);
  await M.SeatAllocation.bulkCreate(papers.flatMap((p, i) => (p.kind === 'LAB'
    ? [{ paperId: p.id, studentId: 1, seatNo: 'L-07' }, { paperId: p.id, studentId: 2, seatNo: 'L-08' }]
    : [{ paperId: p.id, studentId: 1, seatNo: `E-${100 + i * 7}` }, { paperId: p.id, studentId: 2, seatNo: `E-${101 + i * 7}` }])));
  await M.OnlineExam.create({ sectionId: sections['CSE-304'], title: 'Quiz 3 (Online) – Estimation Techniques', opensAt: at(iso(addDays(T, 2)), '10:00'), closesAt: at(iso(addDays(T, 2)), '22:00'), durationMin: 30 });

  // ── student tools ──────────────────────────────────────
  const when = (days, hm) => at(iso(addDays(T, days)), hm);
  await M.Todo.bulkCreate([
    { studentId: 1, task: 'FYP proposal draft', dueDate: iso(addDays(T, 6)), status: 'In Progress', priority: 'High', createdAt: when(-9, '10:00') },
    { studentId: 1, task: 'Submit SPM assignment 2', dueDate: iso(addDays(T, 2)), status: 'Not Started', priority: 'Medium', createdAt: when(-4, '10:00') },
    { studentId: 1, task: 'Return library books', dueDate: iso(addDays(T, -3)), active: false, status: 'Completed', priority: 'Low', createdAt: when(-20, '10:00') },
    { studentId: 2, task: 'Prepare mid-term revision notes', dueDate: iso(addDays(T, 4)), priority: 'Medium', createdAt: when(-1, '10:00') },
  ]);
  await M.Message.bulkCreate([
    { ownerId: 1, box: 'inbox', partyName: 'Mr. Owais Jamil', partyRole: 'Faculty', subject: 'SPM assignment 2 guidelines', body: 'Please follow the IEEE template. Submission is via the portal by Friday.', createdAt: when(-2, '09:15') },
    { ownerId: 1, box: 'inbox', partyName: 'Examination Cell', partyRole: 'Admin', subject: 'Final term datesheet published', body: 'The final term datesheet for Fall 2026 is now available. Check Exam › Exam Seating Plan.', createdAt: when(-5, '14:02'), readAt: when(-5, '18:00') },
    { ownerId: 1, box: 'inbox', partyName: 'Dr. Tariq Lodhi', partyRole: 'Faculty', subject: 'Audit case study groups', body: 'Groups for the audit case study are final. Contact me if you need changes.', createdAt: when(-8, '11:40'), readAt: when(-8, '12:30') },
    { ownerId: 1, box: 'sent', partyName: 'Mr. Owais Jamil', partyRole: 'Faculty', subject: 'Question about milestone 2', body: 'Sir, may we submit milestone 2 as a single PDF?', createdAt: when(-3, '16:20') },
  ]);
  await M.Workflow.bulkCreate([
    { studentId: 1, sessionId: sessions[D.CURRENT_SESSION], kind: 'Course Withdrawal', dueDate: iso(addDays(T, 10)), description: 'Request to withdraw from MSC-301 due to timetable overlap with FYP meetings.', status: 'Draft' },
    { studentId: 1, sessionId: sessions['Spring 2026'], kind: 'Transcript Request', dueDate: iso(addDays(T, -120)), description: 'Unofficial transcript for internship application.', status: 'Approved', finalSubmitted: true },
  ]);
  await M.Announcement.bulkCreate([
    { title: 'ANNOUNCEMENT – FALL 2026 COURSE REGISTRATION', postedOn: iso(addDays(T, -9)), author: 'Registrar Office',
      body: 'Dear Students,\n\nAll students are advised to thoroughly review the courses appearing on their EDU Portal for Fall 2026 and ensure that the courses listed are correct and in accordance with the approved curriculum and semester requirements.\n\nStudents are particularly advised to carefully verify their elective/major courses.\n\nIn case of any discrepancy, missing course, or incorrectly registered course, students are requested to report the matter to the Registrar Office immediately for necessary correction.\n\nRegistrar Office' },
    { title: 'Mid-term examinations concluded', postedOn: iso(addDays(T, -14)), author: 'Examination Cell', body: 'Mid-term marks are being uploaded by faculty. Please check Assessment Result regularly and report any mismatch to your course teacher within 5 working days.' },
    { title: 'Library extended hours', postedOn: iso(addDays(T, -20)), author: 'Library', body: 'The central library will remain open until 10 PM on weekdays during the final-term preparation period.' },
  ]);
  const titleOf = (code) => D.CURRICULUM.find((c) => c[1] === code)[2];
  await M.Survey.bulkCreate([
    ...['CSE-304', 'CSE-301', 'ASC-201'].map((code) => ({ kind: 'Feedback', title: `Course feedback – ${titleOf(code)}`, sectionId: sections[code], opensOn: iso(addDays(T, -3)), closesOn: iso(addDays(T, 21)) })),
    { kind: 'Survey', title: 'Campus facilities survey 2026', opensOn: iso(addDays(T, -1)), closesOn: iso(addDays(T, 14)) },
  ]);
  await M.RegistrationWindow.create({ sessionId: sessions[D.NEXT_SESSION], programId: 1, semesterNo: 8, minCredits: 9, maxCredits: 18, opensOn: iso(addDays(T, -7)), closesOn: iso(addDays(T, 30)) });
  await M.ActivityLog.bulkCreate([[1, '09:42'], [2, '02:47'], [2, '02:48'], [3, '11:40'], [3, '12:16'], [4, '11:49'], [5, '02:07'], [6, '02:11']]
    .map(([back, hm], i) => ({ studentId: 1, action: 'Login Details', detail: 'Student Logged In', ip: `10.0.0.${10 + i}`, createdAt: at(iso(addDays(T, -back)), hm) })));

  return { demoReg: '23FA-001-SE', secondReg: '23FA-002-SE', password: D.DEMO_PASSWORD };
}

// CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await connectDb();
  const info = await seed();
  const counts = await Promise.all(['Student', 'Course', 'Section', 'Enrollment', 'AttendanceRecord', 'LedgerEntry'].map(async (m) => `${m} ${await M[m].count()}`));
  console.log('Seeded MySQL:', counts.join(', '));
  console.log(`Demo sign-in → ${info.demoReg} / ${info.password}`);
  await disconnectDb();
}
