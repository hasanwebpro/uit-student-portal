import { Sequelize } from 'sequelize';
import { config } from './config.js';

const { host, port, user, password, database, poolMax } = config.db;

/** Single shared connection pool. Every model registers itself on this instance. */
export const sequelize = new Sequelize(database, user, password, {
  host, port, dialect: 'mysql', logging: false, timezone: '+00:00',
  dialectOptions: { decimalNumbers: true, charset: 'utf8mb4' },   // DECIMAL columns come back as numbers, not strings
  define: { underscored: true, timestamps: false, charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
  pool: { max: poolMax, min: 0, idle: 10_000, acquire: 15_000 },
});

/** Creates the database if it does not exist (needs CREATE privilege), then authenticates. */
export async function connectDb() {
  try {
    await sequelize.authenticate();
  } catch (err) {
    if (err?.parent?.code !== 'ER_BAD_DB_ERROR') throw err;
    const { default: mysql } = await import('mysql2/promise');
    const admin = await mysql.createConnection({ host, port, user, password });
    await admin.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await admin.end();
    await sequelize.authenticate();
  }
  return sequelize;
}

/** Retries while the database is still starting (containers, laptops waking MySQL) instead of crashing on the first refusal. */
export async function connectWithRetry({ attempts = 6, delayMs = 1000 } = {}) {
  for (let i = 1; ; i += 1) {
    try { return await connectDb(); } catch (err) {
      const transient = ['ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN', 'PROTOCOL_CONNECTION_LOST'].includes(err?.parent?.code ?? err?.code);
      if (!transient || i >= attempts) throw err;
      await new Promise((r) => setTimeout(r, delayMs * i));
    }
  }
}

export const pingDb = () => sequelize.query('SELECT 1').then(() => true);
export const disconnectDb = () => sequelize.close();
