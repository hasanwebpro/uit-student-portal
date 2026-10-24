import { Alert } from './primitives.jsx';
import { Button } from './primitives.jsx';

/** Loading skeleton → error with retry → content. Keeps every page's three states consistent. */
export function Async({ query, skeleton = <DefaultSkeleton />, children, empty }) {
  const { data, error, loading, refetch } = query;
  if (loading) return <div aria-busy="true" aria-live="polite">{skeleton}<span className="visually-hidden" role="status">Loading…</span></div>;
  if (error && data === undefined) {
    return (
      <Alert kind="bad" title="We couldn’t load this page">
        {error.message}
        <div className="cluster"><Button variant="secondary" icon="refresh" onClick={refetch}>Try again</Button></div>
      </Alert>
    );
  }
  if (data === undefined) return null;
  if (empty && empty(data)) return empty(data);
  return children(data);
}

export function DefaultSkeleton({ rows = 4 }) {
  return (
    <div className="stack" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="skeleton" style={{ height: i === 0 ? '88px' : '56px' }} />)}
    </div>
  );
}
