import { useEffect, useState } from 'react';
import { useQuery } from '../../controllers/useQuery.js';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { TranscriptModel } from '../../models/portal.js';
import { formatDate, formatGpa } from '../../models/format.js';
import { Async } from '../ui/Async.jsx';
import { SelectField } from '../ui/Fields.jsx';
import { ScrollRegion } from '../ui/ScrollRegion.jsx';
import { Button, Card, PageHeader } from '../ui/primitives.jsx';

function Sheet({ program, onReady }) {
  const query = useQuery(`transcript:${program}`, TranscriptModel.get(program));
  // print as soon as the sheet is on screen (the original's "Print" button opens the report)
  useEffect(() => {
    if (!query.data || !onReady) return undefined;
    const timer = setTimeout(onReady, 50);
    return () => clearTimeout(timer);
  }, [query.data, onReady]);
  return (
    <Async query={query}>
      {(d) => (
        <article className="print-card stack" aria-label="Unofficial transcript">
          <header className="stack" style={{ '--gap': '4px' }}>
            <h2>Unofficial transcript</h2>
            <dl className="kv"><dt>Name</dt><dd>{d.student.name}</dd><dt>Reg. no</dt><dd>{d.student.regNo}</dd><dt>Enrollment</dt><dd>{d.student.enrollmentNo}</dd><dt>Program</dt><dd>{d.student.program}</dd></dl>
          </header>
          {d.terms.map((term) => (
            <section key={term.session} aria-labelledby={`t-${term.session}`}>
              <h3 id={`t-${term.session}`}>{term.session} <span className="muted small">GPA {formatGpa(term.gpa)} · CGPA {formatGpa(term.cgpa)}</span></h3>
              <ScrollRegion label={`${term.session} courses (scrolls sideways)`}>
                <table className="table table--left">
                  <caption className="visually-hidden">Courses and grades for {term.session}</caption>
                  <thead><tr><th scope="col">Code</th><th scope="col">Course</th><th scope="col" className="num">Cr</th><th scope="col">Grade</th><th scope="col" className="num">Points</th></tr></thead>
                  <tbody>{term.courses.map((c) => <tr key={c.code}><td>{c.code}</td><td>{c.title}</td><td className="num">{c.creditHrs}</td><td><strong>{c.grade}</strong></td><td className="num">{c.points.toFixed(2)}</td></tr>)}</tbody>
                </table>
              </ScrollRegion>
            </section>
          ))}
          <footer>
            <p><strong>Cumulative GPA: {formatGpa(d.cgpa)}</strong> · Credits earned: {d.creditsEarned}</p>
            <p className="small">Generated {formatDate(d.generatedOn)}. {d.notice}</p>
          </footer>
        </article>
      )}
    </Async>
  );
}

export default function Transcript() {
  usePageTitle('Unofficial transcript');
  const programs = useQuery('transcript-programs', TranscriptModel.programs);
  const [program, setProgram] = useState('');
  const [shown, setShown] = useState(null);
  const [wantPrint, setWantPrint] = useState(false);
  return (
    <>
      <PageHeader title="Student Unofficial Transcript" crumbs={['Exam', 'Unofficial Transcript']} />
      <Card className="stack no-print">
        <SelectField label="Program" value={program} onChange={(e) => { setProgram(e.target.value); setShown(null); }}>
          <option value="">- Select -</option>
          {programs.data?.programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </SelectField>
        <div className="cluster" style={{ justifyContent: 'flex-end' }}>
          <Button disabled={!program} onClick={() => { setShown(program); setWantPrint(true); }} icon="print">Print</Button>
        </div>
      </Card>
      {shown && <div style={{ marginTop: 25 }}><Sheet program={shown} onReady={wantPrint ? () => { setWantPrint(false); window.print(); } : undefined} /></div>}
    </>
  );
}
