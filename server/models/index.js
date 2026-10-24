/**
 * The "M" of MVC. Models are defined in the sibling files; this module wires the
 * relationships once so controllers/services can `include` them freely.
 */
import { sequelize } from './_base.js';
import * as academic from './academic.js';
import * as student from './student.js';
import * as services from './services.js';

const {
  AcademicSession, Faculty, Course, Program, CurriculumItem, Section, TimetableSlot,
} = academic;
const {
  Student, StudentProfile, Enrollment, AttendanceRecord, PloScore, Assessment, AssessmentMark,
  ExamPaper, SeatAllocation, OnlineExam, LedgerEntry, AdvanceReceipt,
} = student;
const {
  Todo, Message, Workflow, Survey, SurveyResponse, ActivityLog, RegistrationWindow, AuthSession,
} = services;
const { RoadmapVerification } = student;

const cascade = { onDelete: 'CASCADE' };

// catalogue
Program.hasMany(CurriculumItem, { as: 'curriculum', foreignKey: 'programId', ...cascade });
CurriculumItem.belongsTo(Program, { foreignKey: 'programId' });
CurriculumItem.belongsTo(Course, { as: 'course', foreignKey: 'courseId' });
Section.belongsTo(Course, { as: 'course', foreignKey: 'courseId' });
Section.belongsTo(AcademicSession, { as: 'session', foreignKey: 'sessionId' });
Section.belongsTo(Faculty, { as: 'faculty', foreignKey: 'facultyId' });
Section.hasMany(TimetableSlot, { as: 'slots', foreignKey: 'sectionId', ...cascade });
TimetableSlot.belongsTo(Section, { foreignKey: 'sectionId' });

// students & their record
Student.belongsTo(Program, { as: 'program', foreignKey: 'programId' });
Student.hasOne(StudentProfile, { as: 'profile', foreignKey: 'studentId', ...cascade });
StudentProfile.belongsTo(Student, { foreignKey: 'studentId' });
Student.hasMany(Enrollment, { as: 'enrollments', foreignKey: 'studentId', ...cascade });
Enrollment.belongsTo(Student, { as: 'student', foreignKey: 'studentId' });
Enrollment.belongsTo(Section, { as: 'section', foreignKey: 'sectionId' });
Enrollment.belongsTo(Course, { as: 'course', foreignKey: 'courseId' });
Enrollment.belongsTo(AcademicSession, { as: 'session', foreignKey: 'sessionId' });
Enrollment.hasMany(AttendanceRecord, { as: 'attendance', foreignKey: 'enrollmentId', ...cascade });
Enrollment.hasMany(PloScore, { as: 'plo', foreignKey: 'enrollmentId', ...cascade });

// assessments & exams
Section.hasMany(Assessment, { as: 'assessments', foreignKey: 'sectionId', ...cascade });
Assessment.belongsTo(Section, { as: 'section', foreignKey: 'sectionId' });
Assessment.hasMany(AssessmentMark, { as: 'marks', foreignKey: 'assessmentId', ...cascade });
ExamPaper.belongsTo(Section, { as: 'section', foreignKey: 'sectionId' });
ExamPaper.hasMany(SeatAllocation, { as: 'seats', foreignKey: 'paperId', ...cascade });
OnlineExam.belongsTo(Section, { as: 'section', foreignKey: 'sectionId' });

// money
LedgerEntry.belongsTo(AcademicSession, { as: 'session', foreignKey: 'sessionId' });

// everything a student owns is removed with the student (no orphaned rows)
const ownedByStudent = [[LedgerEntry, 'studentId'], [AdvanceReceipt, 'studentId'], [Todo, 'studentId'], [Message, 'ownerId'], [Workflow, 'studentId'],
  [ActivityLog, 'studentId'], [AssessmentMark, 'studentId'], [SeatAllocation, 'studentId'], [SurveyResponse, 'studentId'], [RoadmapVerification, 'studentId']];
for (const [Model, foreignKey] of ownedByStudent) Model.belongsTo(Student, { foreignKey, ...cascade });
SurveyResponse.belongsTo(Survey, { foreignKey: 'surveyId', ...cascade });
AssessmentMark.belongsTo(Assessment, { foreignKey: 'assessmentId', ...cascade });
SeatAllocation.belongsTo(ExamPaper, { foreignKey: 'paperId', ...cascade });

// tools
Workflow.belongsTo(AcademicSession, { as: 'session', foreignKey: 'sessionId' });
Survey.belongsTo(Section, { as: 'section', foreignKey: 'sectionId' });
RegistrationWindow.belongsTo(AcademicSession, { as: 'session', foreignKey: 'sessionId' });
AuthSession.belongsTo(Student, { as: 'student', foreignKey: 'studentId' });

/** Creates any missing tables (idempotent). Use `{ force: true }` only from the seed script. */
export const syncModels = (options = {}) => sequelize.sync(options);

export { sequelize };
export * from './academic.js';
export * from './student.js';
export * from './services.js';
export { Op, fn, col, where, literal } from 'sequelize';
