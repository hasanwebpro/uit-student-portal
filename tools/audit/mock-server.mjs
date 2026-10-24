/**
 * STAND-IN for the real API, used only to exercise the React build when no MySQL server is available.
 * Response shapes mirror server/controllers/*. It is NOT the backend and proves nothing about it.
 */
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dist = path.join(root, 'client', 'dist');
const app = express();
app.use(express.json()); app.use(cookieParser());

const ME = { hasAvatar: false, id: 1, regNo: '23FA-001-SE', fullName: 'Ayesha Rahman', enrollmentNo: 'UITU-23FA-UGRAD-00001', section: 'A', status: 'Active', program: 'BS - Software Engineering - 4Yr', programCode: 'BSSE', session: 'Fall 2026' };
const slot = (day, start, end, room) => ({ day, start, end, room });
const COURSES = [
  { enrollmentId: 1, title: 'Probability and Statistics', code: 'ASC-201', sectionCode: 'Fall 2026-23FA-BS SE-ASC-201-A-8741', kind: 'TH', creditHrs: 3, faculty: 'Ms. Hina Qureshi', timings: [slot('Wednesday', '12:30', '13:25', 'R-303'), slot('Wednesday', '13:30', '14:25', 'R-303'), slot('Thursday', '10:30', '11:25', 'R-203')], attendance: { scheduled: 48, conducted: 30, attended: 27, absent: 3, percentage: 90, level: 'good' } },
  { enrollmentId: 2, title: 'Software Construction and Development', code: 'CSE-301', sectionCode: 'Fall 2026-24SP-BS SE-CSE-301-A-8742', kind: 'TH', creditHrs: 3, faculty: 'Ms. Rabia Hashmi', timings: [slot('Thursday', '15:30', '16:25', 'Computing Lab-Library'), slot('Thursday', '16:30', '17:25', 'Computing Lab-Library')], attendance: { scheduled: 32, conducted: 20, attended: 15, absent: 5, percentage: 75, level: 'warn' } },
  { enrollmentId: 3, title: 'Information Systems Audit', code: 'CSC-320', sectionCode: 'Fall 2026-23FA-BS SE-CSC-320-A-8749', kind: 'TH', creditHrs: 3, faculty: 'Dr. Tariq Lodhi', timings: [slot('Tuesday', '10:30', '11:25', 'R-201'), slot('Tuesday', '11:30', '12:25', 'R-201'), slot('Tuesday', '12:30', '13:25', 'R-201')], attendance: { scheduled: 48, conducted: 30, attended: 21, absent: 9, percentage: 70, level: 'risk' } },
  { enrollmentId: 4, title: 'Capstone Project - I', code: 'CSE-496', sectionCode: 'Fall 2026-23FA-BS SE-CSE-496-A-8750', kind: 'TH', creditHrs: 3, faculty: 'To be Confirmed', timings: [slot('Sunday', '16:30', '17:25', 'Auditorium')], attendance: { scheduled: 16, conducted: 9, attended: 9, absent: 0, percentage: 100, level: 'good' } },
];
const HISTORY = [['Fall 2023', 3.44, 3.44], ['Spring 2024', 3.44, 3.44], ['Fall 2024', 3.49, 3.46], ['Spring 2025', 3.15, 3.38], ['Summer 2025', 3.67, 3.4], ['Fall 2025', 3.51, 3.43], ['Spring 2026', 3.37, 3.42]].map(([session, gpa, cgpa]) => ({ session, courses: 5, credits: 15, gpa, cgpa }));
const LEDGER = [
  { id: 1, postedOn: '2026-08-08', description: 'Advance (0000090290), Pay Order No 26856431 HBL', feeNature: 'Tuition Fee', debit: 0, credit: 205500, session: 'Fall 2026', balance: -205500 },
  { id: 2, postedOn: '2026-08-17', description: 'Fall 2026 tuition fee', feeNature: 'Tuition Fee', debit: 197500, credit: 0, session: 'Fall 2026', balance: -8000 },
  { id: 3, postedOn: '2026-08-17', description: 'Fall 2026 semester charges', feeNature: 'Semester Charges', debit: 8000, credit: 0, session: 'Fall 2026', balance: 0 },
];
const todos = [{ id: 1, task: 'FYP proposal draft', dueDate: '2026-10-30', createdOn: '2026-10-15', active: true, status: 'In Progress', priority: 'High' }, { id: 2, task: 'Return library books', dueDate: '2026-10-20', createdOn: '2026-10-01', active: false, status: 'Completed', priority: 'Low' }];
let todoId = 3;
const messages = [
  { id: 1, box: 'inbox', party: 'Mr. Owais Jamil', role: 'Faculty', subject: 'SPM assignment 2 guidelines', body: 'Please follow the IEEE template.', createdAt: '2026-10-22T09:15:00Z', read: false, commType: 'Query', priority: 'Medium', category: 'Academic', dueDate: null, followUp: false, reminder: false },
  { id: 2, box: 'inbox', party: 'Examination Cell', role: 'Admin', subject: 'Final term datesheet published', body: 'The datesheet is now available.', createdAt: '2026-10-19T14:02:00Z', read: true, commType: 'Announcement', priority: 'Low', category: 'Information', dueDate: null, followUp: false, reminder: false },
  { id: 3, box: 'sent', party: 'Mr. Owais Jamil', role: 'Faculty', subject: 'Question about milestone 2', body: 'Sir, may we submit as a single PDF?', createdAt: '2026-10-21T16:20:00Z', read: true, commType: 'Query', priority: 'Low', category: 'Academic', dueDate: '2026-10-30', followUp: true, reminder: false },
];
const workflows = [{ id: 1, session: 'Fall 2026', kind: 'Course Withdrawal', dueDate: '2026-11-03', description: 'Withdraw from MSC-301 due to timetable overlap.', status: 'Draft', finalSubmitted: false, createdAt: '2026-10-20T10:00:00Z' }, { id: 2, session: 'Spring 2026', kind: 'Transcript Request', dueDate: '2026-06-01', description: 'Transcript for internship.', status: 'Approved', finalSubmitted: true, createdAt: '2026-05-20T10:00:00Z' }];
const surveys = [{ id: 1, kind: 'Feedback', title: 'Course feedback – Software Project Management', opensOn: '2026-10-21', closesOn: '2026-11-14', course: 'Software Project Management', faculty: 'Mr. Owais Jamil', session: 'Fall 2026', myRating: null, status: 'Pending' }, { id: 2, kind: 'Survey', title: 'Campus facilities survey 2026', opensOn: '2026-10-23', closesOn: '2026-11-07', course: null, faculty: null, session: null, myRating: 4, status: 'Submitted' }];
const roadRows = [
  ['Programming Fundamentals', 'CSE-101', 1, 'PASS', 'A', 3], ['Calculus & Analytical Geometry', 'MSC-101', 1, 'PASS', 'B+', 3], ['Object Oriented Programming', 'CSE-102', 2, 'PASS', 'A-', 3],
  ['Software Construction and Development', 'CSE-301', 7, 'IN_PROG', '', 3], ['Capstone Project - II', 'CSE-497', 8, 'ETR', '', 3],
].map(([title, code, semesterNo, status, grade, creditHrs]) => ({ semesterNo, session: status === 'ETR' ? '' : 'Fall 2023', courseType: 'Comp.Core', requirement: 'Core', course: `${title} - (${code})`, code, kind: 'TH', creditHrs, prereq: '', prereqStatus: '', status, creditsEarned: status === 'PASS' ? creditHrs : 0, grade }));
const offered = [
  { sectionId: 101, sectionCode: 'S1', code: 'CSE-497', title: 'Capstone Project - II', creditHrs: 3, kind: 'TH', category: 'Comp Sc.Core', prereq: 'CSE-496', faculty: 'Dr. Nadia Farooqui', requirement: 'Core', timings: [slot('Monday', '14:30', '15:25', 'R-101')], eligible: false, reasons: ['Prerequisite CSE-496 not passed'], selected: false },
  { sectionId: 102, sectionCode: 'S2', code: 'CSE-401', title: 'Software Re-engineering', creditHrs: 3, kind: 'TH', category: 'Comp Sc.Core', prereq: 'CSE-306', faculty: 'Mr. Owais Jamil', requirement: 'Core', timings: [slot('Tuesday', '10:30', '12:25', 'R-204')], eligible: true, reasons: [], selected: false },
  { sectionId: 103, sectionCode: 'S3', code: 'CSE-403', title: 'Information Security', creditHrs: 3, kind: 'TH', category: 'Comp Sc.Core', prereq: 'CSE-305', faculty: 'Mr. Danish Ansari', requirement: 'Core', timings: [slot('Wednesday', '10:30', '12:25', 'R-204')], eligible: true, reasons: [], selected: false },
];
let profile = {
  identity: { fullName: 'Ayesha Rahman', regNo: '23FA-001-SE', dob: '2004-05-17', nic: '4220112345671', gender: 'Female', program: ME.program },
  tax: { payeeName: 'Rahman Ahmed', payeeNic: '4220156789013', selfPayee: false, ntn: '1234567-8', isFiler: true },
  guardian: { relation: 'Father', name: 'Rahman Ahmed', occupation: 'Business', cell: '+92 300 0000001', cnic: '4220156789013', email: 'guardian.demo@example.com' },
  address: { permanent: 'House 12, Street 4, Gulshan, Karachi', present: 'House 12, Street 4, Gulshan, Karachi' },
  personal: { cell: '+92 300 0000002', personalEmail: 'ayesha.demo@example.com', officialEmail: '23fa-001-se@uit.example', cnic: '4220112345671' },
};
const ann = [{ id: 1, title: 'ANNOUNCEMENT – FALL 2026 COURSE REGISTRATION', body: 'Dear Students,\n\nAll students are advised to review the courses appearing on their portal.\n\nRegistrar Office', postedOn: '2026-10-15', author: 'Registrar Office' }, { id: 2, title: 'Library extended hours', body: 'Open until 10 PM on weekdays.', postedOn: '2026-10-04', author: 'Library' }];

