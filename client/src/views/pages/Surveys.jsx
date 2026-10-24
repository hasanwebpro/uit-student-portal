import { useState } from 'react';
import { useMutation } from '../../controllers/useMutation.js';
import { useQuery } from '../../controllers/useQuery.js';
import { useToast } from '../../controllers/ToastContext.jsx';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { CommunityModel } from '../../models/portal.js';
import { formatDate } from '../../models/format.js';
import { Async } from '../ui/Async.jsx';
import { Dialog } from '../ui/Dialog.jsx';
import { TextAreaField } from '../ui/Fields.jsx';
import { Alert, Badge, Button, Card, EmptyState, PageHeader } from '../ui/primitives.jsx';

const KIND = { Pending: 'warn', Submitted: 'ok', Closed: 'neutral', Upcoming: 'info' };
const WORDS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

function RespondDialog({ survey, onClose, onDone }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const send = useMutation((body) => CommunityModel.respond(survey.id, body));
  async function submit(e) {
    e.preventDefault();
    if (await send.run({ rating, comment: comment || undefined })) { toast.success('Thank you — your feedback was submitted.'); onDone(); }
  }
  return (
    <Dialog open onClose={onClose} title={survey.title} footer={null}>
      <form className="stack" onSubmit={submit} noValidate>
        {send.error && <Alert kind="bad">{send.error.message}{send.fieldErrors.rating && ` ${send.fieldErrors.rating}`}</Alert>}
        <fieldset>
          <legend>How would you rate it? <span className="req" aria-hidden="true">*</span></legend>
          <div className="rating" role="radiogroup" aria-label="Rating from 1 (poor) to 5 (excellent)">
            {WORDS.map((w, i) => (
              <label key={w}><input type="radio" name="rating" value={i + 1} checked={rating === i + 1} onChange={() => setRating(i + 1)} /><span>{i + 1}<span className="visually-hidden"> – {w}</span></span></label>
            ))}
          </div>
          <p className="hint" aria-live="polite">{rating ? WORDS[rating - 1] : '1 = poor, 5 = excellent'}</p>
        </fieldset>
        <TextAreaField label="Comments (optional)" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
        <div className="cluster"><Button type="submit" loading={send.busy} disabled={!rating}>Submit</Button><Button variant="secondary" onClick={onClose}>Cancel</Button></div>
      </form>
    </Dialog>
  );
}

export default function Surveys() {
  usePageTitle('Feedback & surveys');
  const [kind, setKind] = useState('');
  const [open, setOpen] = useState(null);
  const query = useQuery(`surveys:${kind}`, CommunityModel.surveys(kind || undefined));
  return (
    <>
      <PageHeader title="Feedback & surveys" crumbs={['More', 'Feedback & Surveys']} />
      <div className="tabs" role="tablist" aria-label="Type">
        {[['', 'All'], ['Feedback', 'Course feedback'], ['Survey', 'Surveys']].map(([k, label]) => <button key={k} type="button" role="tab" className="tab" aria-selected={kind === k} onClick={() => setKind(k)}>{label}</button>)}
      </div>
      <Async query={query} empty={(d) => d.rows.length === 0 && <EmptyState icon="clipboard" title="Nothing to fill in right now" />}>
        {({ rows }) => (
          <ul className="grid" style={{ '--min': '320px', listStyle: 'none', padding: 0 }}>
            {rows.map((s) => (
              <li key={s.id}>
                <Card as="article" className="stack" aria-label={s.title}>
                  <div className="cluster cluster--between"><Badge kind="info">{s.kind}</Badge><Badge kind={KIND[s.status]}>{s.status}</Badge></div>
                  <h2>{s.title}</h2>
                  <p className="small muted">{s.faculty ? `${s.faculty} · ` : ''}Open {formatDate(s.opensOn)} – {formatDate(s.closesOn)}</p>
                  {s.status === 'Pending' && <div><Button icon="edit" onClick={() => setOpen(s)}>Fill in<span className="visually-hidden"> {s.title}</span></Button></div>}
                  {s.status === 'Submitted' && <p className="small">You rated this {s.myRating}/5.</p>}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Async>
      {open && <RespondDialog survey={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); query.refetch(); }} />}
    </>
  );
}
