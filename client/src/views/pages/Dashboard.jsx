import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '../../controllers/useQuery.js';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { DashboardModel } from '../../models/portal.js';
import { formatDashDate, formatDate, formatDayMonth, formatHm, plural, programLabel, sessionFlag, twoDecimals } from '../../models/format.js';
import { Async } from '../ui/Async.jsx';
import { Dialog } from '../ui/Dialog.jsx';
import { DuoIcon } from '../ui/DuoIcon.jsx';
import { Alert, Button, EmptyState, PageHeader } from '../ui/primitives.jsx';
import { ScrollRegion } from '../ui/ScrollRegion.jsx';
import { AttendanceBars, Donut, TrendChart } from '../charts/Charts.jsx';

const DAY_LABEL = (d, inDays) => (inDays === 0 ? 'today' : inDays === 1 ? 'tomorrow' : `on ${d}`);
const slotText = (t) => `${t.day.slice(0, 3)} ${t.start} - ${t.end}`;

/** Card with the original's header pattern: bold title (+ optional grey subtitle) and a purple "View" button. */
function DashCard({ id, title, sub, to, className = '', children, action = 'View' }) {
  return (
    <section className={`card card--stretch ${className}`} aria-labelledby={id}>
      <div className="card-title-row">
        <div><h2 className="card__title" id={id}>{title}</h2>{sub && <span className="card__sub">{sub}</span>}</div>
        {to && <Link className="btn btn--info btn--sm" to={to}>{action}<span className="visually-hidden"> {title}</span></Link>}
      </div>
      {children}
    </section>
  );
}

