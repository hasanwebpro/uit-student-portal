import { define, T, dateOnly, fk } from './_base.js';

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const AcademicSession = define('AcademicSession', {
  id: { type: T.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: T.STRING(40), allowNull: false, unique: true },          // "Fall 2026"
  startDate: dateOnly(false),
  endDate: dateOnly(false),
  isCurrent: { type: T.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'academic_sessions' });

export const Faculty = define('Faculty', {
  id: { type: T.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  code: { type: T.STRING(16), allowNull: false, unique: true },
  name: { type: T.STRING(80), allowNull: false },
  email: T.STRING(120),
}, { tableName: 'faculty' });

/** Administrative staff students can write to (Registrar, Accounts, Exam cell…). */
export const Staff = define('Staff', {
  id: { type: T.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  code: { type: T.STRING(16), allowNull: false, unique: true },
  name: { type: T.STRING(80), allowNull: false },
  role: { type: T.STRING(80), allowNull: false },
}, { tableName: 'staff' });

export const Course = define('Course', {
  id: { type: T.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  code: { type: T.STRING(24), allowNull: false, unique: true },          // "CSE-301 (P)" kept verbatim, as on the portal
  title: { type: T.STRING(120), allowNull: false },
  creditHrs: { type: T.TINYINT.UNSIGNED, allowNull: false, validate: { min: 0, max: 6 } },
  kind: { type: T.ENUM('TH', 'LAB'), allowNull: false },
  category: { type: T.STRING(40), allowNull: false },                    // Comp Sc.Core, Humanities…
  prereqCode: T.STRING(24),
}, { tableName: 'courses' });

export const Program = define('Program', {
  id: { type: T.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  code: { type: T.STRING(16), allowNull: false, unique: true },
  name: { type: T.STRING(120), allowNull: false },
  degreeYears: { type: T.TINYINT.UNSIGNED, allowNull: false },
}, { tableName: 'programs' });

/** Degree plan: which course belongs to which semester of which program. */
export const CurriculumItem = define('CurriculumItem', {
  programId: { ...fk(), primaryKey: true },
  courseId: { ...fk(), primaryKey: true },
  semesterNo: { type: T.TINYINT.UNSIGNED, allowNull: false, validate: { min: 1, max: 8 } },
  requirement: { type: T.STRING(16), allowNull: false, defaultValue: 'Core' },   // Core | Elective
}, { tableName: 'curriculum' });

export const Section = define('Section', {
  id: { type: T.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  courseId: fk(),
  sessionId: fk(),
  facultyId: fk(true),                                                   // NULL ⇒ "To be Confirmed"
  code: { type: T.STRING(80), allowNull: false, unique: true },          // "Fall 2026-23FA-BS SE-CSC-320-A-8767"
  scheduled: { type: T.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },   // planned contact sessions
}, { tableName: 'sections', indexes: [{ fields: ['session_id'] }] });

export const TimetableSlot = define('TimetableSlot', {
  id: { type: T.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  sectionId: fk(),
  day: { type: T.ENUM(...DAYS), allowNull: false },
  startTime: { type: T.STRING(5), allowNull: false },
  endTime: { type: T.STRING(5), allowNull: false },
  room: { type: T.STRING(60), allowNull: false },
}, { tableName: 'timetable_slots', indexes: [{ fields: ['section_id'] }] });
