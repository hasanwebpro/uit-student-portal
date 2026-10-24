import { Router } from 'express';
import * as dashboard from '../controllers/dashboard.controller.js';
import * as course from '../controllers/course.controller.js';
import * as attendance from '../controllers/attendance.controller.js';
import * as timetable from '../controllers/timetable.controller.js';
import * as assessment from '../controllers/assessment.controller.js';
import * as record from '../controllers/record.controller.js';

const r = Router();
r.get('/dashboard', dashboard.show);

r.get('/courses', course.index);
r.get('/courses/:id', course.show);

r.get('/attendance', attendance.index);
r.get('/attendance/:id', attendance.show);

r.get('/timetable', timetable.show);

r.get('/assessments/filters', assessment.filters);
r.get('/assessments', assessment.index);

r.get('/roadmap', record.roadmap);
r.put('/roadmap/verification', record.saveVerification);
r.get('/transcript/programs', record.transcriptPrograms);
r.get('/transcript', record.transcript);
r.get('/plo', record.plo);

export default r;
