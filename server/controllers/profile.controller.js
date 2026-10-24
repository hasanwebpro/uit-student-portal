import { Program, Student, StudentProfile } from '../models/index.js';
import { HttpError, notFound } from '../middleware/errors.js';
import { parse } from '../middleware/errors.js';
import { profileBody } from '../validators/index.js';
import { log } from '../services/activity.js';

const view = (s) => {
  const p = s.profile ?? {};
  return {
    identity: { fullName: s.fullName, regNo: s.regNo, dob: s.dob, nic: s.nic, gender: s.gender, program: s.program.name, hasAvatar: !!p.avatarType },
    tax: { payeeName: p.taxPayeeName ?? '', payeeNic: p.taxPayeeNic ?? '', selfPayee: !!p.selfPayee, ntn: p.ntnNumber ?? '', isFiler: !!p.isFiler },
    guardian: { relation: p.guardianRelation ?? 'Father', name: p.guardianName ?? '', occupation: p.guardianOccupation ?? '', cell: p.guardianCell ?? '', cnic: p.guardianCnic ?? '', email: p.guardianEmail ?? '' },
    address: { permanent: p.permanentAddress ?? '', present: p.presentAddress ?? '' },
    personal: { cell: p.cell ?? '', personalEmail: p.personalEmail ?? '', officialEmail: p.officialEmail ?? '', cnic: p.cnic ?? '' },
  };
};
// the picture itself is never loaded with the profile (it is served by GET /profile/avatar)
const load = (id) => Student.findByPk(id, { include: [{ model: Program, as: 'program', attributes: ['name'] }, { model: StudentProfile, as: 'profile', attributes: { exclude: ['avatar'] } }] });

export async function show(req, res) {
  res.json(view(await load(req.student.id)));
}

/**
 * Name, DOB, NIC, gender and the official e-mail are institution-controlled, so they are never
 * read from the request — only the editable groups are written.
 */
export async function update(req, res) {
  const b = parse(profileBody, req.body);
  await StudentProfile.upsert({
    studentId: req.student.id,
    taxPayeeName: b.tax.payeeName, taxPayeeNic: b.tax.payeeNic, selfPayee: b.tax.selfPayee, ntnNumber: b.tax.ntn, isFiler: b.tax.isFiler,
    guardianRelation: b.guardian.relation, guardianName: b.guardian.name, guardianOccupation: b.guardian.occupation, guardianCell: b.guardian.cell, guardianCnic: b.guardian.cnic, guardianEmail: b.guardian.email,
    permanentAddress: b.address.permanent, presentAddress: b.address.present,
    cell: b.personal.cell, personalEmail: b.personal.personalEmail, cnic: b.personal.cnic,
  });
  await log(req.student.id, 'Profile', 'Profile updated', req.ip);
  res.json(view(await load(req.student.id)));
}

// ── Profile picture ─────────────────────────────────────────
const SIGNATURES = { 'image/jpeg': [0xff, 0xd8, 0xff], 'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] };

/** Trusts the file's bytes, not the Content-Type header: a renamed .exe must not become an "image". */
export const isImage = (buffer, type) => !!SIGNATURES[type] && buffer.length > SIGNATURES[type].length && SIGNATURES[type].every((b, i) => buffer[i] === b);

export async function saveAvatar(req, res) {
  const type = req.get('content-type')?.split(';')[0];
  if (!Buffer.isBuffer(req.body) || !req.body.length) throw new HttpError(415, 'Upload a JPEG or PNG image.');
  if (!isImage(req.body, type)) throw new HttpError(415, 'That file is not a valid JPEG or PNG image.');
  await StudentProfile.upsert({ studentId: req.student.id, avatar: req.body, avatarType: type });
  await log(req.student.id, 'Profile', 'Profile picture updated', req.ip);
  res.json({ ok: true });
}

export async function avatar(req, res) {
  const p = await StudentProfile.findByPk(req.student.id, { attributes: ['avatar', 'avatarType'] });
  if (!p?.avatar) throw notFound('No profile picture.');
  res.set({ 'Content-Type': p.avatarType, 'Cache-Control': 'private, no-cache', 'X-Content-Type-Options': 'nosniff' }).send(p.avatar);
}

export async function removeAvatar(req, res) {
  await StudentProfile.update({ avatar: null, avatarType: null }, { where: { studentId: req.student.id } });
  res.status(204).end();
}
