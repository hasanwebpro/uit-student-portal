import { useState } from 'react';
import { useMutation } from '../../controllers/useMutation.js';
import { useQuery } from '../../controllers/useQuery.js';
import { useToast } from '../../controllers/ToastContext.jsx';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { TodoModel } from '../../models/portal.js';
import { formatDashDate } from '../../models/format.js';
import { Async } from '../ui/Async.jsx';
import { DataTable } from '../ui/DataTable.jsx';
import { Dialog } from '../ui/Dialog.jsx';
import { CheckField, SelectField, TextField } from '../ui/Fields.jsx';
import { Icon } from '../ui/Icon.jsx';
import { Alert, Button, Card, PageHeader } from '../ui/primitives.jsx';

const BLANK = { task: '', dueDate: '', active: true, status: 'Not Started', priority: 'Medium' };

function TodoForm({ initial, onSaved, onCancel }) {
  const toast = useToast();
  const [form, setForm] = useState(initial ?? BLANK);
  const editing = !!initial?.id;
  const save = useMutation((body) => (editing ? TodoModel.update(initial.id, body) : TodoModel.create(body)));
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const ok = await save.run({ task: form.task, dueDate: form.dueDate || null, active: form.active, status: form.status, priority: form.priority });
    if (ok) { toast.success(editing ? 'Task updated.' : 'Task added.'); setForm(BLANK); onSaved(); }
  }
  const err = save.fieldErrors;
  return (
    <form className="stack" onSubmit={submit} noValidate>
      {save.error && !save.error.details && <Alert kind="bad">{save.error.message}</Alert>}
      <div className="form-grid todo-grid">
        <TextField label="Task" value={form.task} onChange={set('task')} error={err.task} required maxLength={200} placeholder="Enter Task" hint="Please enter task" />
        <TextField type="date" label="Due Date" value={form.dueDate ?? ''} onChange={set('dueDate')} error={err.dueDate} hint="Please select due date" />
        <div className="field"><span className="label">Active</span><CheckField label={<span className="visually-hidden">Active (show on dashboard)</span>} checked={form.active} onChange={set('active')} /></div>
        <SelectField label="Status" value={form.status} onChange={set('status')} hint="Please select status">{['Not Started', 'In Progress', 'Completed'].map((s) => <option key={s}>{s}</option>)}</SelectField>
        <SelectField label="Priority" value={form.priority} onChange={set('priority')} hint="Please select priority">{['Low', 'Medium', 'High'].map((s) => <option key={s}>{s}</option>)}</SelectField>
      </div>
      <div className="center"><Button type="submit" loading={save.busy}>Save</Button>{onCancel && <Button variant="secondary" className="ml" onClick={onCancel}>Cancel</Button>}</div>
    </form>
  );
}

export default function Todo() {
  usePageTitle('To-do list');
  const toast = useToast();
  const query = useQuery('todos', TodoModel.list);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const remove = useMutation(TodoModel.remove);

  async function confirmDelete() {
    if (await remove.run(deleting.id)) { toast.success('Task deleted.'); setDeleting(null); query.refetch(); }
  }

  return (
    <>
      <PageHeader title="Todo List" crumbs={['General', 'Todo List']} />
      <Card className="stack stack--lg">
        <TodoForm key={query.data?.rows.length} onSaved={query.refetch} />
        <Async query={query}>
          {({ rows }) => (
            <DataTable caption="Your tasks" hideCaption rowKey={(r) => r.id} cardTitle={(r) => r.task} columns={[
              { key: 'task', header: 'Task', rowHeader: true },
              { key: 'dueDate', header: 'Due Date', render: (r) => formatDashDate(r.dueDate) },
              { key: 'createdOn', header: 'Created Date', render: (r) => formatDashDate(r.createdOn) },
              { key: 'active', header: 'Active Status', render: (r) => (r.active ? 'Active' : 'In-Active') },
              { key: 'status', header: 'Status' },
              { key: 'priority', header: 'Priority' },
              { key: 'edit', header: 'Edit', render: (r) => <button type="button" className="btn-icon btn-icon--plain" onClick={() => setEditing(r)} title="Edit"><Icon name="edit" /><span className="visually-hidden">Edit {r.task}</span></button> },
              { key: 'delete', header: 'Delete', render: (r) => <button type="button" className="btn-icon btn-icon--plain" onClick={() => setDeleting(r)} title="Delete"><Icon name="trash" /><span className="visually-hidden">Delete {r.task}</span></button> },
            ]} rows={rows} />
          )}
        </Async>
      </Card>

      <Dialog open={!!editing} onClose={() => setEditing(null)} title="Edit task" footer={null}>
        {editing && <TodoForm initial={editing} onSaved={() => { setEditing(null); query.refetch(); }} onCancel={() => setEditing(null)} />}
      </Dialog>
      <Dialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete this task?"
        footer={<><Button variant="secondary" onClick={() => setDeleting(null)}>Keep it</Button><Button variant="danger" loading={remove.busy} onClick={confirmDelete}>Delete task</Button></>}>
        <p>“{deleting?.task}” will be removed. This cannot be undone.</p>
        {remove.error && <Alert kind="bad">{remove.error.message}</Alert>}
      </Dialog>
    </>
  );
}
