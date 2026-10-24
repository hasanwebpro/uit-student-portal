# Security

## Reporting
Please report vulnerabilities privately through GitHub's *Security → Report a vulnerability* form rather than a public issue.

## Design summary
| Concern | Control |
|---|---|
| Passwords | scrypt (N=2¹⁵, r=8, p=3), per-hash salt, parameters stored with the hash and upgraded on next sign-in; NFKC-normalised; constant-time compare |
| Sessions | 15-minute HS256 **JWT access token** (httpOnly, SameSite=Strict, path `/api`) + **rotating opaque refresh token** (hashed in DB, path `/api/auth`); replay of a rotated token revokes the whole session; revocation honoured within 30 s |
| JWT hygiene | algorithm pinned, issuer/audience/expiry enforced, secret ≥ 32 chars and mandatory in production, no token ever readable by JavaScript |
| CSRF | SameSite=Strict + required `X-Requested-With` header + `Origin` must match the host |
| Brute force | per-IP and per-IP+account rate limits, account lockout (5 failures → 15 min), equal work for unknown users |
| Transport/headers | strict CSP (no inline script/style), HSTS, frame-ancestors none, nosniff, Permissions-Policy, same-origin referrer |
| Input | zod validation on every body/query, positive-integer ids, parameterised SQL via Sequelize, 32 KB JSON limit, magic-byte check on avatars |
| Authorisation | every query is scoped to the signed-in student; other students' records answer 404 |
| Secrets | environment only; `.env`, `recon/` and logs are git-ignored; logs redact cookies and passwords |
| Supply chain | lockfiles, `npm audit` in CI, Dependabot, minimal runtime deps |
| Deployment | non-root, read-only container, dropped capabilities, health checks, graceful shutdown |

## Known limits
* Revocation of an access token can take up to `sessionCheckTtlMs` (30 s) to reach other server instances because the check is cached per process.
* Demo data uses a public password; `SEED_DEMO` is off by default in production.
* No e-mail based password reset, MFA, or admin console (out of scope for the assignment).
