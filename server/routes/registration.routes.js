import { Router } from 'express';
import * as registration from '../controllers/registration.controller.js';

const r = Router();
r.get('/', registration.show);
r.post('/', registration.create);

export default r;
