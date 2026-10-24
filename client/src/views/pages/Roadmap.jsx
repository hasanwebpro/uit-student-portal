import { Fragment, useState } from 'react';
import { useMutation } from '../../controllers/useMutation.js';
import { useQuery } from '../../controllers/useQuery.js';
import { useToast } from '../../controllers/ToastContext.jsx';
import { useMediaQuery } from '../../controllers/useMediaQuery.js';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { RoadmapModel } from '../../models/portal.js';
import { programLabel, twoDecimals } from '../../models/format.js';
import { Async } from '../ui/Async.jsx';
import { CheckField, TextAreaField } from '../ui/Fields.jsx';
import { Icon } from '../ui/Icon.jsx';
import { ScrollRegion } from '../ui/ScrollRegion.jsx';
import { Alert, Button, Card, PageHeader } from '../ui/primitives.jsx';

const COLS = [
  ['session', 'Session'], ['courseType', 'Course Type'], ['course', 'Course'], ['kind', 'Course Category'], ['prereq', 'Course PreRequisites'],
  ['prereqStatus', 'Pre Requisite Status'], ['substitute', 'Substitute'], ['status', 'Course Status'], ['creditsEarned', 'Cr. Hrs Earned'],
];
const label = (code) => (code === 'LAB' ? 'LAB' : code === 'TH' ? 'TH' : code);

function StatusText({ status }) { return <span className={`status status--${status.toLowerCase()}`}>{status}</span>; }

function Verification({ initial, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ verified: initial.verified, comments: initial.comments });
  const save = useMutation(RoadmapModel.verify);
  async function submit(e) {
    e.preventDefault();
    if (await save.run(form)) { toast.success('Verification updated.'); onSaved(); }
  }
  return (
    <form className="stack" onSubmit={submit} noValidate>
      {save.error && <Alert kind="bad">{save.error.message}</Alert>}
      <TextAreaField label="Comments" value={form.comments} onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))} maxLength={500} error={save.fieldErrors.comments} />
      <CheckField label="Verify" checked={form.verified} onChange={(e) => setForm((f) => ({ ...f, verified: e.target.checked }))} />
      <div className="center"><Button type="submit" loading={save.busy}>Update Verification</Button></div>
    </form>
  );
}

