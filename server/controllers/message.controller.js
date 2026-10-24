import { Message } from '../models/index.js';
import { notFound, parse } from '../middleware/errors.js';
import { parseId } from '../lib/ids.js';
import { composeBody, messageListQuery, recipientQuery } from '../validators/index.js';
import * as messaging from '../services/messaging.js';

export async function index(req, res) {
  res.json(await messaging.listMessages(req.student.id, parse(messageListQuery, req.query)));
}

export async function recipients(req, res) {
  res.json({ rows: await messaging.findRecipients(req.student.id, parse(recipientQuery, req.query)) });
}

export async function show(req, res) {
  const m = await Message.findOne({ where: { id: parseId(req.params.id, 'Message not found.'), ownerId: req.student.id } });
  if (!m) throw notFound('Message not found.');
  if (m.box === 'inbox' && !m.readAt) await m.update({ readAt: new Date() });
  res.json({ message: messaging.toMessageView(m) });
}

export async function create(req, res) {
  const delivered = await messaging.sendMessage(req.student.id, parse(composeBody, req.body));
  res.status(201).json({ ok: true, delivered });
}

export async function destroy(req, res) {
  const deleted = await Message.destroy({ where: { id: parseId(req.params.id, 'Message not found.'), ownerId: req.student.id } });
  if (!deleted) throw notFound('Message not found.');
  res.status(204).end();
}
