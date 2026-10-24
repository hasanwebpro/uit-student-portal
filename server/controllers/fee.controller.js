import { AdvanceReceipt, Program, Student } from '../models/index.js';
import { notFound, parse } from '../middleware/errors.js';
import { parseId } from '../lib/ids.js';
import { dateRangeQuery } from '../validators/index.js';
import { ledgerWithBalance } from '../services/fees.js';

const receiptNo = (stored) => stored.split('-')[0];       // stored as "<no>-<regNo>" to stay unique across students

export async function ledger(req, res) {
  const range = parse(dateRangeQuery, req.query);
  const me = await Student.findByPk(req.student.id, { include: [{ model: Program, as: 'program', attributes: ['name'] }] });
  res.json({ student: { name: me.fullName, regNo: me.regNo, program: me.program.name }, reportDate: new Date().toISOString(), ...(await ledgerWithBalance(req.student.id, range)) });
}

export async function advanceIndex(req, res) {
  const rows = await AdvanceReceipt.findAll({ where: { studentId: req.student.id }, order: [['receivedOn', 'DESC']] });
  res.json({ rows: rows.map((r) => ({ id: r.id, receiptNo: receiptNo(r.receiptNo), receivedOn: r.receivedOn, amount: Number(r.amount) })) });
}

export async function advanceShow(req, res) {
  const r = await AdvanceReceipt.findOne({ where: { id: parseId(req.params.id, 'Receipt not found.'), studentId: req.student.id } });
  if (!r) throw notFound('Receipt not found.');
  const me = await Student.findByPk(req.student.id);
  res.json({ receipt: { id: r.id, receiptNo: receiptNo(r.receiptNo), receivedOn: r.receivedOn, amount: Number(r.amount), name: me.fullName, regNo: me.regNo, mode: 'Pay Order', bank: 'HBL' } });
}
