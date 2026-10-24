import { useState } from 'react';
import { useQuery } from '../../controllers/useQuery.js';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { AttendanceModel } from '../../models/portal.js';
import { formatDate } from '../../models/format.js';
import { Async } from '../ui/Async.jsx';
import { AttendanceBadge } from '../ui/AttendanceBadge.jsx';
import { DataTable } from '../ui/DataTable.jsx';
import { Dialog } from '../ui/Dialog.jsx';
import { Icon } from '../ui/Icon.jsx';
import { Alert, Badge, Card, Meter, PageHeader, StatTile } from '../ui/primitives.jsx';

function Detail({ id, onClose }) {
  const query = useQuery(`attendance:${id}`, AttendanceModel.get(id));
  return (
    <Dialog open onClose={onClose} title={query.data?.course ?? 'Attendance details'}>
      <Async query={query}>
        {({ summary, records }) => (
          <>
            <p><AttendanceBadge level={summary.level} percentage={summary.percentage} /> {summary.attended} present, {summary.absent} absent</p>
            <ul className="list" aria-label="Class-by-class attendance">
              {records.map((r, i) => (
                <li key={i}><span>{formatDate(r.date)}<span className="muted small"> · {r.topic}</span></span>
                  {r.present ? <Badge kind="ok">Present</Badge> : <Badge kind="bad">Absent</Badge>}</li>
              ))}
            </ul>
          </>
        )}
      </Async>
    </Dialog>
  );
}

const pctText = (n) => `${n} %`;

export default function Attendance() {
  usePageTitle('Attendance');
  const query = useQuery('attendance', AttendanceModel.list);
  const [open, setOpen] = useState(null);
  return (
    <>
      <PageHeader title="Attendance" crumbs={['General', 'Attendance']} />
      <Async query={query}>
        {({ session, rows, overall }) => (
          <div className="stack">
            <div className="grid grid--stats only-sunlight">
              <StatTile tone={overall >= 85 ? 'green' : overall >= 75 ? 'amber' : 'red'} icon="check" label="Overall" value={`${overall}%`} note={session} />
            </div>
            {rows.some((r) => r.level === 'risk') && <div className="only-sunlight"><Alert kind="bad" title="Some courses are below 75%">Below 75% you may not be allowed to sit the final exam. Speak to your course teacher.</Alert></div>}
            <Card className="card--flush">
              <DataTable caption={`Attendance by course, ${session}`} hideCaption rowKey={(r) => r.enrollmentId} cardTitle={(r) => `${r.course} (${r.code})`} columns={[
                { key: 'view', header: 'View', hideOnCards: true, render: (r) => (
                  <button type="button" className="btn-icon btn-icon--plain" onClick={() => setOpen(r.enrollmentId)} title="View class-by-class attendance">
                    <Icon name="eye" /><span className="visually-hidden">View classes for {r.course}</span>
                  </button>) },
                { key: 'course', header: 'Course (Code)', rowHeader: true, render: (r) => `${r.course} ( ${r.code} )` },
                { key: 'sectionCode', header: 'Section Code', hideOnCards: true, render: (r) => <>{r.course}<span className="cell-sub">{r.sectionCode}</span></> },
                { key: 'faculty', header: 'Faculty' },
                { key: 'scheduled', header: 'Scheduled' },
                { key: 'conducted', header: 'Conducted' },
                { key: 'offset', header: 'Offset', render: (r) => pctText(r.percentage) },
                { key: 'attended', header: 'Attended' },
                { key: 'percentage', header: 'Percentage', render: (r) => (
                  <>{pctText(r.percentage)}
                    <span className="only-sunlight"><br /><AttendanceBadge level={r.level} percentage={r.percentage} /><Meter value={r.percentage} level={r.level} label={`${r.course} attendance`} /></span></>) },
              ]} rows={rows} />
            </Card>
          </div>
        )}
      </Async>
      {open && <Detail id={open} onClose={() => setOpen(null)} />}
    </>
  );
}
