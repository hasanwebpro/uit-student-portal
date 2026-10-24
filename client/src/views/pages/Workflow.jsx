import { useState } from 'react';
import { useMutation } from '../../controllers/useMutation.js';
import { useQuery } from '../../controllers/useQuery.js';
import { useToast } from '../../controllers/ToastContext.jsx';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { WorkflowModel } from '../../models/portal.js';
import { formatDashDate } from '../../models/format.js';
import { Async } from '../ui/Async.jsx';
import { DataTable } from '../ui/DataTable.jsx';
import { Dialog } from '../ui/Dialog.jsx';
import { SelectField, TextAreaField, TextField } from '../ui/Fields.jsx';
import { Alert, Badge, Button, Card, PageHeader } from '../ui/primitives.jsx';

const KINDS = ['Course Withdrawal', 'Semester Freeze', 'Transcript Request', 'Section Change', 'Other'];
const STATUS_KIND = { Draft: 'neutral', Submitted: 'info', Approved: 'ok', Rejected: 'bad' };

function WorkflowForm({ initial, onSaved, onCancel }) {
  const toast = useToast();
  const editing = !!initial?.id;
  const [form, setForm] = useState({ kind: initial?.kind ?? KINDS[0], dueDate: initial?.dueDate ?? '', description: initial?.description ?? '' });
  const save = useMutation((b) => (editing ? WorkflowModel.update(initial.id, b) : WorkflowModel.create(b)));
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  async function submit(e) {
    e.preventDefault();
    if (await save.run({ ...form, dueDate: form.dueDate || null })) { toast.success(editing ? 'Request updated.' : 'Request saved as a draft.'); onSaved(); }
  }
  const err = save.fieldErrors;
  return (
    <form className="stack" onSubmit={submit} noValidate>
      {save.error && !save.error.details && <Alert kind="bad">{save.error.message}</Alert>}
      <SelectField label="Request type" value={form.kind} onChange={set('kind')}>{KINDS.map((k) => <option key={k}>{k}</option>)}</SelectField>
      <TextField type="date" label="Needed by" value={form.dueDate} onChange={set('dueDate')} error={err.dueDate} />
      <TextAreaField label="Description" value={form.description} onChange={set('description')} error={err.description} required maxLength={1000} hint="Explain what you need and why." />
      <div className="cluster"><Button type="submit" loading={save.busy}>{editing ? 'Save changes' : 'Save draft'}</Button><Button variant="secondary" onClick={onCancel}>Cancel</Button></div>
    </form>
  );
}

export default function Workflow() {
  usePageTitle('Work flow');
  const toast = useToast();
  const query = useQuery('workflows', WorkflowModel.list);
  const [form, setForm] = useState(null);            // null | {} (new) | workflow (edit)
  const [confirm, setConfirm] = useState(null);      // { kind: 'delete'|'submit', item }
  const action = useMutation(({ kind, item }) => (kind === 'delete' ? WorkflowModel.remove(item.id) : WorkflowModel.submit(item.id)));

  async function runConfirm() {
    if (await action.run(confirm)) { toast.success(confirm.kind === 'delete' ? 'Request deleted.' : 'Request submitted for review.'); setConfirm(null); query.refetch(); }
  }

  return (
    <>
      <PageHeader title="Work Flow" crumbs={['General', 'Work Flow']} actions={<Button icon="plus" onClick={() => setForm({})}>New request</Button>} />
      <p className="flow-note">Delete And Edit will not be available once WorkFlow is Finally Submtted</p>
      <div style={{ marginTop: 16 }}>
        <Async query={query}>
          {({ rows }) => (
            <Card>
              <DataTable caption="Your requests" hideCaption rowKey={(r) => r.id} cardTitle={(r) => r.kind} columns={[
                { key: 'session', header: 'Session' },
                { key: 'kind', header: 'WorkFlow', rowHeader: true },
                { key: 'dueDate', header: 'DueDate', render: (r) => formatDashDate(r.dueDate) },
                { key: 'description', header: 'Description' },
                { key: 'status', header: 'Status', render: (r) => <Badge kind={STATUS_KIND[r.status]}>{r.status}</Badge> },
                { key: 'finalSubmitted', header: 'Final Submission Status', render: (r) => (r.finalSubmitted ? 'Final Submitted' : 'Not Submitted') },
                { key: 'actions', header: 'Actions', render: (r) => r.finalSubmitted ? <span className="muted small">No further changes</span> : (
                  <div className="cluster" style={{ '--gap': '8px' }}>
                    <Button variant="secondary" className="btn--sm" icon="edit" onClick={() => setForm(r)}>Edit<span className="visually-hidden"> {r.kind}</span></Button>
                    <Button className="btn--sm" icon="send" onClick={() => setConfirm({ kind: 'submit', item: r })}>Final submit<span className="visually-hidden"> {r.kind}</span></Button>
                    <Button variant="danger" className="btn--sm" icon="trash" onClick={() => setConfirm({ kind: 'delete', item: r })}>Delete<span className="visually-hidden"> {r.kind}</span></Button>
                  </div>) },
              ]} rows={rows} />
            </Card>
          )}
        </Async>
      </div>

      <Dialog open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Edit request' : 'New request'} footer={null}>
        {form && <WorkflowForm initial={form.id ? form : null} onCancel={() => setForm(null)} onSaved={() => { setForm(null); query.refetch(); }} />}
      </Dialog>
      <Dialog open={!!confirm} onClose={() => { setConfirm(null); action.reset(); }} title={confirm?.kind === 'delete' ? 'Delete this request?' : 'Submit this request finally?'}
        footer={<><Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button><Button variant={confirm?.kind === 'delete' ? 'danger' : 'primary'} loading={action.busy} onClick={runConfirm}>{confirm?.kind === 'delete' ? 'Delete' : 'Final submit'}</Button></>}>
        <p>{confirm?.kind === 'delete' ? 'The draft will be removed.' : 'After final submission you will not be able to edit or delete it.'}</p>
        {action.error && <Alert kind="bad">{action.error.message}</Alert>}
      </Dialog>
    </>
  );
}
