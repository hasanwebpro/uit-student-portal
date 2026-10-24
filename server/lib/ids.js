import { notFound } from '../middleware/errors.js';

/** Returns a positive integer id from a route param, or throws 404 — a malformed id can never match a row. */
export function parseId(value, message) {
  if (typeof value === 'string' && /^[1-9]\d{0,9}$/.test(value)) return Number(value);
  if (Number.isInteger(value) && value > 0) return value;
  throw notFound(message);
}

export const today = () => new Date().toISOString().slice(0, 10);
