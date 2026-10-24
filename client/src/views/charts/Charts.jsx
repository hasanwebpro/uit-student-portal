/**
 * Hand-rolled SVG charts (≈2 KB vs. ~150 KB for a chart library). Each ships a visually-hidden data table,
 * so the numbers are available to screen readers and the chart is never the only source of truth.
 */
export function TrendChart({ points, title, maxY = 4 }) {
  if (!points.length) return null;
  // Zoom the axis to the data (in 0.5 steps) so small term-to-term movement is visible, but never lie about the 4.0 ceiling.
  const lowest = Math.min(...points.flatMap((p) => [p.gpa, p.cgpa]));
  const minY = Math.max(0, Math.floor((lowest - 0.3) * 2) / 2);
  const W = 560; const H = 260; const P = { l: 40, r: 16, t: 16, b: 44 };
  const x = (i) => P.l + (points.length === 1 ? (W - P.l - P.r) / 2 : (i * (W - P.l - P.r)) / (points.length - 1));
  const y = (v) => P.t + (1 - (v - minY) / (maxY - minY)) * (H - P.t - P.b);
  const path = (key) => points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(' ');
  const ticks = Array.from({ length: Math.round((maxY - minY) / 0.5) + 1 }, (_, i) => minY + i * 0.5);

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="trend-title trend-desc">
        <title id="trend-title">{title}</title>
        <desc id="trend-desc">{`Line chart of GPA and cumulative GPA over ${points.length} terms. Latest GPA ${points.at(-1).gpa}, CGPA ${points.at(-1).cgpa}.`}</desc>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} className="chart__grid" />
            <text x={P.l - 8} y={y(t) + 5} textAnchor="end" className="chart__tick">{t.toFixed(1)}</text>
          </g>
        ))}
        <path d={path('cgpa')} className="chart__line chart__line--cgpa" />
        <path d={path('gpa')} className="chart__line chart__line--gpa" />
        {points.map((p, i) => (
          <g key={p.session}>
            <circle cx={x(i)} cy={y(p.gpa)} r="6" className="chart__dot chart__dot--gpa" />
            <rect x={x(i) - 5} y={y(p.cgpa) - 5} width="10" height="10" className="chart__dot chart__dot--cgpa" />
            <text x={x(i)} y={H - 22} textAnchor="middle" className="chart__tick">{p.session.replace(/\s\d{2}(\d{2})$/, " ’$1")}</text>
          </g>
        ))}
      </svg>
      <figcaption className="chart__legend">
        <span><svg className="chart__swatch" width="34" height="12" aria-hidden="true"><line x1="0" y1="6" x2="34" y2="6" className="chart__line chart__line--gpa" /></svg> Term GPA</span>
        <span><svg className="chart__swatch" width="34" height="12" aria-hidden="true"><line x1="0" y1="6" x2="34" y2="6" className="chart__line chart__line--cgpa" /></svg> Cumulative GPA</span>
      </figcaption>
      <table className="visually-hidden">
        <caption>{title}</caption>
        <thead><tr><th scope="col">Term</th><th scope="col">GPA</th><th scope="col">CGPA</th></tr></thead>
        <tbody>{points.map((p) => <tr key={p.session}><th scope="row">{p.session}</th><td>{p.gpa}</td><td>{p.cgpa}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

export function Donut({ value, label, sub }) {
  const R = 52; const C = 2 * Math.PI * R;
  return (
    <figure className="donut">
      <svg viewBox="0 0 140 140" role="img" aria-label={`${label}: ${value} percent`}>
        <circle cx="70" cy="70" r={R} className="donut__track" />
        <circle cx="70" cy="70" r={R} className="donut__fill" strokeDasharray={`${(C * value) / 100} ${C}`} transform="rotate(-90 70 70)" />
        <text x="70" y="68" textAnchor="middle" className="donut__value">{value}%</text>
        <text x="70" y="90" textAnchor="middle" className="donut__sub">{sub}</text>
      </svg>
    </figure>
  );
}

/** Attendance % per course as horizontal bars with the value printed on each bar (and a hidden data table). */
export function AttendanceBars({ rows, title }) {
  if (!rows.length) return null;
  const rowH = 34; const H = rows.length * rowH + 8; const W = 460; const L = 110;
  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
        <title>{title}</title>
        {rows.map((r, i) => {
          const y = 4 + i * rowH; const w = Math.max(2, ((W - L - 44) * r.percentage) / 100);
          return (
            <g key={r.code}>
              <text x={L - 8} y={y + 18} textAnchor="end" className="chart__tick">{r.code}</text>
              <rect x={L} y={y + 4} width={W - L - 44} height="18" rx="4" className="chart__track" />
              <rect x={L} y={y + 4} width={w} height="18" rx="4" className={`chart__bar chart__bar--${r.level === 'good' ? 'ok' : r.level}`} />
              <text x={W} y={y + 18} textAnchor="end" className="chart__tick chart__tick--strong">{r.percentage}%</text>
            </g>
          );
        })}
      </svg>
      <table className="visually-hidden">
        <caption>{title}</caption>
        <thead><tr><th scope="col">Course</th><th scope="col">Attendance</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.code}><th scope="row">{r.code}</th><td>{r.percentage}%</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
