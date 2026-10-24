/** Credential checks and password changes. (Session/token lifecycle lives in services/session.js.) */
import { config } from '../config.js';
import { Student } from '../models/index.js';
import { HttpError, unauthorized } from '../middleware/errors.js';
import { hashPassword, needsRehash, verifyPassword } from '../lib/crypto.js';
import { log } from './activity.js';
import { revokeOtherSessions } from './session.js';

export { hashPassword };

// A real hash so unknown registration numbers cost the same time as wrong passwords (computed once, on first use).
let dummyHash;
const dummy = () => (dummyHash ??= hashPassword('not-a-real-password'));

/** Verifies credentials and enforces lockout. Returns the student; the caller opens the session. */
export async function authenticate({ regNo, password }, { ip }) {
  const student = await Student.scope('withPassword').findOne({ where: { regNo: regNo.trim() } });

  if (student?.lockedUntil && student.lockedUntil > new Date()) {
    throw new HttpError(423, 'This account is temporarily locked after repeated failed sign-ins. Try again in a few minutes.');
  }
  const ok = (await verifyPassword(password, student?.passwordHash ?? await dummy())) && !!student;
  if (!ok) {
    if (student) await recordFailure(student);
    throw unauthorized('Registration number or password is incorrect.');
  }

  const upgrade = needsRehash(student.passwordHash) ? { passwordHash: await hashPassword(password) } : {};
  await student.update({ failedLogins: 0, lockedUntil: null, ...upgrade });
  await log(student.id, 'Login Details', 'Student Logged In', ip);
  return student;
}

async function recordFailure(student) {
  const failed = student.failedLogins + 1;
  const lock = failed >= config.maxFailedLogins;
  await student.update({ failedLogins: lock ? 0 : failed, lockedUntil: lock ? new Date(Date.now() + config.lockMinutes * 60_000) : null });
}

export async function changePassword(studentId, { currentPassword, newPassword }, { keepSessionId, ip }) {
  const student = await Student.scope('withPassword').findByPk(studentId);
  if (!(await verifyPassword(currentPassword, student.passwordHash))) {
    throw new HttpError(422, 'Please correct the highlighted fields.', { currentPassword: 'Current password is incorrect.' });
  }
  await student.update({ passwordHash: await hashPassword(newPassword) });
  await revokeOtherSessions(studentId, keepSessionId);                  // sign out every other device
  await log(studentId, 'Security', 'Password changed', ip);
}
