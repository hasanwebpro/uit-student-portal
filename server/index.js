import { config } from './config.js';
import { logger } from './lib/logger.js';
import { connectWithRetry, disconnectDb, pingDb } from './db.js';
import { Student, syncModels } from './models/index.js';
import { seed } from './seed/index.js';
import { createApp } from './app.js';
import { sweepSessions } from './services/session.js';

if (config.jwt.ephemeral) logger.warn('JWT_SECRET is not set: using a random key for this run, so everyone is signed out whenever the server restarts.');

await connectWithRetry();
await syncModels();                                        // creates missing tables; never alters existing ones
if (!(await Student.count())) {
  if (config.seedDemo) {
    logger.info('Empty database — loading demo data…');
    const info = await seed();
    logger.info(`Demo sign-in → ${info.demoReg} / ${info.password}`);
  } else {
    logger.warn('The database has no students and SEED_DEMO is off. Load real data (or run `npm run seed` for fictional demo data).');
  }
}

// MySQL has no TTL indexes, so expired sign-in sessions are swept on boot and hourly
await sweepSessions();
const sweeper = setInterval(() => sweepSessions().catch((err) => logger.error({ err }, 'session sweep failed')), 3600_000);
sweeper.unref();

const server = createApp({ ready: pingDb }).listen(config.port, () => logger.info(`UIT Student Portal → http://localhost:${config.port}`));
server.keepAliveTimeout = 65_000;                          // longer than common load-balancer idle timeouts (60 s) → no spurious 502s
server.headersTimeout = 66_000;
server.requestTimeout = 30_000;

let closing = false;
async function shutdown(reason, code = 0) {
  if (closing) return;
  closing = true;
  logger.info({ reason }, 'shutting down');
  setTimeout(() => process.exit(1), 10_000).unref();      // never hang forever on a stuck connection
  server.close(async () => { await disconnectDb().catch(() => {}); process.exit(code); });
  server.closeIdleConnections();
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => shutdown(signal));
process.on('unhandledRejection', (err) => { logger.fatal({ err }, 'unhandled rejection'); shutdown('unhandledRejection', 1); });
process.on('uncaughtException', (err) => { logger.fatal({ err }, 'uncaught exception'); shutdown('uncaughtException', 1); });