const guard = (req, res, next) => (req.cookies.sid === 'ok' ? next() : res.status(401).json({ error: 'Please sign in to continue.' }));
const api = express.Router();
api.post('/auth/login', (req, res) => {
  if (typeof req.body.remember !== 'boolean' && req.body.remember !== undefined) return res.status(422).json({ error: 'bad remember' });
  if (req.body.regNo?.toUpperCase() === '23FA-001-SE' && req.body.password === 'Portal@2026') { res.cookie('sid', 'ok', { httpOnly: true, sameSite: 'strict' }); return res.json({ student: ME }); }
  res.status(401).json({ error: 'Registration number or password is incorrect.' });
});
api.post('/auth/refresh', (req, res) => (req.cookies.sid === 'ok' ? res.json({ student: ME }) : res.status(401).json({ error: 'Please sign in to continue.' })));
api.post('/auth/logout', (_q, res) => { res.clearCookie('sid'); res.status(204).end(); });
api.get('/auth/me', (req, res) => res.json({ student: req.cookies.sid === 'ok' ? ME : null }));
api.post('/auth/change-password', guard, (req, res) => (req.body.currentPassword === 'Portal@2026' ? res.json({ ok: true }) : res.status(422).json({ error: 'Please correct the highlighted fields.', details: { currentPassword: 'Current password is incorrect.' } })));
api.use(guard);
api.get('/dashboard', (_q, res) => res.json({
  me: { fullName: ME.fullName, regNo: ME.regNo, enrollmentNo: ME.enrollmentNo, section: 'A', status: 'Active', program: ME.program, session: 'Fall 2026' },
  stats: { currentBalance: 0, cgpa: 3.42, registeredCourses: 4, averageAttendance: 84 },
  courses: COURSES.map((c) => ({ enrollmentId: c.enrollmentId, title: c.title, code: c.code, faculty: c.faculty, rooms: [...new Set(c.timings.map((t) => t.room))], timings: c.timings, attendance: c.attendance })),
  gpaTrend: HISTORY, degree: { earned: 96, required: 134, percent: 72, remaining: 38 },
  activity: [{ action: 'Login Details', detail: 'Student Logged In', at: '2026-10-23T09:42:00Z' }, { action: 'Profile', detail: 'Profile updated', at: '2026-10-22T02:47:00Z' }],
  announcements: ann, todos: todos.filter((t) => t.active).map(({ id, task, dueDate, status, priority }) => ({ id, task, dueDate, status, priority })),
  surveys: surveys.filter((x) => x.status === 'Pending').map(({ id, kind, title, closesOn }) => ({ id, kind, title, closesOn })), pendingSurveys: 1, unreadMessages: 1, ledger: { balance: 0, entries: LEDGER, recent: [...LEDGER].reverse() }, nextClass: { title: 'Information Systems Audit', day: 'Tuesday', start: '10:30', end: '11:25', room: 'R-201', inDays: 3 },
}));
api.get('/courses', (_q, res) => res.json({ session: 'Fall 2026', courses: COURSES }));
api.get('/courses/:id', (req, res) => { const c = COURSES.find((x) => x.enrollmentId === Number(req.params.id)); return c ? res.json({ course: { title: c.title, code: c.code, sectionCode: c.sectionCode, kind: c.kind, creditHrs: c.creditHrs, category: 'Comp Sc.Core', prereq: 'CSE-202', faculty: c.faculty, session: 'Fall 2026', status: 'IN_PROG' }, timings: c.timings, attendance: c.attendance, marks: [{ kind: 'Quiz', name: 'Quiz 1', total: 10, passing: 4, obtained: 8 }, { kind: 'Mid Term', name: 'Mid Term Exam', total: 30, passing: 12, obtained: null }], progress: { obtained: 8, total: 10 } }) : res.status(404).json({ error: 'That course is not in your record.' }); });
api.get('/attendance', (_q, res) => res.json({ session: 'Fall 2026', overall: 84, rows: COURSES.map((c) => ({ enrollmentId: c.enrollmentId, course: c.title, code: c.code, sectionCode: c.sectionCode, faculty: c.faculty, ...c.attendance })) }));
api.get('/attendance/:id', (_q, res) => res.json({ course: 'Probability and Statistics (ASC-201)', summary: COURSES[0].attendance, records: [{ date: '2026-10-22', topic: 'Lecture 10', present: true }, { date: '2026-10-21', topic: 'Lecture 9', present: false }] }));
api.get('/timetable', (_q, res) => res.json({ session: 'Fall 2026', dayOrder: [], rows: COURSES.map((c) => { const days = {}; for (const t of c.timings) (days[t.day] ??= []).push({ start: t.start, end: t.end, room: t.room }); return { title: c.title, code: c.code, sectionCode: c.sectionCode, faculty: c.faculty, rooms: [...new Set(c.timings.map((t) => t.room))], days }; }) }));
api.get('/assessments/filters', (_q, res) => res.json({ sessions: [{ id: 8, name: 'Fall 2026', isCurrent: true }, { id: 7, name: 'Spring 2026', isCurrent: false }], courses: [{ sessionId: 8, id: 1, label: 'Probability and Statistics (ASC-201)' }] }));
api.get('/assessments', (_q, res) => res.json({ rows: [{ type: 'Quiz', assessment: 'Quiz 1', title: 'Probability and Statistics', code: 'ASC-201', sectionCode: 'x', teacher: 'Ms. Hina Qureshi', total: 10, passing: 4, obtained: 8, passed: true, session: 'Fall 2026' }, { type: 'Mid Term', assessment: 'Mid Term Exam', title: 'Information Systems Audit', code: 'CSC-320', sectionCode: 'y', teacher: 'Dr. Tariq Lodhi', total: 30, passing: 12, obtained: 9, passed: false, session: 'Fall 2026' }] }));
let verification = { verified: false, comments: '', updatedAt: null };
api.get('/roadmap', (_q, res) => res.json({ student: { name: ME.fullName, regNo: ME.regNo, program: ME.program, session: 'Fall 2026' }, rows: roadRows, totalEarned: 9, cgpa: 3.42, history: HISTORY, fee: { balance: 0, loan: 0 }, verification,
  legend: [['PASS', 'Pass'], ['IN_PROG', 'In progress'], ['ETR', 'Eligible To Register'], ['NETR', 'Not Eligible To Register'], ['SUB_PASS', 'Substitute Course Pass'], ['SUB_IN_PROG', 'Substitute in progress'], ['PENDING', 'Registration pending'], ['FAIL', 'Failed']] }));
