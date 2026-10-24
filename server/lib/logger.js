import pino from 'pino';
import { config } from '../config.js';

/** Structured JSON logs. Credentials never reach a log line: cookies, auth headers and set-cookie are redacted at the source. */
export const logger = pino({
  level: config.logLevel,
  redact: { paths: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]', 'req.body.password', 'req.body.currentPassword', 'req.body.newPassword'], censor: '[redacted]' },
});
