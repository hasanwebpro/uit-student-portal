import { define, T, dateOnly, fk, stamp } from './_base.js';

const id = { type: T.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true };

// ── Student tools ──────────────────────────────────────────
export const Todo = define('Todo', {
  id,
  studentId: fk(),
  task: { type: T.STRING(200), allowNull: false },
  dueDate: dateOnly(),
  active: { type: T.BOOLEAN, allowNull: false, defaultValue: true },
  status: { type: T.ENUM('Not Started', 'In Progress', 'Completed'), allowNull: false, defaultValue: 'Not Started' },
  priority: { type: T.ENUM('Low', 'Medium', 'High'), allowNull: false, defaultValue: 'Medium' },
  ...stamp(),
}, { tableName: 'todos', indexes: [{ fields: ['student_id'] }] });

export const Message = define('Message', {
  id,
  ownerId: fk(),                                                        // whose mailbox this copy lives in
  box: { type: T.ENUM('inbox', 'sent'), allowNull: false },
  partyName: { type: T.STRING(255), allowNull: false },                 // sender (inbox) or recipients (sent)
  partyRole: { type: T.STRING(40), allowNull: false },
  subject: { type: T.STRING(120), allowNull: false },
  body: { type: T.TEXT, allowNull: false },
  commType: { type: T.STRING(30), allowNull: false, defaultValue: 'Announcement' },
  priority: { type: T.ENUM('Low', 'Medium', 'High'), allowNull: false, defaultValue: 'Low' },
  category: { type: T.STRING(40), allowNull: false, defaultValue: 'Information' },
  dueDate: dateOnly(),                                                  // follow-up / reminder date
  followUp: { type: T.BOOLEAN, allowNull: false, defaultValue: false },
  reminder: { type: T.BOOLEAN, allowNull: false, defaultValue: false },
  readAt: T.DATE,
  ...stamp(),
}, { tableName: 'messages', indexes: [{ fields: ['owner_id', 'box', 'created_at'] }] });

export const WORKFLOW_KINDS = ['Course Withdrawal', 'Semester Freeze', 'Transcript Request', 'Section Change', 'Other'];
export const Workflow = define('Workflow', {
  id,
  studentId: fk(),
  sessionId: fk(true),
  kind: { type: T.ENUM(...WORKFLOW_KINDS), allowNull: false },
  dueDate: dateOnly(),
  description: { type: T.STRING(1000), allowNull: false },
  status: { type: T.ENUM('Draft', 'Submitted', 'Approved', 'Rejected'), allowNull: false, defaultValue: 'Draft' },
  finalSubmitted: { type: T.BOOLEAN, allowNull: false, defaultValue: false },
  ...stamp(),
}, { tableName: 'workflows', indexes: [{ fields: ['student_id'] }] });

export const Announcement = define('Announcement', {
  id,
  title: { type: T.STRING(200), allowNull: false },
  body: { type: T.TEXT, allowNull: false },                             // plain text; paragraphs split on blank lines
  postedOn: dateOnly(false),
  author: { type: T.STRING(80), allowNull: false },
}, { tableName: 'announcements' });

export const Survey = define('Survey', {
  id,
  kind: { type: T.ENUM('Feedback', 'Survey'), allowNull: false },
  title: { type: T.STRING(200), allowNull: false },
  sectionId: fk(true),                                                  // NULL ⇒ for every student
  opensOn: dateOnly(false),
  closesOn: dateOnly(false),
}, { tableName: 'surveys' });

export const SurveyResponse = define('SurveyResponse', {
  surveyId: { ...fk(), primaryKey: true },
  studentId: { ...fk(), primaryKey: true },
  rating: { type: T.TINYINT.UNSIGNED, allowNull: false, validate: { min: 1, max: 5 } },
  comment: T.STRING(1000),
  ...stamp('submittedAt'),
}, { tableName: 'survey_responses' });

export const ActivityLog = define('ActivityLog', {
  id,
  studentId: fk(),
  action: { type: T.STRING(40), allowNull: false },                     // "Login Details"
  detail: { type: T.STRING(200), allowNull: false },                    // "Student Logged In"
  ip: T.STRING(64),
  ...stamp(),
}, { tableName: 'activity_log', indexes: [{ fields: ['student_id', 'created_at'] }] });

export const RegistrationWindow = define('RegistrationWindow', {
  id,
  sessionId: fk(),
  programId: fk(),
  semesterNo: { type: T.TINYINT.UNSIGNED, allowNull: false },
  minCredits: { type: T.TINYINT.UNSIGNED, allowNull: false },
  maxCredits: { type: T.TINYINT.UNSIGNED, allowNull: false },
  opensOn: dateOnly(false),
  closesOn: dateOnly(false),
}, { tableName: 'registration_windows', indexes: [{ unique: true, fields: ['session_id', 'program_id'] }] });

// ── Auth ───────────────────────────────────────────────────
/**
 * One row per sign-in ("session family"). The browser holds an opaque refresh token; only its SHA-256 is stored.
 * Every refresh rotates the token and remembers the previous hash, so a stolen-and-replayed token is detected.
 */
export const AuthSession = define('AuthSession', {
  id: { type: T.UUID, defaultValue: T.UUIDV4, primaryKey: true },
  studentId: fk(),
  refreshHash: { type: T.CHAR(64), allowNull: false, unique: true },
  prevRefreshHash: { type: T.CHAR(64), allowNull: true },
  rotatedAt: { type: T.DATE, allowNull: true },
  expiresAt: { type: T.DATE, allowNull: false },                       // absolute end of the session
  revokedAt: { type: T.DATE, allowNull: true },
  ip: T.STRING(64),
  userAgent: T.STRING(200),
  ...stamp(),
}, { tableName: 'auth_sessions', indexes: [{ fields: ['student_id'] }, { fields: ['expires_at'] }, { fields: ['prev_refresh_hash'] }] });
