import { Router } from 'express';
import * as fee from '../controllers/fee.controller.js';

const r = Router();
r.get('/ledger', fee.ledger);
r.get('/advance', fee.advanceIndex);
r.get('/advance/:id', fee.advanceShow);

export default r;
