import { Link, useParams } from 'react-router-dom';
import { useQuery } from '../../controllers/useQuery.js';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { CourseModel } from '../../models/portal.js';
import { Async } from '../ui/Async.jsx';
import { AttendanceBadge } from '../ui/AttendanceBadge.jsx';
import { DataTable } from '../ui/DataTable.jsx';
import { Badge, Card, Meter, PageHeader } from '../ui/primitives.jsx';

export default function CourseDetail() {
  const { id } = useParams();
  const query = useQuery(`course:${id}`, CourseModel.get(id));
  usePageTitle(query.data?.course.title ?? 'Course');
  return (
    <Async query={query}>
      {({ course, timings, attendance, marks, progress }) => (
        <div className="stack stack--lg">
          <PageHeader title={course.title} crumbs={['Course', course.code]} actions={<Link className="btn btn--secondary" to="/courses">All courses</Link>} />
          <div className="grid">
            <Card><h2>Details</h2>
              <dl className="kv">
                <dt>Code</dt><dd>{course.code}</dd><dt>Section</dt><dd>{course.sectionCode}</dd><dt>Faculty</dt><dd>{course.faculty}</dd>
                <dt>Credit hours</dt><dd>{course.creditHrs}</dd><dt>Category</dt><dd>{course.category}</dd><dt>Prerequisite</dt><dd>{course.prereq ?? 'None'}</dd>
              </dl>
            </Card>
            <Card><h2>Schedule</h2>
              <ul className="list">{timings.map((t, i) => <li key={i}><span>{t.day}</span><strong className="num">{t.start}–{t.end}</strong><span className="muted">{t.room}</span></li>)}</ul>
            </Card>
            <Card><h2>Attendance</h2>
              <p className="cluster"><AttendanceBadge level={attendance.level} percentage={attendance.percentage} /></p>
              <Meter value={attendance.percentage} level={attendance.level} label="Attendance percentage" />
              <p className="small">{attendance.attended} attended of {attendance.conducted} held ({attendance.scheduled} scheduled). <Link to="/general/attendance">Details</Link></p>
            </Card>
          </div>
          <Card><h2>Marks so far</h2>
            {marks.length === 0 ? <p className="muted">No marks have been published yet.</p> : (
              <>
                <DataTable caption="Assessments and your marks" rowKey={(r) => r.name} columns={[
                  { key: 'name', header: 'Assessment', rowHeader: true },
                  { key: 'kind', header: 'Type' },
                  { key: 'total', header: 'Total', numeric: true },
                  { key: 'obtained', header: 'Obtained', numeric: true, render: (r) => (r.obtained == null ? <Badge>Pending</Badge> : <strong>{r.obtained}</strong>) },
                ]} rows={marks} />
                <p><strong>{progress.obtained} / {progress.total}</strong> marks graded so far.</p>
              </>
            )}
          </Card>
        </div>
      )}
    </Async>
  );
}
