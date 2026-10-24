import { forgetStudent } from '../lib/cache.js';

/**
 * Cache invalidation lives in one place instead of being sprinkled over every controller:
 * after any *successful write* by a student, everything cached for that student is dropped.
 */
export function invalidateOnWrite(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  res.on('finish', () => { if (res.statusCode < 400 && req.student) forgetStudent(req.student.id); });
  next();
}
