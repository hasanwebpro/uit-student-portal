import { useQuery } from '../../controllers/useQuery.js';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { ExamModel } from '../../models/portal.js';
import { formatDashDate, formatHm } from '../../models/format.js';
import { Async } from '../ui/Async.jsx';
import { DataTable } from '../ui/DataTable.jsx';
import { Card, PageHeader } from '../ui/primitives.jsx';

export default function OnlineExams() {
  usePageTitle('Online exam');
  const query = useQuery('online-exams', ExamModel.online);
  const when = (iso) => `${formatDashDate(iso)} ${formatHm(iso)}`;
  return (
    <>
      <PageHeader title="Online Exam" crumbs={['Exam', 'Online Exam']} />
      <Async query={query}>
        {({ rows }) => (
          <Card>
            <DataTable caption="Online exams" hideCaption rowKey={(r) => r.id} cardTitle={(r) => r.title} columns={[
              { key: 'title', header: 'Exam', rowHeader: true },
              { key: 'session', header: 'Session' },
              { key: 'course', header: 'Course', render: (r) => `${r.course} (${r.code})` },
              { key: 'faculty', header: 'Faculty' },
              { key: 'opensAt', header: 'FromDate', render: (r) => when(r.opensAt) },
              { key: 'closesAt', header: 'ToDate', render: (r) => when(r.closesAt) },
              { key: 'durationMin', header: 'Duration', render: (r) => `${r.durationMin} min` },
              { key: 'status', header: 'Status' },
            ]} rows={rows} />
          </Card>
        )}
      </Async>
    </>
  );
}
