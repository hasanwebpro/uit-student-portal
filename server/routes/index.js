import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { apiNotFound } from '../middleware/errors.js';
import { authRoutes } from './auth.routes.js';
import academics from './academics.routes.js';
import exams from './exams.routes.js';
import fees from './fees.routes.js';
import tools from './tools.routes.js';
import registration from './registration.routes.js';
import profile from './profile.routes.js';

/** Everything under /api. Public: /auth/login|logout. Everything else requires a session. */
export function apiRouter(options) {
  const api = Router();
  api.use('/auth', authRoutes(options));

  const secured = Router();
  secured.use(requireAuth);
  secured.use('/exams', exams);
  secured.use('/fees', fees);
  secured.use('/registration', registration);
  secured.use('/profile', profile);
  secured.use(academics);
  secured.use(tools);
  api.use(secured);

  api.use(apiNotFound);
  return api;
}
