import { useQuery } from '../../controllers/useQuery.js';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { ExamModel } from '../../models/portal.js';
import { formatDate } from '../../models/format.js';
import { Async } from '../ui/Async.jsx';
import { ScrollRegion } from '../ui/ScrollRegion.jsx';
import { Alert, Button, PageHeader } from '../ui/primitives.jsx';

export default function AdmitCard({ kind }) {
  const lab = kind === 'LAB';
  const title = lab ? 'Print lab admit card' : 'Print admit card';
  usePageTitle(title);
  const query = useQuery(`admit:${kind}`, ExamModel.admitCard(kind));
  return (
    <>
      <PageHeader title={title} crumbs={['Exam', lab ? 'Print Lab Admit Card' : 'Print Admit Card']}
        actions={query.data?.eligible && <Button icon="print" onClick={() => window.print()}>Print</Button>} />
      <Async query={query}>
        {(d) => !d.eligible ? <Alert kind="warn" title="Admit card not available">{d.reason}</Alert> : (
          <article className="print-card admit stack" aria-label={title}>
            <h2>UIT University — {lab ? 'Lab' : 'Final term'} admit card</h2>
            <dl className="kv"><dt>Name</dt><dd>{d.student.name}</dd><dt>Reg. no</dt><dd>{d.student.regNo}</dd><dt>Enrollment</dt><dd>{d.student.enrollmentNo}</dd><dt>Program</dt><dd>{d.student.program}</dd><dt>Issued</dt><dd>{formatDate(d.issuedOn)}</dd></dl>
            <ScrollRegion label="Table (scrolls sideways)">
              <table className="table">
                <caption className="visually-hidden">Exam schedule</caption>
                <thead><tr><th scope="col">Course</th><th scope="col">Date</th><th scope="col">Time</th><th scope="col">Room</th><th scope="col" className="num">Seat</th></tr></thead>
                <tbody>{d.rows.map((r) => <tr key={r.code}><td>{r.course}</td><td>{formatDate(r.date)}</td><td className="num">{r.start}–{r.end}</td><td>{r.room}</td><td className="num"><strong>{r.seat}</strong></td></tr>)}</tbody>
              </table>
            </ScrollRegion>
            <p className="small">Bring this card and your university ID to every paper. Mobile phones are not allowed in the exam hall.</p>
          </article>
        )}
      </Async>
    </>
  );
}
