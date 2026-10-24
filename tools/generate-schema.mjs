// Prints the MySQL DDL Sequelize would run for `sync()`, WITHOUT connecting to a database.
//   node tools/generate-schema.mjs > docs/schema.sql
import { sequelize } from '../server/models/index.js';

const captured = [];
// Intercept every statement Sequelize would send (and answer with an empty result set).
sequelize.query = async (sql) => { captured.push(typeof sql === 'string' ? sql : sql.query); return [[], 0]; };
sequelize.authenticate = async () => {};

await sequelize.sync({ force: false });
const ddl = captured.filter((q) => /^\s*(CREATE|ALTER)\s/i.test(q));
console.log('-- Generated from the Sequelize models (server/models). Do not edit by hand.');
console.log('-- Engine/charset: InnoDB, utf8mb4_unicode_ci.\n');
for (const q of ddl) console.log(`${q.replace(/;?\s*$/, '')};\n`);
