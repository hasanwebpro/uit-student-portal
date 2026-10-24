/** Small inline icon set (24×24, stroke-based, inherits currentColor). Decorative by default. */
const PATHS = {
  home: 'M3 11.5 12 4l9 7.5M5 10v10h5v-6h4v6h5V10',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Zm0 14V5M8 7h7',
  file: 'M6 3h9l4 4v14H6V3Zm9 0v4h4M9 12h6M9 16h6',
  wallet: 'M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2Zm13 6h3',
  list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  clipboard: 'M9 4h6v3H9V4Zm-2 1H5v16h14V5h-2M8 12l2.5 2.5L16 9',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0',
  check: 'M5 13l4 4L19 7',
  calendar: 'M4 6h16v14H4V6Zm0 5h16M8 3v4m8-4v4',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3 2',
  menu: 'M4 6h16M4 12h16M4 18h16',
  x: 'M6 6l12 12M18 6 6 18',
  chevron: 'M6 9l6 6 6-6',
  logout: 'M10 4H5v16h5M15 8l4 4-4 4M19 12H9',
  lock: 'M6 11h12v9H6v-9Zm2 0V8a4 4 0 0 1 8 0v3',
  print: 'M7 9V3h10v6M7 17H5v-6h14v6h-2M7 14h10v7H7v-7Z',
  alert: 'M12 3 2 20h20L12 3Zm0 6v5m0 3h.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-10v6m0-9h.01',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  mail: 'M3 6h18v12H3V6Zm0 0 9 7 9-7',
  send: 'm21 3-9 18-2-8-8-2 19-8ZM10 13l11-10',
  trash: 'M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13',
  edit: 'M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4',
  plus: 'M12 5v14M5 12h14',
  award: 'M12 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm-4 0-1 8 5-3 5 3-1-8',
  chart: 'M4 20V4m0 16h16M8 16v-5m4 5V8m4 8v-8',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14',
  contrast: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-18v18',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2Zm4 4a2 2 0 0 0 4 0',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 5 5',
  download: 'M12 4v12m-5-5 5 5 5-5M5 20h14',
  upload: 'M12 16V4m-5 5 5-5 5 5M5 20h14',
  refresh: 'M20 11a8 8 0 1 0-2 5.3M20 4v7h-7',
  star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3Z',
};

export function Icon({ name, label, className = 'icon', ...rest }) {
  const d = PATHS[name] ?? PATHS.info;
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false" {...rest}>
      <path d={d} />
    </svg>
  );
}