api.put('/roadmap/verification', (req, res) => { verification = { verified: !!req.body.verified, comments: req.body.comments ?? '', updatedAt: new Date().toISOString() }; res.json({ verification }); });
api.get('/transcript/programs', (_q, res) => res.json({ programs: [{ id: 1, name: ME.program }] }));
api.get('/transcript', (_q, res) => res.json({ student: { name: ME.fullName, regNo: ME.regNo, enrollmentNo: ME.enrollmentNo, program: ME.program }, terms: HISTORY.slice(0, 2).map((h) => ({ ...h, courses: [{ code: 'CSE-101', title: 'Programming Fundamentals', creditHrs: 3, grade: 'A', points: 4 }] })), cgpa: 3.44, creditsEarned: 30, generatedOn: '2026-10-24', notice: 'Unofficial copy.' }));
api.get('/plo', (_q, res) => res.json({ student: { regNo: ME.regNo, name: ME.fullName, program: 'BS SE', batch: '23FA - BS' }, reportDate: new Date().toISOString(), sos: [1, 2, 3, 4],
  semesters: [{ semesterNo: 3, rows: [{ course: 'CSE-201 - Data Structures & Algorithms', faculty: 'Ms. Rabia Hashmi (607)', credit: '3 + 0', creditHrs: 3, room: 'Fall 2024-23FA-BS SE-CSE-201-A-8714', scores: { 2: { percent: 100, weight: 0.5 }, 3: { percent: 83.33, weight: 3 } } }, { course: 'CSE-205 - Database Systems', faculty: 'Dr. Tariq Lodhi (608)', credit: '3 + 0', creditHrs: 3, room: 'Fall 2024-23FA-BS SE-CSE-205-A-8716', scores: { 1: { percent: 0, weight: 1 }, 3: { percent: 100, weight: 2 } } }] }],
  total: { 1: { percent: 0, weight: 1 }, 2: { percent: 100, weight: 0.5 }, 3: { percent: 93.33, weight: 5 }, 4: { percent: 0, weight: 0 } } }));
