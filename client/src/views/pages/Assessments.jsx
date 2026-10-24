import { useMemo, useState } from 'react';
import { useQuery } from '../../controllers/useQuery.js';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { AssessmentModel } from '../../models/portal.js';
import { Async } from '../ui/Async.jsx';
import { DataTable } from '../ui/DataTable.jsx';
import { SelectField } from '../ui/Fields.jsx';
import { Badge, Card, PageHeader } from '../ui/primitives.jsx';

export default function Assessments() {
  usePageTitle('Assessment result');
  const filters = useQuery('assessment-filters', AssessmentModel.filters);
  const [session, setSession] = useState('');
  const [course, setCourse] = useState('');
  const results = useQuery(`assessments:${session}:${course}`, AssessmentModel.list({ session, course }));
  const courses = useMemo(() => (filters.data?.courses ?? []).filter((c) => !session || String(c.sessionId) === session), [filters.data, session]);

  return (
    <>
      <PageHeader title="Assessment Result" crumbs={['Exam', 'Assessment Result']} />
      <Card className="stack stack--lg">
        <div className="form-grid">
          <SelectField label="Session:" value={session} onChange={(e) => { setSession(e.target.value); setCourse(''); }}>
            <option value="">- Select -</option>
            {filters.data?.sessions.map((s) => <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? ' (current)' : ''}</option>)}
          </SelectField>
          <SelectField label="Course:" value={course} onChange={(e) => setCourse(e.target.value)}>
            <option value="" />
            {courses.map((c) => <option key={`${c.sessionId}-${c.id}`} value={c.id}>{c.label}</option>)}
          </SelectField>
        </div>
        <div aria-live="polite">
          <Async query={results}>
            {({ rows }) => (
              <DataTable caption="Assessment results" hideCaption rowKey={(r) => `${r.code}-${r.assessment}`} cardTitle={(r) => r.assessment} columns={[
                { key: 'type', header: 'Assessment Type' },
                { key: 'assessment', header: 'Assessment', rowHeader: true },
                { key: 'title', header: 'Course (Code)', render: (r) => `${r.title} (${r.code})` },
                { key: 'sectionCode', header: 'Section Code', hideOnCards: true },
                { key: 'teacher', header: 'Teacher' },
                { key: 'total', header: 'Total Marks' },
                { key: 'passing', header: 'Passing Marks' },
                { key: 'obtained', header: 'Obtained Marks', render: (r) => <>{r.obtained} <span className="only-sunlight">{r.passed ? <Badge kind="ok">Pass</Badge> : <Badge kind="bad">Below passing</Badge>}</span></> },
              ]} rows={rows} />
            )}
          </Async>
        </div>
      </Card>
    </>
  );
}
