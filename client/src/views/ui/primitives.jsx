import { Icon } from './Icon.jsx';

export const Card = ({ children, className = '', as: Tag = 'section', ...rest }) => <Tag className={`card ${className}`} {...rest}>{children}</Tag>;

export function PageHeader({ title, crumbs = [], actions, children }) {
  return (
    <header className="page-head page-head--shell">
      {crumbs.length > 0 && <p className="crumbs-inline">{crumbs.join(' › ')}</p>}
      <div className="page-head__row">
        <h1 data-page-heading tabIndex={-1}>{title}</h1>
        {actions && <div className="page-head__actions no-print">{actions}</div>}
      </div>
      {children && <p className="muted">{children}</p>}
    </header>
  );
}

export function Alert({ kind = 'info', title, children, icon, ...rest }) {
  const role = kind === 'bad' ? 'alert' : 'status';
  return (
    <div className={`alert alert--${kind}`} role={role} {...rest}>
      <Icon name={icon ?? (kind === 'bad' || kind === 'warn' ? 'alert' : kind === 'ok' ? 'check' : 'info')} />
      <div>{title && <strong>{title}</strong>}{title && children ? <br /> : null}{children}</div>
    </div>
  );
}

/** Status is always conveyed by text (and an icon for risk) — never by colour alone. */
export const Badge = ({ kind = 'neutral', children }) => <span className={`badge badge--${kind}`}>{children}</span>;

export function StatTile({ label, value, note, tone = 'blue', icon }) {
  return (
    <div className={`stat stat--${tone}`}>
      <div className="stat__label">{icon && <Icon name={icon} />}{label}</div>
      <div className="stat__value">{value}</div>
      {note && <div className="stat__note">{note}</div>}
    </div>
  );
}

export const Meter = ({ value, level = 'info', label }) => (
  <div className={`meter meter--${level}`} role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
    <span style={{ '--value': `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

export const EmptyState = ({ icon = 'info', title, children }) => (
  <div className="empty"><Icon name={icon} /><strong>{title}</strong>{children && <p>{children}</p>}</div>
);

export const Spinner = ({ label = 'Loading' }) => <span role="status"><span className="spinner" aria-hidden="true" /><span className="visually-hidden">{label}</span></span>;

export function Button({ children, variant = 'primary', loading = false, icon, type = 'button', className = '', ...rest }) {
  const v = variant === 'primary' ? '' : `btn--${variant}`;
  return (
    <button type={type} className={`btn ${v} ${className}`} aria-busy={loading || undefined} disabled={loading || rest.disabled} {...rest}>
      {loading ? <span className="spinner" aria-hidden="true" /> : icon && <Icon name={icon} />}{children}
    </button>
  );
}
