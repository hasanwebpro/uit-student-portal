import { useQuery } from '../../controllers/useQuery.js';
import { useMediaQuery } from '../../controllers/useMediaQuery.js';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { TimetableModel } from '../../models/portal.js';
import { Async } from '../ui/Async.jsx';
import { DataTable } from '../ui/DataTable.jsx';
import { Card, EmptyState, PageHeader } from '../ui/primitives.jsx';

// The original lists day columns alphabetically; the agenda used on phones follows the teaching week instead.
const COLUMNS = ['Friday', 'Monday', 'Saturday', 'Sunday', 'Thursday', 'Tuesday', 'Wednesday'];
const WEEK = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const todayName = () => new Date().toLocaleDateString('en-US', { weekday: 'long' });
const text = (blocks = []) => blocks.map((b) => `${b.start}-${b.end}`).join(', ');

export default function Timetable() {
  usePageTitle('Time table');
  const query = useQuery('timetable', TimetableModel.get);
  const wide = useMediaQuery('(min-width: 960px)');
  const today = todayName();

  return (
    <>
      <PageHeader title="Time Table" crumbs={['General', 'Time Table']} />
      <Async query={query}>
        {({ session, rows }) => {
          if (rows.length === 0) return <EmptyState icon="calendar" title="No timetable yet" />;
          if (wide) {
            return (
              <Card>
                <DataTable caption={`Timetable, ${session}`} hideCaption rowKey={(r) => r.sectionCode} columns={[
                  { key: 'title', header: 'Course Title', rowHeader: true },
                  { key: 'code', header: 'Course Code' },
                  { key: 'sectionCode', header: 'Section Code' },
                  { key: 'rooms', header: 'Infrastructure', render: (r) => r.rooms.join(', ') },
                  ...COLUMNS.map((d) => ({ key: d, header: d, render: (r) => text(r.days[d]) })),
                ]} rows={rows} />
              </Card>
            );
          }
          // phones: a day-by-day agenda is easier to read than seven narrow columns
          const byDay = Object.fromEntries(WEEK.map((d) => [d, rows.flatMap((r) => (r.days[d] ?? []).map((b) => ({ ...b, title: r.title, faculty: r.faculty })))
            .sort((a, b) => a.start.localeCompare(b.start))]));
          return (
            <div className="stack">
              <p className="muted">{session} · times are 24-hour.</p>
              {WEEK.filter((d) => byDay[d].length).map((d) => (
                <section key={d} className="card" data-today={d === today} aria-labelledby={`day-${d}`}>
                  <h2 id={`day-${d}`}>{d}{d === today && <span className="badge badge--info"> Today</span>}</h2>
                  <div className="stack" style={{ '--gap': '8px' }}>
                    {byDay[d].map((b, i) => <div key={i} className="slot"><strong className="num">{b.start}–{b.end}</strong>{b.title}<br /><span className="muted">{b.room} · {b.faculty}</span></div>)}
                  </div>
                </section>
              ))}
            </div>
          );
        }}
      </Async>
    </>
  );
}
