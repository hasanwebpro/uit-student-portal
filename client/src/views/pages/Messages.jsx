import { useEffect, useState } from 'react';
import { useMutation } from '../../controllers/useMutation.js';
import { useQuery } from '../../controllers/useQuery.js';
import { useToast } from '../../controllers/ToastContext.jsx';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { MessageModel } from '../../models/portal.js';
import { formatDashDate, formatDateTime, formatHm } from '../../models/format.js';
import { Async } from '../ui/Async.jsx';
import { DataTable } from '../ui/DataTable.jsx';
import { Dialog } from '../ui/Dialog.jsx';
import { TextField } from '../ui/Fields.jsx';
import { Badge, Button, Card, PageHeader } from '../ui/primitives.jsx';

function Reader({ id, onClose, onChanged }) {
  const toast = useToast();
  const query = useQuery(`message:${id}`, () => MessageModel.get(id));
  const del = useMutation(MessageModel.remove);
  useEffect(() => { if (query.data) onChanged(); }, [query.data]);          // eslint-disable-line react-hooks/exhaustive-deps -- opening marks it read → refresh list/unread count once per load
  async function remove() { if (await del.run(id)) { toast.success('Message deleted.'); onClose(); onChanged(); } }
  const m = query.data?.message;
  return (
    <Dialog open onClose={onClose} title={m?.subject ?? 'Message'}
      footer={<><Button variant="danger" icon="trash" loading={del.busy} onClick={remove}>Delete</Button><Button variant="secondary" onClick={onClose}>Close</Button></>}>
      <Async query={query}>
        {({ message }) => (
          <>
            <p className="muted small">{message.box === 'inbox' ? 'From' : 'To'} <strong>{message.party}</strong> ({message.role}) · {formatDateTime(message.createdAt)}</p>
            <p className="chip-row"><Badge kind="info">{message.commType}</Badge><Badge kind={message.priority === 'High' ? 'warn' : 'neutral'}>{message.priority} priority</Badge><Badge>{message.category}</Badge>
              {message.dueDate && <Badge>Date {formatDashDate(message.dueDate)}</Badge>}{message.followUp && <Badge kind="ok">Follow-up task</Badge>}{message.reminder && <Badge kind="ok">Reminder</Badge>}</p>
            <p className="mail__body">{message.body}</p>
          </>
        )}
      </Async>
    </Dialog>
  );
}

export default function Messages() {
  usePageTitle('My messages');
  const [box, setBox] = useState('inbox');
  const [crit, setCrit] = useState({ from: '', to: '', q: '' });
  const [applied, setApplied] = useState(crit);
  const [open, setOpen] = useState(null);
  const query = useQuery(`messages:${box}:${applied.from}:${applied.to}:${applied.q}`, MessageModel.list({ box, ...applied }));
  const bad = crit.from && crit.to && crit.from > crit.to;
  const set = (k) => (e) => setCrit((c) => ({ ...c, [k]: e.target.value }));

  return (
    <>
      <PageHeader title="My Messages" crumbs={['More', 'My Messages']} />
      <div className="stack stack--lg">
        <Card aria-labelledby="h-search">
          <h2 id="h-search">Search Criteria</h2>
          <form className="form-grid" onSubmit={(e) => { e.preventDefault(); if (!bad) setApplied(crit); }}>
            <TextField type="date" label="From" value={crit.from} onChange={set('from')} />
            <TextField type="date" label="To" value={crit.to} onChange={set('to')} error={bad ? '“To” must be on or after “From”.' : undefined} />
            <TextField type="search" label="Text" value={crit.q} onChange={set('q')} placeholder="Subject, sender or message" />
            <div className="field"><span className="label" aria-hidden="true">&nbsp;</span><Button type="submit" icon="search">Search</Button></div>
          </form>
        </Card>
        <Card aria-labelledby="h-inbox">
          <div className="tabs" role="tablist" aria-label="Mailbox">
            {[['inbox', 'Inbox'], ['sent', 'Sent']].map(([k, label]) => <button key={k} type="button" role="tab" id={`mb-${k}`} aria-controls="mb-panel" className="tab" aria-selected={box === k} onClick={() => setBox(k)}>{label}</button>)}
          </div>
          <div role="tabpanel" id="mb-panel" aria-labelledby={`mb-${box}`} aria-live="polite">
            <h2 id="h-inbox" className="visually-hidden">{box === 'inbox' ? 'Inbox' : 'Sent messages'}</h2>
            <Async query={query}>
              {({ rows, unread }) => (
                <>
                  {box === 'inbox' && unread > 0 && <p><Badge kind="info">{unread} unread</Badge></p>}
                  <DataTable caption={box === 'inbox' ? 'Inbox' : 'Sent'} hideCaption rowKey={(r) => r.id} cardTitle={(r) => r.subject} columns={[
                    { key: 'subject', header: 'Initiate', rowHeader: true, render: (r) => (
                      <button type="button" className="link-btn" data-unread={!r.read} onClick={() => setOpen(r.id)}>{r.subject}{!r.read && <span className="visually-hidden"> (unread)</span>}</button>) },
                    { key: 'party', header: box === 'inbox' ? 'From' : 'To', render: (r) => `${r.party} (${r.role})` },
                    { key: 'priority', header: 'Priority' },
                    { key: 'createdAt', header: 'Date', render: (r) => `${formatDashDate(r.createdAt)} ${formatHm(r.createdAt)}` },
                  ]} rows={rows} />
                </>
              )}
            </Async>
          </div>
        </Card>
      </div>
      {open && <Reader id={open} onClose={() => setOpen(null)} onChanged={query.refetch} />}
    </>
  );
}
