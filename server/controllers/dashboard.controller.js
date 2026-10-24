import { appCache, studentKey } from '../lib/cache.js';
import { buildDashboard } from '../services/dashboard.js';

/** The dashboard fans out to ~10 queries; 20 s of caching makes refreshes and tab-switching free (writes drop it early). */
export async function show(req, res) {
  res.json(await appCache.wrap(studentKey(req.student.id, 'dashboard'), 20_000, () => buildDashboard(req.student.id)));
}
