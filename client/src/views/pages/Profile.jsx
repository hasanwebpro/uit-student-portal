import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../controllers/AuthContext.jsx';
import { useMutation } from '../../controllers/useMutation.js';
import { useQuery } from '../../controllers/useQuery.js';
import { useToast } from '../../controllers/ToastContext.jsx';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { ProfileModel } from '../../models/portal.js';
import { formatDashDate } from '../../models/format.js';
import { Async } from '../ui/Async.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { CheckField, SelectField, TextField } from '../ui/Fields.jsx';
import { Alert, Button, Card, PageHeader } from '../ui/primitives.jsx';

const EDITABLE = ['tax', 'guardian', 'address', 'personal'];
const MAX_SIDE = 256;

/** Shrinks any chosen photo to ≤256px JPEG (a few KB) in the browser before it is uploaded. */
async function toSmallJpeg(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process that image.'))), 'image/jpeg', 0.85));
}

function UserImage({ student }) {
  const toast = useToast();
  const { refresh } = useAuth();
  const input = useRef(null);
  const [chosen, setChosen] = useState(null);
  const [error, setError] = useState('');
  const upload = useMutation(async (file) => { await ProfileModel.uploadAvatar(await toSmallJpeg(file)); await refresh(); });
  const remove = useMutation(async () => { await ProfileModel.removeAvatar(); await refresh(); });

  function pick(e) {
    const file = e.target.files?.[0];
    setError('');
    if (!file) return setChosen(null);
    if (!/^image\//.test(file.type)) { setError('Please choose an image file (JPEG or PNG).'); setChosen(null); return; }
    if (file.size > 8 * 1024 * 1024) { setError('That image is larger than 8 MB.'); setChosen(null); return; }
    setChosen(file);
  }
  async function send() {
    if (await upload.run(chosen)) { toast.success('Profile picture updated.'); setChosen(null); if (input.current) input.current.value = ''; }
  }
  return (
    <div className="cluster" style={{ alignItems: 'flex-start', '--gap': '20px' }}>
      <Avatar student={student} size={96} letterOnly={false} />
      <div className="stack grow" style={{ '--gap': '10px' }}>
        <TextField ref={input} type="file" label="Profile Picture" accept="image/jpeg,image/png" onChange={pick} error={error || upload.error?.message} hint="JPEG or PNG. It is resized to a small square for you." />
        <div className="cluster">
          <Button variant="secondary" disabled={!chosen} loading={upload.busy} icon="upload" onClick={send}>Upload</Button>
          {student.hasAvatar && <Button variant="quiet" icon="trash" loading={remove.busy} onClick={async () => { if (await remove.run()) toast.success('Profile picture removed.'); }}>Remove picture</Button>}
        </div>
      </div>
    </div>
  );
}

function Form({ data, onSaved }) {
  const toast = useToast();
  const { student } = useAuth();
  const [form, setForm] = useState(() => Object.fromEntries(EDITABLE.map((k) => [k, data[k]])));
  const save = useMutation(ProfileModel.save);
  const err = save.fieldErrors;
  const { identity } = data;

  useEffect(() => { setForm(Object.fromEntries(EDITABLE.map((k) => [k, data[k]]))); }, [data]);

  const set = (group, key) => (e) => setForm((f) => ({ ...f, [group]: { ...f[group], [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value } }));
  const sameAddress = form.address.permanent !== '' && form.address.permanent === form.address.present;
  const toggleSame = (e) => setForm((f) => ({ ...f, address: { ...f.address, present: e.target.checked ? f.address.permanent : '' } }));

  async function submit(e) {
    e.preventDefault();
    const body = { ...form, personal: { cell: form.personal.cell, personalEmail: form.personal.personalEmail, cnic: form.personal.cnic } };
    if (await save.run(body)) { toast.success('Profile saved.'); onSaved(); }
  }
  const field = (group, key, label, extra = {}) => (
    <TextField label={label} value={form[group][key] ?? ''} onChange={set(group, key)} error={err[`${group}.${key}`]} {...extra} />
  );
  const errorCount = Object.keys(err).length;
  const ro = (label, value) => <div className="field"><span className="label">{label}</span><span>{value}</span></div>;

  return (
    <form className="stack stack--lg" onSubmit={submit} noValidate>
      {errorCount > 0 && <Alert kind="bad" title={`Please fix ${errorCount} ${errorCount === 1 ? 'field' : 'fields'}`}>Check the highlighted fields below.</Alert>}
      {save.error && errorCount === 0 && <Alert kind="bad">{save.error.message}</Alert>}

      <Card aria-labelledby="h-id">
        <h2 id="h-id" className="profile-title">Student Information: {identity.program.replace(/ - /g, '-')}</h2>
        <div className="form-grid profile-facts">
          {ro('First Name:', identity.fullName)}{ro('Registration No:', identity.regNo)}{ro('Date Of Birth:', formatDashDate(identity.dob))}
          {ro('NIC #:', identity.nic)}{ro('Gender:', identity.gender)}
        </div>
        <p className="hint">These details are managed by the university. Contact the Registrar Office to change them.</p>
      </Card>

      <Card aria-labelledby="h-tax"><h2 id="h-tax" className="profile-title">Tax Information</h2>
        <div className="form-grid">
          {field('tax', 'payeeName', 'Tax Payee Name:', { required: true, placeholder: 'Tax Payee Name', hint: 'Please enter your Tax Payee Name' })}
          {field('tax', 'payeeNic', 'Tax Payee:', { required: true, inputMode: 'numeric', placeholder: 'Tax Payee NIC', hint: 'Please enter your Tax Payee NIC' })}
          <div className="field"><span className="label">Self Payee:</span><CheckField label={<span className="visually-hidden">Self payee</span>} checked={form.tax.selfPayee} onChange={set('tax', 'selfPayee')} /></div>
          {field('tax', 'ntn', 'NTN Number:', { required: true, placeholder: 'NTN Number', hint: 'Please enter your NTN Number' })}
          <div className="field"><span className="label">Is Filer:</span><CheckField label={<span className="visually-hidden">Is filer</span>} checked={form.tax.isFiler} onChange={set('tax', 'isFiler')} /></div>
        </div>
      </Card>

      <Card aria-labelledby="h-guardian"><h2 id="h-guardian" className="profile-title">Guardian Information</h2>
        <div className="form-grid">
          <SelectField label="Relation:" value={form.guardian.relation} onChange={set('guardian', 'relation')} error={err['guardian.relation']} required>
            {['Father', 'Mother', 'Brother', 'Sister', 'Uncle', 'Other'].map((r) => <option key={r}>{r}</option>)}
          </SelectField>
          {field('guardian', 'name', 'Guardian Name:', { required: true })}
          {field('guardian', 'occupation', 'Occupation:')}
          {field('guardian', 'cell', 'Cell#:', { type: 'tel', required: true, hint: 'Please enter Cell Number' })}
          {field('guardian', 'cnic', 'CNIC/NICOP/NTN #:', { required: true, inputMode: 'numeric', hint: 'Please enter CNIC/NICOP/NTN # Number' })}
          {field('guardian', 'email', 'Email:', { type: 'email', required: true, inputMode: 'email', hint: 'Please enter Email' })}
        </div>
      </Card>

      <Card aria-labelledby="h-address"><h2 id="h-address" className="profile-title">Residential Address</h2>
        <div className="form-grid">
          {field('address', 'permanent', 'Permanent Address:', { required: true, autoComplete: 'street-address', hint: 'Please enter your Permanent Address' })}
          {field('address', 'present', 'Present Address:', { required: true, hint: 'Please enter your Present Address' })}
          <div className="field"><span className="label" aria-hidden="true">&nbsp;</span><CheckField label="Present address is same as permanent address" checked={sameAddress} onChange={toggleSame} /></div>
        </div>
      </Card>

      <Card aria-labelledby="h-personal"><h2 id="h-personal" className="profile-title">Personal Information</h2>
        <div className="form-grid">
          {field('personal', 'cell', 'Cell#:', { type: 'tel', autoComplete: 'tel', required: true, placeholder: '+92 300 1234567', hint: 'Please enter your Cell Number' })}
          {field('personal', 'personalEmail', 'Personal Email:', { type: 'email', autoComplete: 'email', required: true, inputMode: 'email', hint: 'Please enter your Personal Email' })}
          {ro('Official Email:', data.personal.officialEmail)}
          {field('personal', 'cnic', 'CNIC #:', { required: true, inputMode: 'numeric', hint: 'Please enter your CNIC Number' })}
        </div>
      </Card>

      <Card aria-labelledby="h-image"><h2 id="h-image" className="profile-title">User Image</h2><UserImage student={student} /></Card>

      <div className="center"><Button type="submit" loading={save.busy}>Save</Button></div>
    </form>
  );
}

export default function Profile() {
  usePageTitle('My profile');
  const query = useQuery('profile', ProfileModel.get);
  return (
    <>
      <PageHeader title="My Profile" crumbs={['More', 'My Profile']} />
      <Async query={query}>{(data) => <Form data={data} onSaved={query.refetch} />}</Async>
    </>
  );
}
