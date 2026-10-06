# Local database session, 2026-10-06

Database-only verification (no dev server, no browser). Passwords are masked as `***`.

## Environment

- Postgres 18.6 (`postgres:18.6-alpine`, the image pinned in `docker-compose.yml`), loopback only.
- The repo compose stack (`local-platforms`) was running at the start of the session, then another project took over the shared name and port 5432 mid-session. The items below that ran on the compose container (1 to 5) used throwaway databases named `lipi_w2_*` inside it; `local_platforms` was never touched. Items 6 and 7 ran on a private container (`lipi-w2-pg`, tmpfs data, port 55437) started with the same image and the same extension setup (`pgcrypto`, `uuid-ossp`).
- "Fresh Postgres" below means a freshly created database in an already running server, with both extensions created by hand to mirror the compose init SQL. The migrations only use `gen_random_uuid` (core since Postgres 13), so greenfield does not depend on that init SQL.
- `DATABASE_URL=postgresql://postgres:***@127.0.0.1:<port>/<db>`.

## 1. Greenfield `bun run db:setup` (LIP-V001): verified-pass

Run twice on an empty database:

```
$ bun run db:setup
$ drizzle-kit migrate --config drizzle.auth.config.ts   ... migrations applied successfully!
$ drizzle-kit migrate                                    ... migrations applied successfully!
$ bun lib/db/seed.ts                                     Seeded local user local@example.test and workspace data
```

After the second run: 14 tables (`user`, `better_auth_*`, `account`, `verificationToken`, 7 `lipi_*`), `drizzle.__lipi_migrations` 15 rows, `drizzle.__lipi_auth_migrations` 1 row, 1 user, 3 documents (no duplicates, so the seed is idempotent). Migration 0014 is included and dropped the Stripe catalog tables.

## 2. Migration 0013 drift and lock behaviour (F-NEW-5): verified-pass, with two findings

Method: applied 0000 to 0012 with a trimmed copy of the migrations folder, then applied only 0013 through `drizzle-kit migrate`.

| Scenario                                                                                        | Result                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production-like `user` table with extra `username` and `displayUsername` columns and a data row | 0013 applied, both trigram indexes created, extra columns and data untouched (`username` still `au`)                                                                                                                      |
| Same-named index `lipi_documents_title_trgm_idx` already present                                | 0013 fails (plain `CREATE INDEX`, no `IF NOT EXISTS`); history table not advanced (13 rows) and `pg_trgm` not left behind, so the migration is transactional. After dropping the manual index the rerun applied (14 rows) |
| Non-superuser database owner                                                                    | Applied: `pg_trgm` is a trusted extension, so `CREATE EXTENSION` works without superuser                                                                                                                                  |
| Lock mode during `CREATE INDEX ... USING gin`                                                   | `pg_locks` shows `ShareLock` on `lipi_documents`: reads continue, writes wait until the build finishes                                                                                                                    |

Findings: (a) the migration never touches `user.username` or `user.displayUsername`, so the drift handling is as intended; (b) a hand-created index with the same name makes the migration fail rather than adopt it. Index builds block writes for their duration; on a large production table consider building the two indexes with `CREATE INDEX CONCURRENTLY` outside the migration. Not tested: a very large table.

## 3. `pg` and `sharp` (F-DEP-4): kept, reasons below

- No import of either package in the repo (`git grep` for import and require forms: no matches). The only `"pg"` in code is Better Auth's `provider: "pg"` option and `drizzle-orm/pg-core`.
- `sharp` is also listed in `next`'s own `optionalDependencies` (`^0.35.4`). It matters only when `IS_DOCKER=true` (`next.config.ts` sets `images.unoptimized: !isDocker`). There is no Dockerfile in the repo to run, so it stays.
- `drizzle-kit` picks `pg` when installed, otherwise `postgres`. With `node_modules/pg` moved aside:
  - `db:auth`, `db:migrate`, `db:check` succeed and print `Using 'postgres' driver`.
  - A greenfield `db:setup` on a fresh database succeeds.
  - `drizzle-kit studio` starts ("Drizzle Studio is up and running").
  - `drizzle-kit push` behaves the same with and without `pg`: it tries to create `better_auth_account` and errors with `already exists` on a migrated database (the schema directory includes the auth tables, which are not in the `lipi_*` filter). This is not driver related.
- Not verified: production migrations over TLS against a managed Postgres with the `postgres` driver instead of `pg`. That is the reason `pg` is not removed here; `package.json` and the lockfile are unchanged and no build was needed.

## 4. Shared default history table in production (F-OPS-2): verified-FAIL (unsafe on a shared table)

Production uses the default `drizzle.__drizzle_migrations` (no `migrations` override). Pre-seeded that table with one foreign row (`hash=otherapp-hash`) and ran `drizzle-kit migrate` with a config that omits the override:

| Foreign row `created_at`               | Outcome                                                                                                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Older than every Lipi migration (2001) | All 15 Lipi migrations applied, history 16 rows                                                                                                      |
| Newer than every Lipi migration (2030) | Exit 0, "migrations applied successfully", **zero Lipi tables created, history still 1 row** (silent skip)                                           |
| Between Lipi 0005 and 0006             | Exit 1: 0006 fails because `lipi_workspaces` does not exist (0000 to 0005 skipped); error text not printed by drizzle-kit, found in the Postgres log |

