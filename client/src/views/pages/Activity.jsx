import { useQuery } from '../../controllers/useQuery.js';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { CommunityModel } from '../../models/portal.js';
import { formatDateTime } from '../../models/format.js';
import { Async } from '../ui/Async.jsx';
import { Card, EmptyState, PageHeader } from '../ui/primitives.jsx';

export default function Activity() {
  usePageTitle('Activity log');
  const query = useQuery('activity', CommunityModel.activity(50));
  return (
    <>
      <PageHeader title="Activity log" crumbs={['More', 'Activity Log']}>Sign-ins and changes made to your account. If you don’t recognise something, change your password.</PageHeader>
      <Async query={query} empty={(d) => d.rows.length === 0 && <EmptyState icon="clock" title="No activity yet" />}>
        {({ rows }) => (
          <Card>
            <ol className="timeline">
              {rows.map((a) => <li key={a.id}><strong>{a.action}</strong> — {a.detail}<div className="small muted">{formatDateTime(a.at)}{a.ip ? ` · ${a.ip}` : ''}</div></li>)}
            </ol>
          </Card>
        )}
      </Async>
    </>
  );
}
