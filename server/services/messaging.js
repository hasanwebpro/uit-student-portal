import { forgetStudent } from '../lib/cache.js';
import { Enrollment, Faculty, Message, Op, Staff, Student, Todo, sequelize } from '../models/index.js';
import { notFound } from '../middleware/errors.js';

/** Escapes LIKE wildcards so user input is matched literally. */
const like = (q) => `%${(q ?? '').replace(/[\\%_]/g, '\\$&')}%`;

export const toMessageView = (m) => ({
  id: m.id, box: m.box, party: m.partyName, role: m.partyRole, subject: m.subject, body: m.body,
  createdAt: m.createdAt, read: m.box === 'sent' || !!m.readAt,
  commType: m.commType, priority: m.priority, category: m.category, dueDate: m.dueDate ?? null, followUp: m.followUp, reminder: m.reminder,
});

export async function listMessages(studentId, { box, from, to, q }) {
  const where = { ownerId: studentId, box };
  if (from || to) where.createdAt = { ...(from && { [Op.gte]: new Date(`${from}T00:00:00Z`) }), ...(to && { [Op.lte]: new Date(`${to}T23:59:59Z`) }) };
  if (q) where[Op.or] = ['subject', 'body', 'partyName'].map((f) => ({ [f]: { [Op.like]: like(q) } }));
  const [rows, unread] = await Promise.all([
    Message.findAll({ where, order: [['createdAt', 'DESC'], ['id', 'DESC']] }),
    Message.count({ where: { ownerId: studentId, box: 'inbox', readAt: null } }),
  ]);
  return { rows: rows.map(toMessageView), unread };
}

export async function findRecipients(studentId, { type, q, course }) {
  const m = { [Op.like]: like(q) };
  if (type === 'faculty') return (await Faculty.findAll({ where: { [Op.or]: [{ name: m }, { code: m }] }, order: ['name'] })).map((f) => ({ id: f.id, name: f.name, detail: f.code }));
  if (type === 'admin') return (await Staff.findAll({ where: { [Op.or]: [{ name: m }, { role: m }] }, order: ['name'] })).map((s) => ({ id: s.id, name: s.name, detail: s.role }));
  const where = { id: { [Op.ne]: studentId }, [Op.or]: [{ fullName: m }, { regNo: m }] };
  if (course) {                                              // classmates: students enrolled in the same section as my enrolment
    const mine = await Enrollment.findOne({ where: { id: course, studentId }, attributes: ['sectionId'], raw: true });
    if (!mine) return [];
    const mates = await Enrollment.findAll({ where: { sectionId: mine.sectionId }, attributes: ['studentId'], raw: true });
    where.id = { [Op.and]: [{ [Op.ne]: studentId }, { [Op.in]: mates.map((e) => e.studentId) }] };
  }
  return (await Student.findAll({ where, order: ['fullName'], limit: 200 })).map((s) => ({ id: s.id, name: s.fullName, detail: s.regNo }));
}

const LOOKUP = { faculty: [Faculty, 'name'], admin: [Staff, 'name'], student: [Student, 'fullName'] };

/** Writes the sender's "sent" copy and, for student recipients, a real inbox message. */
export async function sendMessage(studentId, { recipients, subject, body, commType, priority, category, dueDate, followUp, reminder }) {
  const meta = { commType, priority, category, dueDate: dueDate ?? null, followUp, reminder };
  const sender = await Student.findByPk(studentId, { attributes: ['fullName'] });
  const names = [];
  const inboxCopies = [];
  for (const r of recipients) {
    const [Model, nameField] = LOOKUP[r.type];
    const who = await Model.findByPk(r.id);
    if (!who || (r.type === 'student' && who.id === studentId)) throw notFound('One of the recipients does not exist.');
    names.push(who[nameField]);
    if (r.type === 'student') inboxCopies.push({ ownerId: who.id, box: 'inbox', partyName: sender.fullName, partyRole: 'Student', subject, body, ...meta });
  }
  const roles = [...new Set(recipients.map((r) => r.type[0].toUpperCase() + r.type.slice(1)))].join('/');
  await sequelize.transaction(async (transaction) => {
    await Message.bulkCreate([...inboxCopies, { ownerId: studentId, box: 'sent', partyName: names.join(', ').slice(0, 255), partyRole: roles, subject, body, ...meta }], { transaction });
    // "Follow Up Task" puts a to-do on my list for the chosen date
    if (followUp) await Todo.create({ studentId, task: `Follow up: ${subject}`.slice(0, 200), dueDate: dueDate ?? null, priority, status: 'Not Started' }, { transaction });
  });
  for (const copy of inboxCopies) forgetStudent(copy.ownerId);          // recipients' dashboards show an unread count
  return names.length;
}
