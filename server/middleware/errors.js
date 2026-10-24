import { ZodError } from 'zod';
import { logger } from '../lib/logger.js';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
export const badRequest = (m, d) => new HttpError(400, m, d);
export const unauthorized = (m = 'Please sign in to continue.') => new HttpError(401, m);
export const forbidden = (m = 'You do not have permission to do that.') => new HttpError(403, m);
export const notFound = (m = 'We could not find what you were looking for.') => new HttpError(404, m);
export const conflict = (m, d) => new HttpError(409, m, d);

/** Parse `value` with a zod schema; throws a 422 whose `details` maps field → message. */
export function parse(schema, value) {
  const out = schema.safeParse(value);
  if (out.success) return out.data;
  const details = {};
  for (const issue of out.error.issues) details[issue.path.join('.') || '_'] ??= issue.message;
  throw new HttpError(422, 'Please correct the highlighted fields.', details);
}

export function apiNotFound(_req, _res, next) { next(notFound('Unknown API endpoint.')); }

export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) err = new HttpError(422, 'Invalid input.');
  if (err?.type === 'entity.parse.failed') err = badRequest('Malformed JSON body.');
  if (err?.type === 'entity.too.large') err = new HttpError(413, 'Request body is too large.');
  if (err?.name === 'SequelizeUniqueConstraintError') err = conflict('That record already exists.');
  if (err?.name === 'SequelizeValidationError') err = new HttpError(422, 'Please correct the highlighted fields.', Object.fromEntries((err.errors ?? []).map((e) => [e.path, e.message])));
  if (err?.name === 'SequelizeForeignKeyConstraintError') err = new HttpError(409, 'That record is linked to other data and cannot be changed this way.');
  const status = err.status && err.status < 600 ? err.status : 500;
  if (status >= 500) (req.log ?? logger).error({ err }, 'unhandled error');
  res.status(status).json({
    error: status >= 500 ? 'Something went wrong on our side. Please try again.' : err.message,
    ...(err.details ? { details: err.details } : {}),
  });
}
