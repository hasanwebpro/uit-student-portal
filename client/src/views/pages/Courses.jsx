import { Link } from 'react-router-dom';
import { useQuery } from '../../controllers/useQuery.js';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { CourseModel } from '../../models/portal.js';
import { Async } from '../ui/Async.jsx';
import { AttendanceBadge } from '../ui/AttendanceBadge.jsx';
import { Badge, Card, EmptyState, PageHeader } from '../ui/primitives.jsx';

export default function Courses() {
  usePageTitle('Courses');
  const query = useQuery('courses', CourseModel.list);
  return (
    <>
      <PageHeader title="My courses" crumbs={['Course']} />
      <Async query={query}>
        {({ session, courses }) => (
          <>
            <p className="muted">Registered for {session} — {courses.reduce((a, c) => a + c.creditHrs, 0)} credit hours.</p>
            {courses.length === 0 ? <EmptyState icon="book" title="No courses this term" /> : (
              <ul className="grid" style={{ '--min': '320px', listStyle: 'none', padding: 0 }}>
                {courses.map((c) => (
                  <li key={c.enrollmentId}>
                    <Card as="article" aria-label={c.title} className="stack">
                      <div className="cluster cluster--between">
                        <Badge kind="info">{c.kind === 'LAB' ? 'Lab' : 'Theory'} · {c.creditHrs} cr</Badge>
                        <AttendanceBadge level={c.attendance.level} percentage={c.attendance.percentage} />
                      </div>
                      <h2><Link to={`/courses/${c.enrollmentId}`}>{c.title}</Link></h2>
                      <p className="muted small">{c.code} · {c.faculty}</p>
                      <p className="small">{[...new Set(c.timings.map((t) => `${t.day.slice(0, 3)} ${t.start}–${t.end}`))].join(', ')}</p>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Async>
    </>
  );
}