api.get('/exams/seating', (_q, res) => res.json({ rows: [{ kind: 'FINAL', date: '2026-12-21', start: '09:00', end: '12:00', room: 'Exam Hall 1', seat: 'E-100', title: 'Information Systems Audit', code: 'CSC-320', course: 'Information Systems Audit (CSC-320)' }] }));
api.get('/exams/online', (_q, res) => res.json({ rows: [{ id: 1, title: 'Quiz 3 (Online)', opensAt: '2026-10-26T10:00:00Z', closesAt: '2026-10-26T22:00:00Z', durationMin: 30, course: 'Software Project Management', code: 'CSE-304', faculty: 'Mr. Owais Jamil', session: 'Fall 2026', status: 'Upcoming' }] }));
api.get('/exams/admit-card', (req, res) => res.json(req.query.kind === 'LAB' ? { eligible: false, student: ME, rows: [], reason: 'No exam schedule has been published for you yet.' } : { eligible: true, kind: 'FINAL', issuedOn: '2026-10-24', student: { name: ME.fullName, regNo: ME.regNo, enrollmentNo: ME.enrollmentNo, program: ME.program }, rows: [{ kind: 'FINAL', date: '2026-12-21', start: '09:00', end: '12:00', room: 'Exam Hall 1', seat: 'E-100', title: 'x', code: 'CSC-320', course: 'Information Systems Audit (CSC-320)' }] }));
api.get('/fees/ledger', (_q, res) => res.json({ student: { name: ME.fullName, regNo: ME.regNo, program: ME.program }, reportDate: new Date().toISOString(), entries: LEDGER, totals: { charged: 205500, paid: 205500 }, balance: 0 }));
api.get('/fees/advance', (_q, res) => res.json({ rows: [{ id: 1, receiptNo: '0000090290', receivedOn: '2026-08-08', amount: 205500 }] }));
api.get('/fees/advance/:id', (_q, res) => res.json({ receipt: { id: 1, receiptNo: '0000090290', receivedOn: '2026-08-08', amount: 205500, name: ME.fullName, regNo: ME.regNo, mode: 'Pay Order', bank: 'HBL' } }));
api.get('/todos', (_q, res) => res.json({ rows: todos }));
api.post('/todos', (req, res) => { if (!req.body.task) return res.status(422).json({ error: 'Please correct the highlighted fields.', details: { task: 'Task is required.' } }); const t = { id: todoId++, createdOn: '2026-10-24', ...req.body }; todos.push(t); res.status(201).json({ todo: t }); });
api.put('/todos/:id', (req, res) => { const t = todos.find((x) => x.id === Number(req.params.id)); Object.assign(t, req.body); res.json({ todo: t }); });
api.delete('/todos/:id', (req, res) => { todos.splice(todos.findIndex((x) => x.id === Number(req.params.id)), 1); res.status(204).end(); });
api.get('/messages', (req, res) => res.json({ rows: messages.filter((m) => m.box === (req.query.box ?? 'inbox')), unread: messages.filter((m) => m.box === 'inbox' && !m.read).length }));
api.get('/messages/recipients', (req, res) => res.json({ rows: req.query.type === 'student' ? Array.from({ length: 23 }, (_, i) => ({ id: 20 + i, name: `Classmate ${i + 1}`, detail: `23FA-${String(i + 3).padStart(3, '0')}-SE` })) : [{ id: 1, name: 'Dr. Nadia Farooqui', detail: '601' }, { id: 2, name: 'Prof. Imran Siddiqui', detail: '602' }] }));
api.get('/messages/:id', (req, res) => { const m = messages.find((x) => x.id === Number(req.params.id)); m.read = true; res.json({ message: m }); });
api.post('/messages', (_q, res) => res.status(201).json({ ok: true, delivered: 1 }));
api.delete('/messages/:id', (_q, res) => res.status(204).end());
api.get('/workflows', (_q, res) => res.json({ rows: workflows }));
api.post('/workflows', (req, res) => res.status(201).json({ workflow: { id: 9, ...req.body, status: 'Draft', finalSubmitted: false } }));
api.put('/workflows/:id', (_q, res) => res.json({ workflow: workflows[0] }));
api.delete('/workflows/:id', (_q, res) => res.status(204).end());
api.post('/workflows/:id/submit', (_q, res) => res.json({ workflow: workflows[0] }));
api.get('/announcements', (_q, res) => res.json({ rows: ann }));
api.get('/surveys', (_q, res) => res.json({ rows: surveys }));
api.post('/surveys/:id/respond', (_q, res) => res.status(201).json({ ok: true }));
api.get('/activity', (_q, res) => res.json({ rows: [{ id: 1, action: 'Login Details', detail: 'Student Logged In', ip: '10.0.0.1', at: '2026-10-23T09:42:00Z' }] }));
api.get('/registration', (_q, res) => res.json({ window: { session: 'Spring 2027', semesterNo: 8, minCredits: 9, maxCredits: 18, opensOn: '2026-10-17', closesOn: '2026-11-23', open: true }, offered, registeredCredits: 0 }));
api.post('/registration', (req, res) => (req.body.sectionIds.length < 3 ? res.status(422).json({ error: 'Your selection cannot be registered.', details: { problems: ['Select at least 9 credit hours (you have 3).'] } }) : res.json({ ok: true, credits: 9, courses: 3 })));
api.get('/profile/avatar', (_q, res) => res.status(404).json({ error: 'No profile picture.' }));
api.put('/profile/avatar', express.raw({ type: ['image/jpeg', 'image/png'], limit: '120kb' }), (_q, res) => { ME.hasAvatar = true; res.json({ ok: true }); });
api.delete('/profile/avatar', (_q, res) => { ME.hasAvatar = false; res.status(204).end(); });
api.get('/profile', (_q, res) => res.json(profile));
api.put('/profile', (req, res) => { profile = { ...profile, ...req.body, identity: profile.identity, personal: { ...req.body.personal, officialEmail: profile.personal.officialEmail } }; res.json(profile); });
api.use((_q, res) => res.status(404).json({ error: 'Unknown API endpoint.' }));
app.use('/api', api);

app.use(express.static(dist, { index: false }));
app.use((req, res, next) => (req.method === 'GET' && req.accepts('html') ? res.sendFile(path.join(dist, 'index.html')) : next()));
const port = Number(process.env.PORT) || 4173;
app.listen(port, () => console.log(`mock portal on http://localhost:${port}`));
