import { Router } from 'express';
import * as exam from '../controllers/exam.controller.js';

const r = Router();
r.get('/seating', exam.seating);
r.get('/online', exam.online);
r.get('/admit-card', exam.admitCard);

export default r;
