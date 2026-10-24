import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '../../controllers/useMutation.js';
import { useQuery } from '../../controllers/useQuery.js';
import { useToast } from '../../controllers/ToastContext.jsx';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { RegistrationModel } from '../../models/portal.js';
import { formatDate } from '../../models/format.js';
import { Async } from '../ui/Async.jsx';
import { Alert, Badge, Button, Card, Meter, PageHeader } from '../ui/primitives.jsx';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const slotsText = (timings) => timings.map((t) => `${t.day.slice(0, 3)} ${t.start}–${t.end}`).join(', ');

function Picker({ data, refetch }) {
  const toast = useToast();
  const { window: w, offered } = data;
  const [picked, setPicked] = useState(() => new Set(offered.filter((o) => o.selected).map((o) => o.sectionId)));
  useEffect(() => { setPicked(new Set(offered.filter((o) => o.selected).map((o) => o.sectionId))); }, [offered]);
  const submit = useMutation(RegistrationModel.submit);

  const credits = useMemo(() => offered.filter((o) => picked.has(o.sectionId)).reduce((a, o) => a + o.creditHrs, 0), [offered, picked]);
  const toggle = (id) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const level = credits > w.maxCredits ? 'risk' : credits >= w.minCredits ? 'good' : 'warn';

  async function save() {
    if (await submit.run([...picked])) { toast.success('Registration saved.'); refetch(); }
  }
  const problems = submit.error?.details?.problems;

  return (
    <div className="stack stack--lg">
      <Card className="reg-head">
        <h2 className="reg-head__title">Semester: SEMESTER {ROMAN[w.semesterNo] ?? w.semesterNo}</h2>
        <div className="reg-head__row">
          <span>Min Credit Hours : <strong>{w.minCredits}</strong></span>
          <span>Max Credit Hours : <strong>{w.maxCredits}</strong></span>
          <span>Total Credit Hours: <strong>{credits || ''}</strong></span>
        </div>
      </Card>
      <Alert kind={w.open ? 'info' : 'warn'} title={w.session}>
        {w.open ? `Registration is open until ${formatDate(w.closesOn)}.` : `Registration is closed (it runs ${formatDate(w.opensOn)} – ${formatDate(w.closesOn)}).`}
      </Alert>

      <fieldset className="stack" disabled={!w.open}>
        <legend className="visually-hidden">Courses offered this term</legend>
        <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {offered.map((o) => (
            <li key={o.sectionId}>
              <label className="select-card" aria-disabled={!o.eligible}>
                <input type="checkbox" checked={picked.has(o.sectionId)} disabled={!o.eligible || !w.open} onChange={() => toggle(o.sectionId)} />
                <span className="stack" style={{ '--gap': '4px' }}>
                  <strong>{o.title} <span className="muted">({o.code})</span></strong>
                  <span className="small">{o.kind === 'LAB' ? 'Lab' : 'Theory'} · {o.creditHrs} credit hours · {o.requirement} · {o.faculty}</span>
                  <span className="small muted">{slotsText(o.timings)}</span>
                  {!o.eligible && <span className="chip-row">{o.reasons.map((r) => <Badge key={r} kind="warn">{r}</Badge>)}</span>}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <div className="card sticky-bar" role="region" aria-label="Registration summary">
        <div className="cluster cluster--between">
          <div className="grow" aria-live="polite">
            <strong>{credits} credit hours selected</strong> <span className="muted small">(min {w.minCredits}, max {w.maxCredits})</span>
            <Meter value={Math.round((credits / w.maxCredits) * 100)} level={level} label="Credit hours selected" />
          </div>
          <Button icon="check" loading={submit.busy} disabled={!w.open} onClick={save}>Save registration</Button>
        </div>
      </div>

      {problems && <Alert kind="bad" title="Please fix the following"><ul>{problems.map((p) => <li key={p}>{p}</li>)}</ul></Alert>}
      {submit.error && !problems && <Alert kind="bad">{submit.error.message}</Alert>}
    </div>
  );
}

export default function Registration() {
  usePageTitle('Register online');
  const query = useQuery('registration', RegistrationModel.get);
  return (
    <>
      <PageHeader title="Register online" crumbs={['Registration', 'Register Online']} />
      <Async query={query}>
        {(d) => d.window ? <Picker data={d} refetch={query.refetch} /> : <Alert kind="info">{d.message}</Alert>}
      </Async>
    </>
  );
}
