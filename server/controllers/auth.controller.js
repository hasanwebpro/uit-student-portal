import { config } from '../config.js';
import { Program, Student, StudentProfile } from '../models/index.js';
import { parse } from '../middleware/errors.js';
import { clearAuthCookies, setAuthCookies } from '../middleware/auth.js';
import { loginBody, passwordBody } from '../validators/index.js';
import * as auth from '../services/auth.js';
import * as sessions from '../services/session.js';
import { appCache, studentKey } from '../lib/cache.js';
import { currentSession } from '../services/academics.js';

const loadPublicStudent = async (id) => {
  const s = await Student.findByPk(id, { include: [{ model: Program, as: 'program', attributes: ['name', 'code'] }] });
  return {
    id: s.id, regNo: s.regNo, fullName: s.fullName, enrollmentNo: s.enrollmentNo, section: s.sectionLabel, status: s.status,
    program: s.program.name, programCode: s.program.code, session: (await currentSession())?.name ?? null,
    hasAvatar: !!(await StudentProfile.findByPk(id, { attributes: ['avatarType'] }))?.avatarType,
  };
};

/** Cached 30 s per student; any write by that student drops it (middleware/cache.js). */
const publicStudent = (id) => appCache.wrap(studentKey(id, 'public'), 30_000, () => loadPublicStudent(id));

export async function login(req, res) {
  const credentials = parse(loginBody, req.body);
  const student = await auth.authenticate(credentials, { ip: req.ip });
  const tokens = await sessions.openSession(student, { remember: credentials.remember, ip: req.ip, userAgent: req.get('user-agent') });
  setAuthCookies(res, tokens);
  res.json({ student: await publicStudent(student.id) });
}

export async function logout(req, res) {
  const refresh = req.cookies?.[config.refreshCookie];
  if (req.sessionId) await sessions.revokeSession(req.sessionId);
  else if (refresh) await sessions.revokeByRefreshToken(refresh);
  clearAuthCookies(res);
  res.status(204).end();
}

/** Trades the refresh cookie for a new access token (and a rotated refresh token). 401 + cleared cookies when it is not valid. */
export async function refresh(req, res) {
  try {
    const result = await sessions.refreshSession(req.cookies?.[config.refreshCookie], { ip: req.ip });
    setAuthCookies(res, result);
    res.json({ student: await publicStudent(result.student.id) });
  } catch (err) {
    clearAuthCookies(res);
    throw err;
  }
}

/**
 * The page-load session probe. Anonymous visitors get `{ student: null }` (200, not a console error); a visitor whose
 * access token expired but whose refresh token is still good is quietly renewed here.
 */
export async function me(req, res) {
  if (req.student) return res.json({ student: await publicStudent(req.student.id) });
  const raw = req.cookies?.[config.refreshCookie];
  if (raw) {
    try {
      const result = await sessions.refreshSession(raw, { ip: req.ip });
      setAuthCookies(res, result);
      return res.json({ student: await publicStudent(result.student.id) });
    } catch (err) {
      if (err.status !== 401) throw err;
      clearAuthCookies(res);
    }
  }
  res.json({ student: null });
}

export async function changePassword(req, res) {
  const body = parse(passwordBody, req.body);
  await auth.changePassword(req.student.id, body, { keepSessionId: req.sessionId, ip: req.ip });
  res.json({ ok: true });
}
