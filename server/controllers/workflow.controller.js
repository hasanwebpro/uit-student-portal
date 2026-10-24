import { AcademicSession, Workflow } from '../models/index.js';
import { conflict, notFound, parse } from '../middleware/errors.js';
import { parseId } from '../lib/ids.js';
import { workflowBody } from '../validators/index.js';
import { currentSession } from '../services/academics.js';
import { log } from '../services/activity.js';

const withSession = [{ model: AcademicSession, as: 'session', attributes: ['name'] }];

const view = (w) => ({
  id: w.id, session: w.session?.name ?? null, kind: w.kind, dueDate: w.dueDate ?? null, description: w.description,
  status: w.status, finalSubmitted: w.finalSubmitted, createdAt: w.createdAt,
});

const own = async (studentId, rawId) => {
  const w = await Workflow.findOne({ where: { id: parseId(rawId, 'Request not found.'), studentId }, include: withSession });
  if (!w) throw notFound('Request not found.');
  return w;
};
/** A request is frozen once finally submitted — the portal's "Delete and Edit will not be available" rule. */
const mustBeEditable = (w) => { if (w.finalSubmitted) throw conflict('This request was finally submitted and can no longer be changed.'); return w; };

export async function index(req, res) {
  const rows = await Workflow.findAll({ where: { studentId: req.student.id }, order: [['id', 'DESC']], include: withSession });
  res.json({ rows: rows.map(view) });
}

export async function create(req, res) {
  const body = parse(workflowBody, req.body);
  const created = await Workflow.create({ ...body, dueDate: body.dueDate ?? null, studentId: req.student.id, sessionId: (await currentSession()).id });
  res.status(201).json({ workflow: view(await own(req.student.id, String(created.id))) });
}

export async function update(req, res) {
  const w = mustBeEditable(await own(req.student.id, req.params.id));
  const body = parse(workflowBody, req.body);
  await w.update({ ...body, dueDate: body.dueDate ?? null });
  res.json({ workflow: view(w) });
}

export async function destroy(req, res) {
  await mustBeEditable(await own(req.student.id, req.params.id)).destroy();
  res.status(204).end();
}

export async function submit(req, res) {
  const w = mustBeEditable(await own(req.student.id, req.params.id));
  await w.update({ status: 'Submitted', finalSubmitted: true });
  await log(req.student.id, 'Work Flow', `Request ${w.kind} submitted`, req.ip);
  res.json({ workflow: view(w) });
}
