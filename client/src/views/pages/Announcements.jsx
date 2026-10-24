import { useQuery } from '../../controllers/useQuery.js';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { CommunityModel } from '../../models/portal.js';
import { formatDate } from '../../models/format.js';
import { Async } from '../ui/Async.jsx';
import { Card, EmptyState, PageHeader } from '../ui/primitives.jsx';

export default function Announcements() {
  usePageTitle('Announcements');
  const query = useQuery('announcements', CommunityModel.announcements);
  return (
    <>
      <PageHeader title="Announcements" crumbs={['More', 'Announcements']} />
      <Async query={query} empty={(d) => d.rows.length === 0 && <EmptyState icon="bell" title="No announcements" />}>
        {({ rows }) => (
          <div className="stack">
            {rows.map((a) => (
              <Card as="article" key={a.id} aria-labelledby={`a-${a.id}`}>
                <h2 id={`a-${a.id}`}>{a.title}</h2>
                <p className="muted small">{formatDate(a.postedOn)} · {a.author}</p>
                {a.body.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
              </Card>
            ))}
          </div>
        )}
      </Async>
    </>
  );
}