Drizzle compares only the newest `created_at` in the history table with each migration timestamp. If another app shares `drizzle.__drizzle_migrations` in the production database and has a newer row, Lipi migrations are skipped without any error. Mitigation: give Lipi its own history table in production too (the `migrations` override in `drizzle.config.ts` currently applies to loopback URLs only), or confirm the shared table's newest `created_at` is older than the Lipi migration being deployed. Not changed in this session (outside the allowed files).

The "old 0004" half: the original `0004` (`SET DATA TYPE boolean` with no `USING`) fails on any database that still has the `text` `in_trash` column from 0000 (`column "in_trash" cannot be cast automatically to type boolean`), so no database can have applied it by normal means. If one did via a manual fix (column already `boolean`), the new 0004 is idempotent: all 9 statements ran again, column stays `boolean default=false`. Drizzle also would not re-run it, since it skips by timestamp.

## 5. Migration 0014 dry run (F-OPS-1 legacy shape): verified-pass

Database at 0013 with a legacy user (`user.password` set, no `better_auth_account` credential row), a product, a price, a subscription pointing at that price, and a `lipi_accounts` row.

- `pricing_type` and `pricing_plan_interval` are used only by `lipi_prices` (columns `type`, `interval`), so dropping them is safe within this schema. Other apps in a shared database are not checked.
- Inside `BEGIN ... ROLLBACK`: all six statements succeeded, the subscription row and its `price_id` column survived.
- Real `bun run db:migrate`: succeeded. After: `lipi_prices`, `lipi_products`, `lipi_accounts` and both types gone; the user and `user.password` kept; the subscription kept with a dangling `price_id` text value (the foreign key is dropped, the column is not). Rerun: no-op.
- The data in `lipi_products`, `lipi_prices` and `lipi_accounts` is discarded, as the TODO says. No production data was touched.

## 6. Database-backed integration tests (F-TST-4)

New files (skip themselves unless `TEST_DATABASE_URL` points at a loopback database that already has the Lipi schema; run `bun run db:setup` against it first):

| File                                                | Covers                                                                                                                                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/db/test-database.ts`                           | Reachability check, loopback guard, row fixtures and cleanup                                                                                                                             |
| `lib/billing/enforce-quotas.db.test.ts` (8)         | Real quota SQL: trashed workspaces, Pro price and status, collaborators across workspaces, unexpired vs expired invites, reissued invite exclusion, transfer limit                       |
| `lib/db/actions/document.db.test.ts` (9)            | Real document actions: create, root page limit (free and Pro), non-member and viewer denial, listing order, trash, restore, permanent delete (FK RESTRICT), update validation, duplicate |
| `lib/db/request-cache.db.test.ts` (4)               | Real SQL behind `getRequestMembership` and `getRequestDocuments`, query counts, non-member rejection                                                                                     |
| `lib/db/data/workspace-member-quota.db.test.ts` (3) | Owner advisory lock with two independent clients                                                                                                                                         |
| `lib/db/actions/search.db.test.ts` (4)              | Search empty and query branches against real rows                                                                                                                                        |

Results:

```
no TEST_DATABASE_URL:  bunx vitest run --maxWorkers=1       Test Files 107 passed | 5 skipped; Tests 490 passed | 28 skipped
with TEST_DATABASE_URL: bunx vitest run --maxWorkers=1 db.test   Test Files 5 passed; Tests 28 passed (twice in a row, no leftover rows)
bun run test (default workers):                              Test Files 107 passed | 5 skipped; Tests 490 passed | 28 skipped
```

Defect check (each mutation made the new tests fail, then was reverted): removing `pg_advisory_xact_lock`; counting trashed workspaces; counting expired invites; search limit 20 to 10; search including trashed pages.

Advisory lock evidence: with two separately evaluated module graphs (two single-connection clients, like two server processes) and a `pg_sleep` inside the transaction, one free seat left: with `withOwnerCollaboratorLock` exactly one insert succeeds and the other is rejected (2 collaborators in total); the same race without the lock lets both through (3 collaborators); two different owners overlap in time (no global serialization). Note `lib/db/index.ts` uses `max: 1`, so within one process the connection already serializes transactions; the lock protects across processes.

Limits: the request-cache test replaces React `cache` with a map, because outside a render `cache` does not memoize (confirmed: two calls ran the workspace query twice). It proves the SQL, authorization and one query per distinct argument list. Dedupe through the real Next dispatcher stays unverified. The server action boundary (cookies, headers, real session) is not exercised: `getCurrentUser` is mocked.

## 7. `search.ts` branch merge (R-26 remainder): skipped, not identical

The new `search.db.test.ts` pins the current behaviour on real rows: the empty query returns 10 rows, never loads `content`, and returns objects without a `snippet` key; the query branch returns up to 20 rows, matches title or content with `%` and `_` escaped, and adds `snippet`. The two branches differ in limit, selected columns, filter and result shape. A merged builder would either always load `content` for the empty query (extra data per keystroke) or keep the conditionals, so it would not be shorter. No production change.

## Cleanup

`lipi-w2-pg` stopped. The compose stack was running before this session and is shared with another project, so `db:down` was not run. The throwaway databases `lipi_w2_*` and role `w2_owner` from items 1 to 5 were dropped through a short-lived container on the `local_platforms_pgdata_18` volume (removed afterwards); `local_platforms` was not modified.