function StatsCard({ d }) {
  const tiles = [
    ['warning', 'bars', 'Current Balance', d.stats.currentBalance],
    ['primary', 'adduser', 'CGPA', d.stats.cgpa],
    ['danger', 'layers', 'Registered Courses', d.stats.registeredCourses],
    ['success', 'mail', 'Average Attendance', d.stats.averageAttendance],
  ];
  return (
    <section className="card stats-card" aria-labelledby="h-stats">
      <div className="stats-card__head"><h2 id="h-stats">My Stats</h2></div>
      <div className="stats-card__bg" aria-hidden="true" />
      <div className="stats-card__tiles">
        {tiles.map(([tone, icon, label, value]) => (
          <div key={label} className={`mini-stat mini-stat--${tone}`}>
            <DuoIcon name={icon} />
            <div className="mini-stat__text">{label}<br /><span>({twoDecimals(value)})</span></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Notices({ d }) {
  const c = d.nextClass;
  if (!c && !d.surveys.length && !d.unreadMessages) return null;
  return (
    <section className="stack" aria-label="Things that need your attention">
      {c && <Alert kind="info" icon="clock" title={`Next class ${DAY_LABEL(c.day, c.inDays)} at ${c.start}`}>{c.title} · {c.room}</Alert>}
      {d.surveys.length > 0 && <Alert kind="warn" title={`${plural(d.surveys.length, 'feedback form')} waiting`}><Link to="/surveys">Share your feedback</Link></Alert>}
      {d.unreadMessages > 0 && <Alert kind="info" icon="mail" title={plural(d.unreadMessages, 'unread message')}><Link to="/communicator">Open your inbox</Link></Alert>}
    </section>
  );
}

function Courses({ d }) {
  return (
    <section className="card" aria-labelledby="h-courses">
      <div className="card-title-row"><div><h2 className="card__title" id="h-courses">My Courses</h2><span className="card__sub">{d.me.session}</span></div></div>
      {d.courses.length === 0 ? <EmptyState icon="book" title="No courses this term" /> : (
        <ul className="course-rows">
          {d.courses.map((c) => (
            <li key={c.code} className="course-row">
              <div>
                <span className="course-row__name">{c.title}</span>
                <div className="course-row__timings"><strong>Timings: </strong><span>{c.timings.map(slotText).join(' ')}</span></div>
              </div>
              <span className="course-row__meta">{c.faculty}</span>
              <span className="course-row__meta">{c.rooms.join(',')}</span>
              <Link className="btn-icon" to={`/courses/${c.enrollmentId}`} aria-label={`Open ${c.title}`} title="Open course"><DuoIcon name="toggle" /></Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Overview({ d }) {
  const rows = [
    ['primary', 'library', 'Name', d.me.fullName], ['warning', 'pencil', 'Registration No', d.me.regNo],
    ['success', 'program', 'Program Structure', programLabel(d.me.program)], ['danger', 'tag', 'Current Session', d.me.session], ['info', 'shield', 'Status', d.me.status],
  ];
  return (
    <DashCard id="h-overview" title="My Overview">
      {rows.map(([tone, icon, label, value]) => (
        <div key={label} className="symbol-row">
          <span className={`symbol symbol--${tone}`}><DuoIcon name={icon} /></span>
          <div><span className="symbol-row__label">{label}</span><span className="symbol-row__value">{value}</span></div>
        </div>
      ))}
    </DashCard>
  );
}

function ActivityCard({ items }) {
  return (
    <DashCard id="h-activity" title="My Activity" to="/activity">
      <ol className="tl6">
        {items.map((a, i) => (
          <li key={i}>
            <span className="tl6__label">{formatDayMonth(a.at)}<br />{formatHm(a.at)}</span>
            <span className="tl6__dot" aria-hidden="true" />
            <span className="tl6__text">{a.action} : {a.detail}</span>
          </li>
        ))}
      </ol>
    </DashCard>
  );
}

function AnnouncementsCard({ items }) {
  return (
    <DashCard id="h-ann" title="Announcements" to="/announcements">
      <ol className="tl6">
        {items.slice(0, 1).map((a) => (
          <li key={a.id}>
            <span className="tl6__label">{formatDayMonth(a.postedOn)}</span>
            <span className="tl6__dot tl6__dot--warning" aria-hidden="true" />
            <span className="tl6__text">{a.title}{a.body.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</span>
          </li>
        ))}
      </ol>
    </DashCard>
  );
}

function LedgerCard({ ledger }) {
  return (
    <DashCard id="h-ledger" title="Financial Ledger" sub={<>Current Balance: ({twoDecimals(ledger.balance)})<br />Loan/Deferment Amount: (0)</>} to="/fees/ledger" className="col-8">
      <ScrollRegion label="Ledger entries (scrolls)" className="table-wrap card-scroll">
        <table className="table ledger-mini">
          <caption className="visually-hidden">Recent ledger entries</caption>
          <thead><tr>{['Description', 'Fee Nature', 'Session', 'Date', 'Charging', 'Amount', 'Current Balance'].map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
          <tbody>
            {ledger.entries.map((e) => (
              <tr key={e.id}><td>{e.description}</td><td>{e.feeNature}</td><td>{e.session}</td><td>{formatDate(e.postedOn)}</td><td className="num">{e.debit}</td><td className="num">{e.credit ? -e.credit : 0}</td><td className="num">{e.balance}</td></tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
    </DashCard>
  );
}

/** The original pops the latest announcements open on every sign-in; we do the same, once per browser session. */
function AnnouncementModal({ items }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (items.length && !sessionFlag.get('uit-ann-seen')) setOpen(true); }, [items.length]);
  const close = () => { sessionFlag.set('uit-ann-seen'); setOpen(false); };
  return (
    <Dialog open={open} onClose={close} title={`Announcements (${items.length})`} footer={<Button onClick={close}>Close</Button>}>
      <ol className="tl6">
        {items.map((a) => (
          <li key={a.id}>
            <span className="tl6__dot tl6__dot--warning" aria-hidden="true" />
            <span />
            <span className="tl6__text">{a.title}{a.body.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</span>
          </li>
        ))}
      </ol>
    </Dialog>
  );
}

export default function Dashboard() {
  usePageTitle('Dashboard');
  const query = useQuery('dashboard', DashboardModel.get);
  return (
    <>
      <PageHeader title="Dashboard" />
      <Async query={query}>
        {(d) => (
          <div className="dash">
            <div className="col-6"><StatsCard d={d} /></div>
            <div className="col-6"><Notices d={d} /></div>
            <Courses d={d} />
            <div className="col-6"><Overview d={d} /></div>
            <div className="col-6"><ActivityCard items={d.activity} /></div>
            <div className="col-6 dash__stack">
              <DashCard id="h-gpa" title="My GPA" to="/exams/transcript">
                {d.gpaTrend.length ? <TrendChart points={d.gpaTrend} title="GPA and CGPA by term" /> : <EmptyState icon="chart" title="No grades yet" />}
              </DashCard>
              <DashCard id="h-marked" title="My Marked Attendance" to="/general/attendance">
                <AttendanceBars title="Attendance percentage by course" rows={d.courses.map((c) => ({ code: c.code, percentage: c.attendance.percentage, level: c.attendance.level }))} />
              </DashCard>
            </div>
            <div className="col-6"><AnnouncementsCard items={d.announcements} /></div>
            <div className="col-6">
              <DashCard id="h-todo" title="Todo List" to="/general/todo">
                {d.todos.length === 0 ? <p className="muted">Nothing pending.</p> : (
                  <ul className="list">
                    {d.todos.map((t) => <li key={t.id}><div><strong>{t.task}</strong><div className="muted">{formatDashDate(t.dueDate)} ({t.status})</div></div></li>)}
                  </ul>
                )}
              </DashCard>
            </div>
            <div className="col-6" />
            <DashCard id="h-surveys" title="Feedbacks / Surveys" to="/surveys">
              {d.surveys.length === 0 ? <p className="muted">No pending forms.</p> : (
                <ul className="list">
                  {d.surveys.map((s) => <li key={s.id}><div><strong>{s.title}</strong><div className="muted">{s.kind} · closes {formatDashDate(s.closesOn)}</div></div></li>)}
                </ul>
              )}
            </DashCard>
            <div className="col-4">
              <DashCard id="h-degree" title="Degree Completion" className="degree">
                <div className="cluster" style={{ justifyContent: 'center' }}><Donut value={d.degree.percent} label="Degree completion" sub="complete" /></div>
                <p className="degree__note">Roadmaps are meant to be a guide for students and academic advisors in planning a path to a degree.</p>
                <p className="small" style={{ textAlign: 'center' }}><Link to="/general/roadmap">View your road map</Link> · {d.degree.earned}/{d.degree.required} credits</p>
              </DashCard>
            </div>
            <div className="col-8"><LedgerCard ledger={d.ledger} /></div>
          </div>
        )}
      </Async>
      {query.data && <AnnouncementModal items={query.data.announcements} />}
    </>
  );
}
