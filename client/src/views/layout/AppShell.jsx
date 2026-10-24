import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../controllers/AuthContext.jsx';
import { useTheme } from '../../controllers/useTheme.js';
import { useToast } from '../../controllers/ToastContext.jsx';
import { store } from '../../models/format.js';
import { titleFor } from '../../models/navigation.js';
import { Icon } from '../ui/Icon.jsx';
import { DuoIcon } from '../ui/DuoIcon.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { Sidebar } from './Sidebar.jsx';
import { BottomNav } from './BottomNav.jsx';
import { UserPanel } from './UserPanel.jsx';

const todayShort = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function Subheader({ pathname, student }) {
  const dashboard = pathname === '/';
  const title = dashboard ? 'Dashboard' : (titleFor(pathname) ?? 'Student Portal');
  return (
    <section className="subheader" aria-label="Page header">
      <p className="subheader__title">{title}</p>
      {dashboard ? (
        <>
          <span className="subheader__sep" aria-hidden="true" />
          <p className="subheader__info">My ID: {student.regNo} My Enrollment No.: {student.enrollmentNo} My Section: {student.section}</p>
          <span className="today-pill">Today <strong>{todayShort()}</strong></span>
        </>
      ) : (
        <ol className="crumbs" aria-label="Breadcrumb">
          <li><Link to="/">Dashboard</Link></li>
          <li aria-current="page">{title}</li>
        </ol>
      )}
    </section>
  );
}

export function AppShell() {
  const { student, logout } = useAuth();
  const toast = useToast();
  const theme = useTheme();
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState(false);
  const [panel, setPanel] = useState(false);
  const [collapsed, setCollapsed] = useState(() => store.get('uit-collapsed') === '1');
  const mainRef = useRef(null);
  const menuBtn = useRef(null);
  const first = useRef(true);

  const closeDrawer = useCallback(() => setDrawer(false), []);
  const toggleCollapse = () => setCollapsed((c) => { store.set('uit-collapsed', c ? '0' : '1'); return !c; });

  // Route change: close the drawer, and move focus to the new page's heading so assistive tech announces it.
  useEffect(() => {
    setDrawer(false);
    if (first.current) { first.current = false; return; }
    const target = mainRef.current?.querySelector('[data-page-heading]') ?? mainRef.current;
    target?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [pathname]);

  // While the mobile drawer is open: Esc closes it, the page behind is inert, and focus returns to the menu button.
  useEffect(() => {
    const main = mainRef.current;
    if (!drawer) { main?.removeAttribute('inert'); return undefined; }
    main?.setAttribute('inert', '');
    const onKey = (e) => { if (e.key === 'Escape') { setDrawer(false); menuBtn.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    document.querySelector('#site-nav a, #site-nav button:not(.brand-toggle)')?.focus();
    return () => { document.removeEventListener('keydown', onKey); main?.removeAttribute('inert'); };
  }, [drawer]);

  const signOut = async () => { setPanel(false); await logout(); toast.success('You have been signed out.'); };

  return (
    <div className="app" data-collapsed={collapsed}>
      <a href="#main" className="skip-link">Skip to main content</a>
      <Sidebar open={drawer} collapsed={collapsed} onToggleCollapse={toggleCollapse} onNavigate={closeDrawer} />
      {drawer && <div className="scrim" onClick={closeDrawer} aria-hidden="true" />}

      <div className="wrapper">
        <header className="topbar">
          <button type="button" ref={menuBtn} className="icon-btn menu-btn" aria-label="Open menu" aria-expanded={drawer} aria-controls="site-nav" onClick={() => setDrawer(true)}><Icon name="menu" /></button>
          <p className="topbar__title">{titleFor(pathname) ?? 'Student Portal'}</p>
          <span className="topbar__spacer" />
          <button type="button" className="icon-btn" aria-pressed={theme.sunlight} onClick={theme.toggle}
            aria-label={theme.sunlight ? 'Sunlight mode is on. Switch back to the classic look' : 'Turn on sunlight mode: high contrast and larger text'} title="Sunlight mode">
            <Icon name="contrast" />
          </button>
          <DuoIcon name="bars" className="topbar__chart icon hide-sm" />
          <button type="button" className="user-btn" aria-haspopup="dialog" aria-expanded={panel} onClick={() => setPanel(true)}>
            <span className="welcome">Welcome, <strong>{student.fullName} | {student.regNo}</strong></span>
            <Avatar student={student} />
            <span className="visually-hidden">Open account panel for {student.fullName}</span>
          </button>
        </header>

        <Subheader pathname={pathname} student={student} />

        <main id="main" ref={mainRef} className="main" tabIndex={-1}><Outlet /></main>
        <footer className="footer">eDU SMARTZ</footer>
      </div>

      <BottomNav onMenu={() => setDrawer(true)} menuOpen={drawer} />
      <UserPanel open={panel} onClose={() => setPanel(false)} student={student} sunlight={theme.sunlight} onToggleTheme={theme.toggle} onSignOut={signOut} />
    </div>
  );
}