export default function Roadmap() {
  usePageTitle('Road map');
  const query = useQuery('roadmap', RoadmapModel.get);
  const wide = useMediaQuery('(min-width: 960px)');
  const [filters, setFilters] = useState({});
  const [closed, setClosed] = useState(new Set());
  const setFilter = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const toggleGroup = (g) => setClosed((s) => { const n = new Set(s); if (n.has(g)) n.delete(g); else n.add(g); return n; });

  return (
    <>
      <PageHeader title="Road Map" crumbs={['General', 'Road Map']} />
      <Async query={query}>
        {(d) => {
          const rows = d.rows.map((r) => ({ ...r, substitute: '' })).filter((r) => COLS.every(([k]) => !filters[k] || String(k === 'kind' ? label(r.kind) : r[k] ?? '').toLowerCase().includes(filters[k].toLowerCase())));
          const groups = [...new Set(rows.map((r) => r.courseType))];
          const cell = (r, k) => (k === 'status' ? <StatusText status={r.status} /> : k === 'kind' ? label(r.kind) : k === 'creditsEarned' ? r.creditsEarned : r[k] || '');
          return (
            <div className="stack stack--lg">
              <Card aria-label="Student">
                <dl className="kv kv--wide">
                  <dt>Registration No :</dt><dd>{d.student.regNo}</dd>
                  <dt>Name :</dt><dd>{d.student.name}</dd>
                  <dt>Program :</dt><dd>{programLabel(d.student.program)}</dd>
                  <dt>Enrollment Session :</dt><dd>{d.student.session}</dd>
                </dl>
              </Card>

              <Card className="card--flush">
                {wide ? (
                  <ScrollRegion label="Road map (scrolls sideways)">
                    <table className="table table--left roadmap">
                      <caption className="visually-hidden">Degree road map grouped by course type</caption>
                      <thead>
                        <tr>{COLS.map(([k, h]) => <th key={k} scope="col">{h}</th>)}</tr>
                        <tr className="filter-row">{COLS.map(([k, h]) => <td key={k}><input className="input input--filter" aria-label={`Filter ${h}`} value={filters[k] ?? ''} onChange={setFilter(k)} /></td>)}</tr>
                      </thead>
                      <tbody>
                        {groups.map((g) => (
                          <Fragment key={g}>
                            <tr className="group-row"><td colSpan={COLS.length}>
                              <button type="button" className="group-toggle" aria-expanded={!closed.has(g)} onClick={() => toggleGroup(g)}><Icon name="chevron" className={closed.has(g) ? 'icon turn' : 'icon'} />{g}</button>
                            </td></tr>
                            {!closed.has(g) && rows.filter((r) => r.courseType === g).map((r) => (
                              <tr key={r.code}>{COLS.map(([k]) => <td key={k}>{cell(r, k)}</td>)}</tr>
                            ))}
                          </Fragment>
                        ))}
                        {rows.length === 0 && <tr><td colSpan={COLS.length} className="empty-row">No records to display.</td></tr>}
                      </tbody>
                      <tfoot><tr><td colSpan={COLS.length - 1} /><td>Total : {twoDecimals(d.totalEarned)}</td></tr></tfoot>
                    </table>
                  </ScrollRegion>
                ) : (
                  <div className="stack" style={{ padding: 14 }}>
                    {groups.map((g) => (
                      <section key={g} aria-label={g} className="stack" style={{ '--gap': '8px' }}>
                        <h2 className="group-head">{g}</h2>
                        <ul className="records">
                          {rows.filter((r) => r.courseType === g).map((r) => (
                            <li key={r.code} className="record"><p className="record__title">{r.course}</p>
                              <dl className="kv"><dt>Session</dt><dd>{r.session || '—'}</dd><dt>Category</dt><dd>{label(r.kind)}</dd><dt>Prerequisite</dt><dd>{r.prereq || '—'} {r.prereqStatus}</dd><dt>Status</dt><dd><StatusText status={r.status} /></dd><dt>Credits earned</dt><dd>{r.creditsEarned}</dd></dl></li>
                          ))}
                        </ul>
                      </section>
                    ))}
                    <p><strong>Total : {twoDecimals(d.totalEarned)}</strong></p>
                  </div>
                )}
              </Card>

              <div className="grid grid--2">
                <Card className="card--flush" aria-label="Course status legend">
                  <table className="table table--left"><caption className="visually-hidden">Course status legend</caption>
                    <thead><tr><th scope="col" colSpan={2}>Course Status</th></tr></thead>
                    <tbody>{d.legend.map(([k, v]) => <tr key={k}><td><StatusText status={k} /></td><td>{v}</td></tr>)}</tbody></table>
                </Card>
                <Card className="card--flush" aria-label="Fee outstanding">
                  <table className="table table--left"><caption className="visually-hidden">Current balance</caption>
                    <thead><tr><th scope="col">Description</th><th scope="col">Amount</th></tr></thead>
                    <tbody><tr><td>Current Balance</td><td>{d.fee.balance}</td></tr><tr><td>Loan/Deferment Amount</td><td>{d.fee.loan}</td></tr></tbody></table>
                </Card>
              </div>

              <Card className="card--flush" aria-label="GPA and CGPA summary">
                <table className="table"><caption className="visually-hidden">GPA/CGPA summary</caption>
                  <thead><tr><th scope="col" colSpan={4}>GPA/CGPA Summary</th></tr><tr className="subhead"><th scope="col">Session</th><th scope="col">No Of Courses</th><th scope="col">GPA</th><th scope="col">CGPA</th></tr></thead>
                  <tbody>{d.history.map((h) => <tr key={h.session}><td>{h.session}</td><td>{h.courses}</td><td>{h.gpa}</td><td>{h.cgpa}</td></tr>)}</tbody></table>
              </Card>

              <Card><Verification initial={d.verification} onSaved={query.refetch} /></Card>
            </div>
          );
        }}
      </Async>
    </>
  );
}
