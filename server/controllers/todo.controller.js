import { Todo, literal } from '../models/index.js';
import { notFound, parse } from '../middleware/errors.js';
import { parseId } from '../lib/ids.js';
import { todoBody } from '../validators/index.js';

const view = (t) => ({ id: t.id, task: t.task, dueDate: t.dueDate ?? null, createdOn: t.createdAt.toISOString().slice(0, 10), active: t.active, status: t.status, priority: t.priority });

const own = async (studentId, rawId) => {
  const todo = await Todo.findOne({ where: { id: parseId(rawId, 'That task no longer exists.'), studentId } });
  if (!todo) throw notFound('That task no longer exists.');
  return todo;
};

export async function index(req, res) {
  // open tasks first, soonest due date first, undated last
  const rows = await Todo.findAll({
    where: { studentId: req.student.id },
    order: [[literal("status = 'Completed'"), 'ASC'], [literal('due_date IS NULL'), 'ASC'], ['dueDate', 'ASC'], ['id', 'ASC']],
  });
  res.json({ rows: rows.map(view) });
}

export async function create(req, res) {
  const body = parse(todoBody, req.body);
  res.status(201).json({ todo: view(await Todo.create({ ...body, dueDate: body.dueDate ?? null, studentId: req.student.id })) });
}

export async function update(req, res) {
  const todo = await own(req.student.id, req.params.id);
  const body = parse(todoBody, req.body);
  res.json({ todo: view(await todo.update({ ...body, dueDate: body.dueDate ?? null })) });
}

export async function destroy(req, res) {
  await (await own(req.student.id, req.params.id)).destroy();
  res.status(204).end();
}
