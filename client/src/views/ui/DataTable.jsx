import { useMediaQuery } from '../../controllers/useMediaQuery.js';
import { ScrollRegion } from './ScrollRegion.jsx';

/**
 * One data definition, two accessible presentations:
 *   ≥ 720px  → a real <table> (headers, row headers, caption) for scanning and keyboard/screen-reader table navigation
 *   < 720px  → a list of labelled "record cards", because wide tables are unreadable on phones.
 * columns: { key, header, render?(row), numeric?, rowHeader?, hideOnCards? }
 */
export function DataTable({ columns, rows, rowKey, caption, hideCaption = false, cardTitle, footer, emptyText = 'No records to display.' }) {
  const wide = useMediaQuery('(min-width: 720px)');

  if (wide) {
    return (
      <ScrollRegion label={`${caption} (scrolls sideways)`}>
        <table className="table">
          <caption className={hideCaption ? 'visually-hidden' : undefined}>{caption}</caption>
          <thead><tr>{columns.map((c) => <th key={c.key} scope="col" className={c.numeric ? 'num' : undefined}>{c.header}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td className="empty-row" colSpan={columns.length}>{emptyText}</td></tr>}
            {rows.map((row, i) => (
              <tr key={rowKey(row, i)}>
                {columns.map((c) => {
                  const content = c.render ? c.render(row) : row[c.key];
                  return c.rowHeader
                    ? <th key={c.key} scope="row">{content}</th>
                    : <td key={c.key} className={c.numeric ? 'num' : undefined}>{content}</td>;
                })}
              </tr>
            ))}
          </tbody>
          {footer && <tfoot>{footer}</tfoot>}
        </table>
      </ScrollRegion>
    );
  }

  if (rows.length === 0) return <p className="empty-row">{emptyText}</p>;

  return (
    <ul className="records" aria-label={caption}>
      {rows.map((row, i) => (
        <li key={rowKey(row, i)} className="record">
          <p className="record__title">{cardTitle ? cardTitle(row) : (columns.find((c) => c.rowHeader)?.render?.(row) ?? row[columns[0].key])}</p>
          <dl className="kv">
            {columns.filter((c) => !c.rowHeader && !c.hideOnCards).map((c) => (
              <div key={c.key} style={{ display: 'contents' }}>
                <dt>{c.header}</dt>
                <dd>{c.render ? c.render(row) : row[c.key]}</dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ul>
  );
}
