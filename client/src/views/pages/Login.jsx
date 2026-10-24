import { useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../controllers/AuthContext.jsx';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { Dialog } from '../ui/Dialog.jsx';
import { PasswordField, TextField, CheckField } from '../ui/Fields.jsx';
import { Alert, Button } from '../ui/primitives.jsx';

const PHOTOS = ['aca1', 'aca2', 'aca3', 'aca4'];

export default function Login() {
  usePageTitle('Sign in');
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from ?? '/';
  const [form, setForm] = useState({ regNo: '', password: '', remember: false });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const errorRef = useRef(null);

  if (status === 'authed') return <Navigate to={from} replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const next = {};
    if (!form.regNo.trim()) next.regNo = 'Enter your registration number, e.g. 23FA-001-SE.';
    if (!form.password) next.password = 'Enter your password.';
    setErrors(next); setFormError('');
    if (Object.keys(next).length) { document.getElementById(next.regNo ? 'login-reg' : 'login-pw')?.focus(); return; }

    setBusy(true);
    try {
      await login(form.regNo.trim(), form.password, form.remember);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err.message);
      setBusy(false);
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }

  return (
    <div className="login">
      <main className="login__panel" id="main">
        <div className="login__card">
          <div className="login__brand">
            <img src="/images/uit-seal.png" alt="UIT University" width="150" height="150" />
            <h1>STUDENT PORTAL</h1>
            <p>Enter your Registration No and Password</p>
          </div>

          {formError && <div ref={errorRef} tabIndex={-1}><Alert kind="bad" title="Could not sign you in">{formError}</Alert></div>}

          <form className="login__form" onSubmit={submit} noValidate>
            <div className="login__field">
              <TextField id="login-reg" label="Registration No" name="regNo" value={form.regNo} onChange={set('regNo')} error={errors.regNo}
                autoComplete="username" autoCapitalize="characters" spellCheck={false} placeholder="Registration No" required />
            </div>
            <div className="login__field">
              <PasswordField id="login-pw" label="Password" name="password" value={form.password} onChange={set('password')} error={errors.password}
                autoComplete="current-password" placeholder="Password" required />
            </div>
            <div className="login__row">
              <CheckField label="Remember me" checked={form.remember} onChange={set('remember')} />
              <button type="button" className="link" onClick={() => setForgot(true)}>Forgot your password?</button>
            </div>
            <div className="login__submit"><Button type="submit" loading={busy}>Sign In</Button></div>
          </form>

          <details className="card">
            <summary><strong>Trying the demo?</strong></summary>
            <p className="small">This build uses fictional data.<br />Registration no: <code>23FA-001-SE</code><br />Password: <code>Portal@2026</code></p>
          </details>
        </div>
      </main>

      <div className="login__aside" aria-hidden="true">
        {PHOTOS.map((p) => <img key={p} src={`/images/login-${p}.webp`} alt="" loading={p === 'aca1' ? 'eager' : 'lazy'} />)}
      </div>

      <Dialog open={forgot} onClose={() => setForgot(false)} title="Forgot your password?">
        <p>For security, passwords are reset by the university. Please contact the <strong>IT Helpdesk</strong> or the <strong>Registrar Office</strong> with your registration number and CNIC, and they will issue a new temporary password.</p>
      </Dialog>
    </div>
  );
}
