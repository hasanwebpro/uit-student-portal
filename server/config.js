/**
 * Single source of truth for configuration. Everything comes from environment variables, is validated once at start-up,
 * and the process refuses to boot (with a readable message) if something is unsafe or malformed.
 */
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const port = z.coerce.number().int().min(0).max(65535);
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: port.default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional(),
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).optional(),                 // number of reverse-proxy hops in front of the app
  MYSQL_HOST: z.string().min(1).default('127.0.0.1'),
  MYSQL_PORT: port.default(3306),
  MYSQL_USER: z.string().min(1).default('root'),
  MYSQL_PASSWORD: z.string().default(''),
  MYSQL_DATABASE: z.string().regex(/^[A-Za-z0-9_]{1,64}$/, 'letters, digits and underscores only').default('uit_portal'),
  MYSQL_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  SEED_DEMO: z.enum(['true', 'false']).optional(),                                // load fictional demo data into an EMPTY database
  COOKIE_SECURE: z.enum(['true', 'false']).optional(),                            // override only to test production mode over plain http
  JWT_SECRET: z.string().min(32, 'must be at least 32 characters (try: openssl rand -base64 48)').optional(),
});

/** Pure function so tests can exercise every branch without touching process.env. */
export function loadConfig(raw = process.env) {
  const env = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== ''));     // `KEY=` in a .env file means "not set"
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid configuration:\n${lines.join('\n')}`);
  }
  const e = parsed.data;
  const isProd = e.NODE_ENV === 'production';
  if (isProd && !e.JWT_SECRET) throw new Error('Invalid configuration:\n  • JWT_SECRET: required in production (try: openssl rand -base64 48)');

  return {
    root,
    env: e.NODE_ENV,
    isProd,
    isTest: e.NODE_ENV === 'test',
    port: e.PORT,
    logLevel: e.LOG_LEVEL ?? (e.NODE_ENV === 'test' ? 'silent' : isProd ? 'info' : 'debug'),
    seedDemo: e.SEED_DEMO ? e.SEED_DEMO === 'true' : !isProd,           // never on by default in production: the demo password is public
    cookieSecure: e.COOKIE_SECURE ? e.COOKIE_SECURE === 'true' : isProd,
    trustProxy: e.TRUST_PROXY ?? (isProd ? 1 : 0),
    db: { host: e.MYSQL_HOST, port: e.MYSQL_PORT, user: e.MYSQL_USER, password: e.MYSQL_PASSWORD, database: e.MYSQL_DATABASE, poolMax: e.MYSQL_POOL_MAX },
    clientDist: path.join(root, 'client', 'dist'),

    // ── authentication ──
    jwt: {
      // Development without JWT_SECRET gets a random key per boot: safe, but sessions end on restart.
      secret: e.JWT_SECRET ?? crypto.randomBytes(48).toString('base64'),
      ephemeral: !e.JWT_SECRET,
      issuer: 'uit-portal',
      audience: 'uit-portal-web',
    },
    accessCookie: 'uit_at',                  // JWT, path /api
    refreshCookie: 'uit_rt',                 // opaque rotating token, path /api/auth
    accessTokenSeconds: 15 * 60,
    sessionHours: 8,                         // refresh-token lifetime without "remember me"
    rememberDays: 30,
    refreshGraceSeconds: 10,                 // a just-rotated token is tolerated briefly (two tabs racing); later reuse = theft
    sessionCheckTtlMs: 30_000,               // how long "this session is still valid" is trusted before re-checking the DB
    maxFailedLogins: 5,
    lockMinutes: 15,
  };
}

export const config = loadConfig();
