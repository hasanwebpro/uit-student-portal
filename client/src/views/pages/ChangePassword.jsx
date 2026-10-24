import { useState } from 'react';
import { useMutation } from '../../controllers/useMutation.js';
import { useToast } from '../../controllers/ToastContext.jsx';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { AuthModel } from '../../models/portal.js';
import { PasswordField } from '../ui/Fields.jsx';
import { Alert, Button, Card, PageHeader } from '../ui/primitives.jsx';
import { Icon } from '../ui/Icon.jsx';

const RULES = [
  ['At least 8 characters', (p) => p.length >= 8],
  ['An uppercase letter', (p) => /[A-Z]/.test(p)],
  ['A lowercase letter', (p) => /[a-z]/.test(p)],
  ['A number', (p) => /\d/.test(p)],
];

export default function ChangePassword() {
  usePageTitle('Change password');
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [done, setDone] = useState(false);
  const save = useMutation(AuthModel.changePassword);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const err = save.fieldErrors;

  async function submit(e) {
    e.preventDefault();
    if (await save.run(form)) { toast.success('Password changed. Other devices were signed out.'); setDone(true); setForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }
  }

  return (
    <>
      <PageHeader title="Change Password" crumbs={['General', 'Change Password']} />
      <div className="grid grid--2">
        <Card>
          <form className="stack form-narrow" onSubmit={submit} noValidate>
            {done && <Alert kind="ok" title="Password updated" />}
            {save.error && !save.error.details && <Alert kind="bad">{save.error.message}</Alert>}
            <PasswordField label="Current Password:" value={form.currentPassword} onChange={set('currentPassword')} error={err.currentPassword} autoComplete="current-password" required />
            <PasswordField label="New Password:" value={form.newPassword} onChange={set('newPassword')} error={err.newPassword} autoComplete="new-password" required />
            <PasswordField label="Confirm Password:" value={form.confirmPassword} onChange={set('confirmPassword')} error={err.confirmPassword} autoComplete="new-password" required />
            <div className="center"><Button type="submit" loading={save.busy}>Save</Button></div>
          </form>
        </Card>
        <Card aria-labelledby="h-rules" className="only-sunlight">
          <h2 id="h-rules">Your new password needs</h2>
          <ul className="list" aria-live="polite">
            {RULES.map(([label, test]) => {
              const ok = test(form.newPassword);
              return <li key={label}><span className="cluster" style={{ '--gap': '8px' }}><Icon name={ok ? 'check' : 'x'} />{label}</span><span className={ok ? 'badge badge--ok' : 'badge badge--neutral'}>{ok ? 'Done' : 'Needed'}</span></li>;
            })}
          </ul>
        </Card>
      </div>
    </>
  );
}
