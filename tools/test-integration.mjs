// Cross-platform runner for the database-backed tests (sets the opt-in flag, then runs node:test).
import { spawnSync } from 'node:child_process';
const r = spawnSync(process.execPath, ['--test', '--test-concurrency=1', 'test/integration/*.test.js'], { stdio: 'inherit', env: { ...process.env, RUN_DB_TESTS: '1' } });
process.exit(r.status ?? 1);
