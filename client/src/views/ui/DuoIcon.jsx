/**
 * Two-tone menu/symbol icons (a 30%-opacity fill plus a solid stroke) in the style of the original portal's
 * Stockholm icon set. Drawn from scratch; inherit currentColor so they follow the theme.
 */
const SHAPES = {
  layers: (<><path d="M12 3 3 8l9 5 9-5-9-5Z" fill="currentColor" opacity=".3" /><path d="M12 3 3 8l9 5 9-5-9-5ZM3 12.5l9 5 9-5M3 16.5l9 5 9-5" /></>),
  book: (<><path d="M3 5h8v15H3zM13 5h8v15h-8z" fill="currentColor" opacity=".3" /><path d="M3 5h8v15H3zM13 5h8v15h-8zM6 9h2M6 12.5h2M16 9h2M16 12.5h2" /></>),
  exam: (<><path d="M5 3h10l4 4v14H5z" fill="currentColor" opacity=".3" /><path d="M5 3h10l4 4v14H5zM15 3v4h4M8 12h8M8 16h5" /></>),
  money: (<><path d="M3 7h18v11H3z" fill="currentColor" opacity=".3" /><path d="M3 7h18v11H3zM12 9.5v6M14 11h-3a1.2 1.2 0 0 0 0 2.4h2a1.2 1.2 0 0 1 0 2.4h-3" /></>),
  list: (<><path d="M9 5h12v3H9zM9 10.5h12v3H9zM9 16h12v3H9z" fill="currentColor" opacity=".3" /><path d="M9 6.5h12M9 12h12M9 17.5h12M4 6.5h.01M4 12h.01M4 17.5h.01" /></>),
  laptop: (<><path d="M5 5h14v10H5z" fill="currentColor" opacity=".3" /><path d="M5 5h14v10H5zM2 19h20M9 10l2 2 4-4" /></>),
  bars: (<><rect x="3" y="12" width="4" height="8" rx="1" fill="currentColor" stroke="none" /><rect x="10" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" opacity=".45" /><rect x="17" y="9" width="4" height="11" rx="1" fill="currentColor" stroke="none" /></>),
  angleLeft: <path d="M11 7l-5 5 5 5M18 7l-5 5 5 5" />,
  angleRight: <path d="M9 6l6 6-6 6" />,
  toggle: (<><rect x="3" y="4" width="18" height="7" rx="3.5" fill="currentColor" opacity=".3" stroke="none" /><circle cx="17" cy="7.5" r="2" fill="currentColor" stroke="none" /><rect x="3" y="13" width="18" height="7" rx="3.5" /><circle cx="7" cy="16.5" r="2" fill="currentColor" stroke="none" /></>),
  library: (<><path d="M4 4h4v16H4zM10 4h4v16h-4z" fill="currentColor" opacity=".3" /><path d="M4 4h4v16H4zM10 4h4v16h-4zM16 6l4 1-3 13-4-1" /></>),
  pencil: (<><path d="M4 20h4L19 9l-4-4L4 16z" fill="currentColor" opacity=".3" /><path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4" /></>),
  program: (<><path d="M3 6h18v12H3z" fill="currentColor" opacity=".3" /><path d="M3 6h18v12H3zM7 10h6M7 14h10" /></>),
  tag: (<><path d="M3 12V4h8l10 10-8 8z" fill="currentColor" opacity=".3" /><path d="M3 12V4h8l10 10-8 8zM7.5 8h.01" /></>),
  shield: (<><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" fill="currentColor" opacity=".3" /><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4" /></>),
  adduser: (<><circle cx="9" cy="8" r="4" fill="currentColor" opacity=".3" /><path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M19 8v6M16 11h6" /></>),
  mail: (<><path d="M3 6h18v12H3z" fill="currentColor" opacity=".3" /><path d="M3 6h18v12H3zM3 6l9 7 9-7" /></>),
  clock: (<><circle cx="12" cy="12" r="9" fill="currentColor" opacity=".3" /><path d="M12 7v5l3 2" /></>),
  tasks: (<><path d="M5 4h14v17H5z" fill="currentColor" opacity=".3" /><path d="M5 4h14v17H5zM9 9l1.5 1.5L14 7M9 15h6" /></>),
  lock: (<><path d="M5 11h14v10H5z" fill="currentColor" opacity=".3" /><path d="M5 11h14v10H5zM8 11V8a4 4 0 0 1 8 0v3" /></>),
  user: (<><circle cx="12" cy="8" r="4" fill="currentColor" opacity=".3" /><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" /></>),
};

export function DuoIcon({ name, className = 'icon', label }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
      {SHAPES[name] ?? SHAPES.layers}
    </svg>
  );
}
