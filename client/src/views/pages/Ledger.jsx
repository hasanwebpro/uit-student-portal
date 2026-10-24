import { useState } from 'react';
import { useQuery } from '../../controllers/useQuery.js';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { FeeModel } from '../../models/portal.js';
import { formatDashDate, formatDateTime, programLabel, twoDecimals } from '../../models/format.js';
import { Async } from '../ui/Async.jsx';
import { DataTable } from '../ui/DataTable.jsx';
import { Pager } from '../ui/Pager.jsx';
import { Button, Card, PageHeader } from '../ui/primitives.jsx';

export default function Ledger() {
  usePageTitle('General ledger');
  const query = useQuery('ledger', FeeModel.ledger({}));
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(100);
  return (
    <>
      <PageHeader title="Student General Ledger" crumbs={['Fee', 'My General Ledger']} />
      <Card className="report">
        <Async query={query}>
          {(d) => {
            const rows = d.entries.slice((page - 1) * size, page * size);
            const charged = d.entries.reduce((a, e) => a + e.debit, 0);
            const paid = d.entries.reduce((a, e) => a + e.credit, 0);
            return (
              <>
                <h2 className="report__title">Student General Ledger Report</h2>
                <p className="report__meta">REPORT DATE : {formatDateTime(d.reportDate)}</p>
                <p className="report__facts">
                  <strong>Student :</strong> {d.student.regNo} / {d.student.name}<br />
                  <strong>Program Structure:</strong> {programLabel(d.student.program)}<br />
                  <strong>Current Balance :</strong> {twoDecimals(d.balance)}
                </p>
                <DataTable caption="Ledger entries with running balance" hideCaption rowKey={(r) => r.id} cardTitle={(r) => r.description} columns={[
                  { key: 'feeNature', header: 'Fee Nature', rowHeader: true },
                  { key: 'session', header: 'Session' },
                  { key: 'postedOn', header: 'Date', render: (r) => formatDashDate(r.postedOn).replace(/-/g, ' ') },
                  { key: 'debit', header: 'Charging' },
                  { key: 'credit', header: 'Amount', render: (r) => (r.credit ? -r.credit : 0) },
                  { key: 'balance', header: 'Current Balance' },
                ]} rows={rows} footer={<tr><td colSpan={3} /><td>Total : {charged}</td><td>Total : {-paid}</td><td /></tr>} />
                <Pager page={page} size={size} total={d.entries.length} onPage={setPage} onSize={setSize} sizes={[10, 25, 50, 100]} />
                <div className="no-print"><Button variant="quiet" icon="print" onClick={() => window.print()}>Print<span className="visually-hidden"> ledger report</span></Button></div>
              </>
            );
          }}
        </Async>
      </Card>
    </>
  );
}
