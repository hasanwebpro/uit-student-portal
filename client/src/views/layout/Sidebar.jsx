import { useEffect, useId, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { NAV } from '../../models/navigation.js';
import { DuoIcon } from '../ui/DuoIcon.jsx';

function Group({ item, active, onNavigate }) {
  const [open, setOpen] = useState(active);
  const panelId = useId();
  useEffect(() => { if (active) setOpen(true); }, [active]);          // keep the active group open after navigating
  return (
    <li className="nav__group" data-active={active} data-open={open}>
      <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}>
        <span className="menu-icon"><DuoIcon name={item.icon} /></span>
        <span className="menu-text">{item.label}</span>
        <DuoIcon name="angleRight" className="menu-arrow" />
      </button>
      <ul id={panelId} className="nav__sub" hidden={!open}>
        {item.children.map((c) => <li key={c.to}><NavLink className="nav__link" to={c.to} onClick={onNavigate}><span className="menu-text">{c.label}</span></NavLink></li>)}
      </ul>
    </li>
  );
}

export function Sidebar({ open, collapsed, onToggleCollapse, onNavigate }) {
  const { pathname } = useLocation();
  // A collapsed sidebar "peeks" open only on a *fresh* mouse-enter or keyboard focus — never right after the collapse click itself.
  const [peek, setPeek] = useState(false);
  return (
    <aside className="sidebar" data-open={open} data-peek={peek} id="site-nav" aria-label="Main"
      onMouseEnter={() => setPeek(true)} onMouseLeave={() => setPeek(false)}
      onFocus={(e) => { if (e.target.matches(':focus-visible')) setPeek(true); }}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setPeek(false); }}>
      <div className="brand">
        <Link to="/" className="brand-logo" onClick={onNavigate} aria-label="UIT University — Student Portal home">
          <img src="/images/uit-logo.png" alt="" width="180" height="50" />
        </Link>
        <button type="button" className="brand-toggle" aria-pressed={collapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => { setPeek(false); onToggleCollapse(); }}>
          <DuoIcon name="angleLeft" />
        </button>
      </div>
      <nav className="nav-wrap" aria-label="Student portal">
        <ul className="nav">
          {NAV.filter((n) => n.label !== 'More').map((item) => item.children
            ? <Group key={item.label} item={item} active={item.children.some((c) => c.to === pathname)} onNavigate={onNavigate} />
            : <li key={item.to}><NavLink className="nav__link" to={item.to} end={item.end} onClick={onNavigate}><span className="menu-icon"><DuoIcon name={item.icon} /></span><span className="menu-text">{item.label}</span></NavLink></li>)}
        </ul>
      </nav>
    </aside>
  );
}
