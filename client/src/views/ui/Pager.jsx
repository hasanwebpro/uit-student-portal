import { useId } from 'react';
import { Icon } from './Icon.jsx';

/** Client-side paging in the style of the original's grid footer: « ‹ 1 2 3 › » · Page size · "N items in P pages". */
export function usePaging(rows, initialSize = 10) {
  return { slice: (page, size) => rows.slice((page - 1) * size, page * size), pages: (size) => Math.max(1, Math.ceil(rows.length / size)), total: rows.length, initialSize };
}

export function Pager({ page, size, total, onPage, onSize, sizes = [10, 20, 50, 100] }) {
  const id = useId();
  const pages = Math.max(1, Math.ceil(total / size));
  const go = (p) => onPage(Math.min(pages, Math.max(1, p)));
  const window = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === pages);
  return (
    <div className="grid-footer" role="navigation" aria-label="Pagination">
      <div className="cluster" style={{ '--gap': '4px' }}>
        <button type="button" className="pg" onClick={() => go(1)} disabled={page === 1} aria-label="First page"><Icon name="chevron" className="icon pg-first" /></button>
        <button type="button" className="pg" onClick={() => go(page - 1)} disabled={page === 1} aria-label="Previous page"><Icon name="chevron" className="icon pg-prev" /></button>
        {window.map((p, i) => (
          <span key={p} className="cluster" style={{ '--gap': '4px' }}>
            {i > 0 && p - window[i - 1] > 1 && <span aria-hidden="true">…</span>}
            <button type="button" className="pg pg--num" onClick={() => go(p)} aria-current={p === page ? 'page' : undefined} aria-label={`Page ${p}`}>{p}</button>
          </span>
        ))}
        <button type="button" className="pg" onClick={() => go(page + 1)} disabled={page === pages} aria-label="Next page"><Icon name="chevron" className="icon pg-next" /></button>
        <button type="button" className="pg" onClick={() => go(pages)} disabled={page === pages} aria-label="Last page"><Icon name="chevron" className="icon pg-last" /></button>
        <label htmlFor={id} style={{ marginLeft: 12 }}>Page size:</label>
        <select id={id} className="select select--mini" value={size} onChange={(e) => { onSize(Number(e.target.value)); onPage(1); }}>
          {sizes.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <span>{total} items in {pages} pages</span>
    </div>
  );
}
