import { AcademicSession, LedgerEntry } from '../models/index.js';

/**
 * Ledger with a running balance (debit − credit). Balance is always computed over the
 * whole history, then the date filter is applied, so a filtered view never shows a wrong balance.
 */
export async function ledgerWithBalance(studentId, { from, to } = {}) {
  const rows = await LedgerEntry.findAll({
    where: { studentId }, order: [['postedOn', 'ASC'], ['id', 'ASC']],
    include: [{ model: AcademicSession, as: 'session', attributes: ['name'] }],
  });
  let balance = 0;
  const all = rows.map((r) => ({
    id: r.id, postedOn: r.postedOn, description: r.description, feeNature: r.feeNature,
    debit: Number(r.debit), credit: Number(r.credit), session: r.session?.name ?? null,
    balance: (balance += Number(r.debit) - Number(r.credit)),
  }));
  const entries = all.filter((r) => (!from || r.postedOn >= from) && (!to || r.postedOn <= to));
  return {
    entries,
    totals: { charged: entries.reduce((a, r) => a + r.debit, 0), paid: entries.reduce((a, r) => a + r.credit, 0) },
    balance: all.at(-1)?.balance ?? 0,
  };
}
