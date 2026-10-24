import { useState } from 'react';
import { useQuery } from '../../controllers/useQuery.js';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { FeeModel } from '../../models/portal.js';
import { formatDashDate, formatDate, formatMoney } from '../../models/format.js';
import { Async } from '../ui/Async.jsx';
import { DataTable } from '../ui/DataTable.jsx';
import { Dialog } from '../ui/Dialog.jsx';
import { Icon } from '../ui/Icon.jsx';
import { Button, Card, PageHeader } from '../ui/primitives.jsx';

function Receipt({ id, onClose }) {
  const query = useQuery(`receipt:${id}`, FeeModel.receipt(id));
  return (
    <Dialog open onClose={onClose} title="Advance fee receipt" footer={<><Button variant="secondary" icon="print" onClick={() => window.print()}>Print</Button><Button onClick={onClose}>Close</Button></>}>
      <Async query={query}>
        {({ receipt: r }) => (
          <dl className="kv">
            <dt>Receipt no</dt><dd>{r.receiptNo}</dd><dt>Date</dt><dd>{formatDate(r.receivedOn)}</dd><dt>Amount</dt><dd><strong>{formatMoney(r.amount)}</strong></dd>
            <dt>Student</dt><dd>{r.name} ({r.regNo})</dd><dt>Mode</dt><dd>{r.mode} · {r.bank}</dd>
          </dl>
        )}
      </Async>
    </Dialog>
  );
}

export default function AdvanceFee() {
  usePageTitle('Advance fee');
  const query = useQuery('advance', FeeModel.advance);
  const [open, setOpen] = useState(null);
  const iconBtn = (name, label, onClick) => <button type="button" className="btn-icon btn-icon--plain" onClick={onClick} title={label}><Icon name={name} /><span className="visually-hidden">{label}</span></button>;
  return (
    <>
      <PageHeader title="Student Advance Fee" crumbs={['Fee', 'Student Advance Fee']} />
      <Async query={query}>
        {({ rows }) => (
          <Card>
            <DataTable caption="Advance fee receipts" hideCaption rowKey={(r) => r.id} cardTitle={(r) => `Receipt ${r.receiptNo}`} columns={[
              { key: 'receiptNo', header: 'Receipt Number', rowHeader: true },
              { key: 'receivedOn', header: 'Date', render: (r) => formatDashDate(r.receivedOn) },
              { key: 'amount', header: 'Advance Amount', render: (r) => Number(r.amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) },
              { key: 'view', header: 'View', render: (r) => iconBtn('eye', `View receipt ${r.receiptNo}`, () => setOpen(r.id)) },
              { key: 'print', header: 'Print', render: (r) => iconBtn('print', `Print receipt ${r.receiptNo}`, () => setOpen(r.id)) },
            ]} rows={rows} />
          </Card>
        )}
      </Async>
      {open && <Receipt id={open} onClose={() => setOpen(null)} />}
    </>
  );
}
