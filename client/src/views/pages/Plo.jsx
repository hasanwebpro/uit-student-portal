import { Fragment } from 'react';
import { useQuery } from '../../controllers/useQuery.js';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { PloModel } from '../../models/portal.js';
import { formatDashDate, formatHm } from '../../models/format.js';
import { Async } from '../ui/Async.jsx';
import { ScrollRegion } from '../ui/ScrollRegion.jsx';
import { Button, Card, EmptyState, PageHeader } from '../ui/primitives.jsx';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const fmt = (s) => (s ? <span className={s.percent === 0 ? 'zero' : undefined}>{s.percent.toFixed(2)} ({s.weight})</span> : null);

/** Weighted average attainment (and summed weight) per outcome across a set of rows. */
function totals(rows, sos) {
  return Object.fromEntries(sos.map((so) => {
    const items = rows.map((r) => r.scores[so]).filter(Boolean);
    const w = items.reduce((a, s) => a + s.weight, 0);
    return [so, items.length ? { percent: Math.round((items.reduce((a, s) => a + s.percent * s.weight, 0) / w) * 100) / 100, weight: w } : null];
  }));
}

export default function Plo() {
  usePageTitle('PLO attainment');
  const query = useQuery('plo', PloModel.get);
  return (
    <>
      <PageHeader title="Student Program Outcome (PLO) Attainment" crumbs={['General', 'PLO Attainment']} />
      <Async query={query} empty={(d) => d.semesters.length === 0 && <EmptyState icon="chart" title="No attainment data yet" />}>
        {({ student, reportDate, sos, semesters, total }) => (
          <Card className="report">
            <h2 className="report__title" style={{ color: 'var(--ink-strong)', fontSize: 'var(--fs-xl)', textAlign: 'left', textTransform: 'none' }}>Student Program Outcome (PLO) Attainment</h2>
            <p className="report__facts">
              <strong>Student :</strong> {student.regNo} - {student.name}<br />
              <strong>Program :</strong> {student.program}<br />
              <strong>Program Batch :</strong> {student.batch}<br />
              <strong>Report Date :</strong> {formatDashDate(reportDate)} {formatHm(reportDate)}
            </p>
            <ScrollRegion label="PLO attainment by semester (scrolls sideways)">
              <table className="table table--left plo">
                <caption className="visually-hidden">Outcome attainment as percent (weight)</caption>
                <thead><tr><th scope="col">Course</th><th scope="col">Class Room</th><th scope="col">Faculty</th><th scope="col">Credit Hrs</th>{sos.map((so) => <th key={so} scope="col" className="so">SO {so}</th>)}</tr></thead>
                <tbody>
                  {semesters.map((s) => {
                    const sem = totals(s.rows, sos);
                    return (
                      <Fragment key={s.semesterNo}>
                        <tr className="group-row"><td colSpan={4 + sos.length}>Semester {ROMAN[s.semesterNo] ?? s.semesterNo}</td></tr>
                        {s.rows.map((r) => <tr key={r.course}><td>{r.course}</td><td>{r.room}</td><td>{r.faculty}</td><td>{r.credit}</td>{sos.map((so) => <td key={so} className="so">{fmt(r.scores[so])}</td>)}</tr>)}
                        <tr className="subtotal"><td colSpan={4}>Semester Wise Total:</td>{sos.map((so) => <td key={so} className="so">{fmt(sem[so])}</td>)}</tr>
                      </Fragment>
                    );
                  })}
                </tbody>
                <tfoot><tr><td colSpan={4}>Grand Total:</td>{sos.map((so) => <td key={so} className="so">{fmt(total[so])}</td>)}</tr></tfoot>
              </table>
            </ScrollRegion>
            <div className="no-print"><Button variant="quiet" icon="print" onClick={() => window.print()}>Print<span className="visually-hidden"> PLO report</span></Button></div>
          </Card>
        )}
      </Async>
    </>
  );
}
