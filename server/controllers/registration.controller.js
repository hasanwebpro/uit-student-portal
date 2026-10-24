import { parse } from '../middleware/errors.js';
import { registrationBody } from '../validators/index.js';
import * as registration from '../services/registration.js';

export async function show(req, res) {
  res.json(await registration.registrationOverview(req.student));
}

export async function create(req, res) {
  const { sectionIds } = parse(registrationBody, req.body);
  res.json({ ok: true, ...(await registration.register(req.student, sectionIds, req.ip)) });
}
