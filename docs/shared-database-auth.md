# Shared database auth (Lipi + Infinitunes)

Lipi and Infinitunes share one PostgreSQL database. User-facing auth tables (`user`, legacy `account`, `verificationToken`, and `better_auth_*`) are **unprefixed** and owned by Infinitunes migrations.

## Legacy NextAuth / Auth.js users

Better Auth email and username sign-in read `better_auth_account` rows where `providerId = 'credential'`. Users created before the migration may only have `user.password` populated.

Infinitunes provides an idempotent SQL backfill in `packages/db/src/backfill.ts` on branch `migration/bun-monorepo`:

- `BACKFILL_CREDENTIAL_ACCOUNTS` inserts credential rows with `accountId = user.id`, `providerId = 'credential'`, and `password` copied from `user.password` when no credential row exists.
- `BACKFILL_OAUTH_ACCOUNTS` and `BACKFILL_VERIFICATION_TOKENS` migrate legacy OAuth and verification data.

**Operational requirement:** run Infinitunes' shared-table migrations and `BACKFILL_ALL` (or the individual statements in order) against the shared database before expecting existing Lipi users to sign in with Better Auth. Lipi does not ship migrations for shared tables (`drizzle.config.ts` uses `tablesFilter: ["lipi_*"]`).

## Lipi-only schema

Application tables use the `lipi_` prefix via `LIPI_TABLE_PREFIX` in `lib/db/table-prefix.ts`.
