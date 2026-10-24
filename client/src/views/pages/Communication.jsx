import { useMemo, useState } from 'react';
import { useMutation } from '../../controllers/useMutation.js';
import { useQuery } from '../../controllers/useQuery.js';
import { useToast } from '../../controllers/ToastContext.jsx';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { CourseModel, MessageModel } from '../../models/portal.js';
import { todayIso } from '../../models/format.js';
import { Async } from '../ui/Async.jsx';
import { CheckField, SelectField, TextAreaField, TextField } from '../ui/Fields.jsx';
import { Pager } from '../ui/Pager.jsx';
import { Alert, Badge, Button, Card, PageHeader } from '../ui/primitives.jsx';

const COMM_TYPES = ['Announcement', 'Query', 'Request', 'Complaint', 'Feedback'];
const CATEGORIES = ['Information', 'Academic', 'Administrative', 'Financial', 'Technical'];
const TABS = [['student', 'Student', 'Reg # / Roll no / name'], ['faculty', 'Faculty', 'Faculty (Code)'], ['admin', 'Admin', 'Admin']];

/** Checkbox grid of possible recipients: filter box, "check all", and the original's pager. */
function RecipientGrid({ type, course, picked, onToggle, onToggleMany }) {
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const needsCourse = type === 'student';
  const query = useQuery(`recipients:${type}:${course}`, () => MessageModel.recipients({ type, course: needsCourse ? course : undefined }), { enabled: !needsCourse || !!course });
  const label = (r) => `${r.name} (${r.detail})`;
  const rows = useMemo(() => (query.data?.rows ?? []).filter((r) => label(r).toLowerCase().includes(filter.trim().toLowerCase())), [query.data, filter]);
  const pageRows = rows.slice((page - 1) * size, page * size);
  const key = (r) => `${type}:${r.id}`;
  const allChecked = pageRows.length > 0 && pageRows.every((r) => picked.has(key(r)));
  const heading = TABS.find((t) => t[0] === type)[2];

  if (needsCourse && !course) return <Alert kind="info">Choose a course to see your classmates.</Alert>;
  return (
    <Async query={query}>
      {() => (
        <div className="recipient-grid">
          <div className="table-wrap">
            <table className="table table--left">
              <caption className="visually-hidden">{heading}</caption>
              <thead>
                <tr>
                  <th scope="col" className="narrow"><input type="checkbox" aria-label="Select all shown" checked={allChecked} onChange={(e) => onToggleMany(pageRows.map((r) => ({ key: key(r), type, id: r.id, name: r.name })), e.target.checked)} /></th>
                  <th scope="col">{heading}</th>
                </tr>
                <tr className="filter-row"><td /><td><input className="input input--filter" type="search" aria-label={`Filter ${heading}`} value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} /></td></tr>
              </thead>
              <tbody>
                {pageRows.length === 0 && <tr><td colSpan={2} className="empty-row">No records to display.</td></tr>}
                {pageRows.map((r) => (
                  <tr key={r.id}>
                    <td className="narrow"><input type="checkbox" aria-label={`Select ${r.name}`} checked={picked.has(key(r))} onChange={() => onToggle({ key: key(r), type, id: r.id, name: r.name })} /></td>
                    <td>{label(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} size={size} total={rows.length} onPage={setPage} onSize={setSize} />
        </div>
      )}
    </Async>
  );
}

export default function Communication() {
  usePageTitle('New communication');
  const toast = useToast();
  const courses = useQuery('courses', CourseModel.list);
  const [meta, setMeta] = useState({ commType: 'Announcement', priority: 'Low', category: 'Information', dueDate: todayIso(), followUp: false, reminder: false });
  const [tab, setTab] = useState('student');
  const [course, setCourse] = useState('');
  const [picked, setPicked] = useState(new Map());
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const send = useMutation(MessageModel.send);
  const err = send.fieldErrors;
  const setM = (k) => (e) => setMeta((m) => ({ ...m, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const toggle = (r) => setPicked((m) => { const n = new Map(m); if (n.has(r.key)) n.delete(r.key); else n.set(r.key, r); return n; });
  const toggleMany = (items, on) => setPicked((m) => { const n = new Map(m); for (const r of items) { if (on) n.set(r.key, r); else n.delete(r.key); } return n; });

  async function submit(e) {
    e.preventDefault();
    const ok = await send.run({ ...meta, dueDate: meta.dueDate || null, recipients: [...picked.values()].map(({ type, id }) => ({ type, id })), subject, body });
    if (ok) { toast.success('Message sent.'); setPicked(new Map()); setSubject(''); setBody(''); }
  }

  return (
    <>
      <PageHeader title="New Communication" crumbs={['General', 'New Communication']} />
      <Card>
        <form className="stack stack--lg" onSubmit={submit} noValidate>
          {send.error && !send.error.details && <Alert kind="bad">{send.error.message}</Alert>}
          <div className="form-grid comm-meta">
            <SelectField label="Communication Type" value={meta.commType} onChange={setM('commType')}>{COMM_TYPES.map((t) => <option key={t}>{t}</option>)}</SelectField>
            <SelectField label="Priority" value={meta.priority} onChange={setM('priority')}>{['Low', 'Medium', 'High'].map((t) => <option key={t}>{t}</option>)}</SelectField>
            <SelectField label="Category" value={meta.category} onChange={setM('category')}>{CATEGORIES.map((t) => <option key={t}>{t}</option>)}</SelectField>
            <TextField type="date" label="Date" value={meta.dueDate} onChange={setM('dueDate')} error={err.dueDate} />
            <div className="field"><span className="label">Follow Up Task</span><CheckField label={<span className="visually-hidden">Create a follow-up task on the date</span>} checked={meta.followUp} onChange={setM('followUp')} /></div>
            <div className="field"><span className="label">Set Reminder</span><CheckField label={<span className="visually-hidden">Set a reminder</span>} checked={meta.reminder} onChange={setM('reminder')} /></div>
          </div>

          <div>
            <div className="tabs tabs--folder" role="tablist" aria-label="Recipient type">
              {TABS.map(([k, label]) => <button key={k} type="button" role="tab" id={`rt-${k}`} aria-controls="recipient-panel" className="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{label}</button>)}
            </div>
            <div role="tabpanel" id="recipient-panel" aria-labelledby={`rt-${tab}`} className="stack">
              {tab === 'student' && (
                <SelectField label="Course" value={course} onChange={(e) => setCourse(e.target.value)} className="form-narrow">
                  <option value="" />
                  {courses.data?.courses.map((c) => <option key={c.enrollmentId} value={c.enrollmentId}>{c.title} ( {c.code} )</option>)}
                </SelectField>
              )}
              <RecipientGrid key={tab} type={tab} course={course} picked={picked} onToggle={toggle} onToggleMany={toggleMany} />
              <p aria-live="polite" className="small">{picked.size === 0 ? 'No recipients selected.' : <><Badge kind="info">{picked.size}</Badge> recipient{picked.size === 1 ? '' : 's'} selected</>}{err.recipients && <span className="error" role="alert"> {err.recipients}</span>}</p>
            </div>
          </div>

          <TextField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} error={err.subject} required maxLength={120} placeholder="Subject" />
          <TextAreaField label="Message" value={body} onChange={(e) => setBody(e.target.value)} error={err.body} required maxLength={4000} />
          <div className="center"><Button type="submit" loading={send.busy} disabled={picked.size === 0}>Send</Button></div>
        </form>
      </Card>
    </>
  );
}
