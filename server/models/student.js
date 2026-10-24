import { define, T, dateOnly, money, fk } from './_base.js';

const id = { type: T.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true };

export const Student = define('Student', {
  id,
  regNo: { type: T.STRING(24), allowNull: false, unique: true },        // "23FA-001-SE" (MySQL's default collation is case-insensitive)
  enrollmentNo: { type: T.STRING(40), allowNull: false, unique: true },
  passwordHash: { type: T.STRING(100), allowNull: false },
  fullName: { type: T.STRING(100), allowNull: false },
  programId: fk(),
  sectionLabel: { type: T.STRING(4), allowNull: false, defaultValue: 'A' },
  status: { type: T.STRING(20), allowNull: false, defaultValue: 'Active' },
  dob: dateOnly(),
  nic: T.STRING(20),
  gender: T.STRING(10),
  failedLogins: { type: T.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
  lockedUntil: T.DATE,
}, {
  tableName: 'students',
  defaultScope: { attributes: { exclude: ['passwordHash'] } },         // never leaks the hash by accident
  scopes: { withPassword: {} },                                      // replaces the default scope, so the hash is selected exactly once
});

/** One-to-one extension holding the editable "My Profile" groups. */
export const StudentProfile = define('StudentProfile', {
  studentId: { ...fk(), primaryKey: true },
  taxPayeeName: T.STRING(80), taxPayeeNic: T.STRING(20), selfPayee: { type: T.BOOLEAN, defaultValue: false }, ntnNumber: T.STRING(20), isFiler: { type: T.BOOLEAN, defaultValue: false },
  guardianRelation: T.STRING(20), guardianName: T.STRING(80), guardianOccupation: T.STRING(80), guardianCell: T.STRING(24), guardianCnic: T.STRING(20), guardianEmail: T.STRING(120),
  permanentAddress: T.STRING(200), presentAddress: T.STRING(200),
  cell: T.STRING(24), personalEmail: T.STRING(120), officialEmail: T.STRING(120), cnic: T.STRING(20),
  avatar: T.BLOB('medium'), avatarType: T.STRING(20),                       // optional profile picture (small JPEG/PNG)
}, { tableName: 'student_profiles', timestamps: true, createdAt: false, updatedAt: 'updatedAt' });

export const ENROLLMENT_STATUS = ['IN_PROG', 'PASS', 'SUB_PASS', 'FAIL', 'WITHDRAWN', 'PENDING'];

export const Enrollment = define('Enrollment', {
  id,
  studentId: fk(),
  sectionId: fk(),
  courseId: fk(),                                                      // denormalised for fast per-course queries
  sessionId: fk(),                                                     // denormalised for fast per-term queries
  status: { type: T.ENUM(...ENROLLMENT_STATUS), allowNull: false, defaultValue: 'IN_PROG' },
  grade: T.STRING(3),
  gradePts: T.DECIMAL(3, 2),
}, {
  tableName: 'enrollments',
  indexes: [{ unique: true, fields: ['student_id', 'section_id'] }, { fields: ['student_id', 'session_id'] }],
});

export const AttendanceRecord = define('AttendanceRecord', {
  id,
  enrollmentId: fk(),
  heldOn: dateOnly(false),
  topic: { type: T.STRING(80), allowNull: false, defaultValue: '' },
  present: { type: T.BOOLEAN, allowNull: false },
}, { tableName: 'attendance_records', indexes: [{ unique: true, fields: ['enrollment_id', 'held_on', 'topic'] }] });

/** Student-outcome attainment, shown on the portal as "percent (weight)". */
export const PloScore = define('PloScore', {
  enrollmentId: { ...fk(), primaryKey: true },
  soNo: { type: T.TINYINT.UNSIGNED, primaryKey: true, validate: { min: 1, max: 12 } },
  percent: { type: T.DECIMAL(5, 2), allowNull: false },
  weight: { type: T.DECIMAL(4, 2), allowNull: false },
}, { tableName: 'plo_scores' });

export const Assessment = define('Assessment', {
  id,
  sectionId: fk(),
  kind: { type: T.STRING(30), allowNull: false },                      // Quiz / Assignment / Mid Term…
  name: { type: T.STRING(60), allowNull: false },
  total: { type: T.DECIMAL(6, 2), allowNull: false },
  passing: { type: T.DECIMAL(6, 2), allowNull: false },
}, { tableName: 'assessments', indexes: [{ fields: ['section_id'] }] });

export const AssessmentMark = define('AssessmentMark', {
  assessmentId: { ...fk(), primaryKey: true },
  studentId: { ...fk(), primaryKey: true },
  obtained: { type: T.DECIMAL(6, 2), allowNull: false },
}, { tableName: 'assessment_marks' });

export const ExamPaper = define('ExamPaper', {
  id,
  sectionId: fk(),
  kind: { type: T.ENUM('MID', 'FINAL', 'LAB'), allowNull: false },
  examDate: dateOnly(false),
  startTime: { type: T.STRING(5), allowNull: false },
  endTime: { type: T.STRING(5), allowNull: false },
  room: { type: T.STRING(60), allowNull: false },
}, { tableName: 'exam_papers' });

export const SeatAllocation = define('SeatAllocation', {
  paperId: { ...fk(), primaryKey: true },
  studentId: { ...fk(), primaryKey: true },
  seatNo: { type: T.STRING(12), allowNull: false },
}, { tableName: 'seat_allocations' });

export const OnlineExam = define('OnlineExam', {
  id,
  sectionId: fk(),
  title: { type: T.STRING(120), allowNull: false },
  opensAt: { type: T.DATE, allowNull: false },
  closesAt: { type: T.DATE, allowNull: false },
  durationMin: { type: T.SMALLINT.UNSIGNED, allowNull: false },
}, { tableName: 'online_exams' });

/** A student's confirmation that the degree road map shown to them is correct ("Verify" + comments). */
export const RoadmapVerification = define('RoadmapVerification', {
  studentId: { ...fk(), primaryKey: true },
  verified: { type: T.BOOLEAN, allowNull: false, defaultValue: false },
  comments: T.STRING(500),
}, { tableName: 'roadmap_verifications', timestamps: true, createdAt: false, updatedAt: 'updatedAt' });

// ── Finance ────────────────────────────────────────────────
export const LedgerEntry = define('LedgerEntry', {
  id,
  studentId: fk(),
  sessionId: fk(true),
  postedOn: dateOnly(false),
  description: { type: T.STRING(200), allowNull: false },
  feeNature: { type: T.STRING(60), allowNull: false },
  debit: money(),                                                      // charged to the student
  credit: money(),                                                     // paid / waived
}, { tableName: 'ledger_entries', indexes: [{ fields: ['student_id', 'posted_on', 'id'] }] });

export const AdvanceReceipt = define('AdvanceReceipt', {
  id,
  studentId: fk(),
  receiptNo: { type: T.STRING(40), allowNull: false, unique: true },
  receivedOn: dateOnly(false),
  amount: { ...money(), validate: { min: 1 } },
}, { tableName: 'advance_receipts', indexes: [{ fields: ['student_id'] }] });
