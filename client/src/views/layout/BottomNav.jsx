import { NavLink } from 'react-router-dom';
import { BOTTOM_NAV } from '../../models/navigation.js';
import { Icon } from '../ui/Icon.jsx';

/** Thumb-reach navigation for phones: the four most-used pages plus a "Menu" button that opens the full drawer. */
export function BottomNav({ onMenu, menuOpen }) {
  return (
    <nav className="bottomnav" aria-label="Quick links">
      {BOTTOM_NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end}><Icon name={n.icon} />{n.label}</NavLink>)}
      <button type="button" onClick={onMenu} aria-expanded={menuOpen} aria-controls="site-nav"><Icon name="menu" />Menu</button>
    </nav>
  );
}
