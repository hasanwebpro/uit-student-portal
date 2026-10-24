import { useQuery } from '../../controllers/useQuery.js';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { ExamModel } from '../../models/portal.js';
import { formatDashDate } from '../../models/format.js';
import { Async } from '../ui/Async.jsx';
import { DataTable } from '../ui/DataTable.jsx';
import { Card, PageHeader } from '../ui/primitives.jsx';

export default function Seating() {
  usePageTitle('Exam seating plan');
  const query = useQuery('seating', ExamModel.seating);
  return (
    <>
      <PageHeader title="Exam Seating Plan" crumbs={['Exam', 'Exam Seating Plan']} />
      <Async query={query}>
        {({ rows }) => (
          <Card>
            <DataTable caption="Your exam dates, rooms and seat numbers" hideCaption rowKey={(r) => `${r.code}-${r.kind}`} cardTitle={(r) => r.course} columns={[
              { key: 'date', header: 'Exam Date', render: (r) => formatDashDate(r.date) },
              { key: 'start', header: 'Start Time' },
              { key: 'end', header: 'End Time' },
              { key: 'course', header: 'Course', rowHeader: true },
              { key: 'room', header: 'Room' },
              { key: 'seat', header: 'Seat No' },
            ]} rows={rows} />
          </Card>
        )}
      </Async>
    </>
  );
}
