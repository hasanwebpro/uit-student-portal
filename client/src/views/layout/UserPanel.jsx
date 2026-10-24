import { Link } from 'react-router-dom';
import { Dialog } from '../ui/Dialog.jsx';
import { Button } from '../ui/primitives.jsx';
import { DuoIcon } from '../ui/DuoIcon.jsx';
import { Avatar } from '../ui/Avatar.jsx';

const LINKS = [
  ['/profile', 'user', 'primary', 'My Profile', 'Account settings and more'],
  ['/communicator', 'mail', 'success', 'My Messages', 'Inbox and tasks'],
  ['/activity', 'clock', 'warning', 'My Activities', 'Logs and notifications'],
  ['/general/todo', 'tasks', 'danger', 'My Tasks', 'Latest tasks and projects'],
  ['/general/password', 'lock', 'info', 'Change Password', 'Update your sign-in password'],
];

/** The original portal's "quick user" slide-over: profile shortcuts, theme switch and sign-out. */
export function UserPanel({ open, onClose, student, sunlight, onToggleTheme, onSignOut }) {
  return (
    <Dialog open={open} onClose={onClose} title="User profile" variant="panel" footer={null}>
      <div className="user-card">
        <Avatar student={student} size={50} />
        <div><strong>{student.fullName}</strong><span className="muted">{student.regNo}</span></div>
      </div>
      <div className="stack" style={{ '--gap': '0px' }}>
        {LINKS.map(([to, icon, tone, title, sub]) => (
          <Link key={to} to={to} className="panel-link" onClick={onClose}>
            <span className={`symbol symbol--${tone}`}><DuoIcon name={icon} /></span>
            <span><strong>{title}</strong><span>{sub}</span></span>
          </Link>
        ))}
      </div>
      <div className="stack" style={{ marginTop: 20 }}>
        <label className="check">
          <input type="checkbox" checked={sunlight} onChange={onToggleTheme} />
          <span>Sunlight mode <span className="muted small">— high contrast, larger text</span></span>
        </label>
        <Button variant="secondary" icon="logout" onClick={onSignOut}>Sign out</Button>
      </div>
    </Dialog>
  );
}
