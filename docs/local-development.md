# Local development

Docker runs **resources only** (PostgreSQL, Redis and a Redis REST adapter). The Next.js app, migrations and seeds run on the host with Bun.

## Resources

`docker-compose.yml` defines one stack that other local projects may reuse:

| Item                  | Value                                                                             |
| :-------------------- | :-------------------------------------------------------------------------------- |
| Compose project       | `local-platforms`                                                                 |
| Containers            | `local-platforms-postgres`, `local-platforms-redis`, `local-platforms-redis-rest` |
| Volumes               | `local_platforms_pgdata_18`, `local_platforms_redis_data`                         |
| Network               | `local_platforms_net`                                                             |
| Images                | `postgres:18.6-alpine`, `redis:7.4-alpine`, `hiett/serverless-redis-http:0.0.10`  |
| Ports (loopback only) | 5432, 6379, 8079                                                                  |
| Database              | `local_platforms` (user `postgres`)                                               |

The Postgres init SQL is inlined in the compose file (`configs.content`) so the file works from any checkout path. The Redis REST adapter runs in `env` mode (`SRH_MODE=env`, `SRH_CONNECTION_STRING`, `SRH_TOKEN`); version 0.0.10 has no other single-server mode.

## Prerequisites

- Bun 1.4.2 (the version the repo targets; `package.json` no longer pins it with `packageManager` or `engines`)
- Docker with Compose
- Node 22 only for the realtime process (see [Realtime](#realtime))

`dev`, `build` and `start` run Next.js through `bun --bun`. `eslint`, `tsc`, `vitest` and `drizzle-kit` follow their Node shebangs.

## Start once

```bash
cp .env.example .env.local
bun i
bun run db:up
bun run db:setup
bun run dev
```

`db:setup` runs `db:auth`, `db:migrate` and `db:seed` in order. Sign in at `http://localhost:3000/login` with the local user documented in `fixtures/local-dev-credentials.json` (`local@example.test`, `LocalDev123!`). On dev server startup the email, the password and the masked database URL are logged to the terminal, only when `DATABASE_URL` points to loopback and `NODE_ENV` is not `production` (`lib/dev-credentials-logger.ts`).

Sign in with email and password only. Without `RESEND_API_KEY`, "Forgot password?" on the login form logs the email, reset link included, to the dev server terminal outside production (`lib/email/send-email.ts`); open that link at `/reset-password?token=...`. With the key, set `EMAIL_FROM` too. Signed-in users change their password at `/dashboard/change-password` (sidebar account popover).

`DATABASE_URL` must be set (the `.env.example` value is `postgresql://postgres:postgrespassword@127.0.0.1:5432/local_platforms`). If it is missing, the app, `drizzle-kit` and the seed stop with `DATABASE_URL is not set` instead of connecting as your OS user.

## Commands

| Command                              | Does                                                                                                                     |
| :----------------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| `bun run db:up` / `db:down`          | `docker compose up -d --wait` / `docker compose down`. `down` keeps the named volumes.                                   |
| `bun run db:auth`                    | Create the auth tables (`user`, `better_auth_*`) from `lib/db/auth-migrations`. Loopback only, idempotent.               |
| `bun run db:migrate`                 | `drizzle-kit migrate` for the `lipi_*` tables. History always goes to `drizzle.__lipi_migrations`, in every environment. |
| `bun run db:seed`                    | Idempotent local seed: the local user, a credential account, one workspace with three pages.                             |
| `bun run db:setup`                   | `db:auth`, `db:migrate`, `db:seed`.                                                                                      |
| `bun run dev`                        | Next.js dev server on the host.                                                                                          |
| `bun run realtime:dev`               | Hocuspocus server on Node (optional, only for live collaboration).                                                       |
| `bun run test`, `type-check`, `lint` | Unit tests (Vitest), TypeScript, ESLint. `bun run test:e2e` starts its own throwaway database.                           |

## Environment

`.env.example` is grouped under hash headings, and every variable is read through `lib/env.ts`:

| Group         | Variables                                                                                                       | Local default                                             |
| :------------ | :-------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------- |
| App           | `NEXT_PUBLIC_APP_URL`, `SKIP_ENV_VALIDATION`                                                                    | `http://localhost:3000`, `false`                          |
| Auth          | `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`                                                                         | local URL and a 32+ character dev secret                  |
| OAuth         | `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET`                                                            | empty (buttons render, round trip fails)                  |
| Database      | `DATABASE_URL`                                                                                                  | loopback Postgres                                         |
| Redis         | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`                                                            | REST adapter on 8079                                      |
| Rate limiting | `ENABLE_RATE_LIMITING`, `RATE_LIMITING_REQUESTS_PER_SECOND`, `TRUSTED_PROXY_COUNT`                              | `false`, `20`, `0`                                        |
| Stripe        | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO`                                             | empty (billing disabled)                                  |
| Email         | `RESEND_API_KEY`, `EMAIL_FROM`                                                                                  | empty (reset links are logged)                            |
| UploadThing   | `UPLOADTHING_TOKEN`, `UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID`                                                 | empty (URL-based images only)                             |
| Realtime      | `NEXT_PUBLIC_LIPI_REALTIME_URL`, `LIPI_REALTIME_ALLOWED_ORIGINS`, `LIPI_REALTIME_PORT`, `LIPI_REALTIME_ADDRESS` | `ws://localhost:1234`, local origins, `1234`, `127.0.0.1` |

## Ports and env

| Service            | Port | Env                                                   |
| :----------------- | :--- | :---------------------------------------------------- |
| App                | 3000 | `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`              |
| PostgreSQL         | 5432 | `DATABASE_URL`                                        |
| Redis              | 6379 | not used directly by Lipi                             |
| Redis REST adapter | 8079 | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`  |
| Realtime           | 1234 | `NEXT_PUBLIC_LIPI_REALTIME_URL`, `LIPI_REALTIME_PORT` |

Redis is only used for rate limiting, which is off locally (`ENABLE_RATE_LIMITING=false`).

## Invalid origin on login

Better Auth trusts only the origin of `BETTER_AUTH_URL` (fallback `http://localhost:3000`) and rejects other request origins and absolute `callbackURL`s with `Invalid origin` or `Invalid callbackURL`. Outside production Lipi also trusts `http://localhost:*` and `http://127.0.0.1:*` (`resolveTrustedOrigins` in `lib/auth/resolve-auth-base-url.ts`), so a stale port in `BETTER_AUTH_URL`, `localhost` versus `127.0.0.1`, or Next moving to another port no longer breaks sign-in. In production only the `BETTER_AUTH_URL` origin is trusted.

Keep `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` equal to the URL you open: password-reset and invite links, and `absoluteUrl`, are built from them.

## Tables and prefixes

- Auth tables are unprefixed: `user`, `better_auth_account`, `better_auth_session`, `better_auth_verification`. Sign-in is email and password only.
- The auth tables are shared with Infinitunes (see [Shared database](#shared-database-with-infinitunes)).
- Application tables are prefixed `lipi_`; `drizzle.config.ts` filters on `lipi_*`, so `db:generate` never emits auth tables. The auth baseline is generated separately with `drizzle.auth.config.ts`.
- Production keeps the auth tables it already has: `db:auth` refuses non-loopback URLs and `db:migrate` there uses `drizzle.__lipi_migrations` like everywhere else (see the one-time switch below).

## Shared database with Infinitunes

Lipi and Infinitunes use one Postgres database (`local_platforms`, compose project `local-platforms`) and one set of user accounts. Auth tables are unprefixed and shared; each app owns only its prefixed tables (`lipi_*` here, `infinitunes_*` there).

- `drizzle.config.ts` filters on `lipi_*` and keeps history in `drizzle.__lipi_migrations`. `drizzle.auth.config.ts` keeps history in `drizzle.__lipi_auth_migrations`. Neither touches `infinitunes_*` tables or the other app's history tables.
- `db:auth` runs `lib/db/auth-migrations/0000_local_auth_baseline.sql`: only `CREATE TABLE IF NOT EXISTS`, `CREATE UNIQUE INDEX IF NOT EXISTS` and foreign keys guarded by `duplicate_object`. It never drops or alters, so it is a no-op when Infinitunes created the tables first. Verified on a scratch database holding an Infinitunes-style `user` table plus `infinitunes_*` tables: `db:setup` twice left their schema and rows identical.
- `db:seed` seeds the same user as Infinitunes (`local@example.test`, id `a0000000-0000-4000-8000-000000000001`, `LocalDev123!`, name `Local Developer`), so a single login works in both apps. Both seeds use `ON CONFLICT DO NOTHING`, so the second one to run leaves the first one's rows alone.

### Shared auth table contract

Better Auth runs with `advanced.database.generateId: "uuid"`, so every id is a `uuid` (default `gen_random_uuid()`). All timestamps are `timestamp without time zone`, mapped as JS `Date`. Better Auth field mapping: `user.name` is stored in `betterAuthName` and `user.emailVerified` in `emailVerifiedBoolean`.

`user`

| Column                 | Type        | Null | Default             | Notes                                                                                                                 |
| :--------------------- | :---------- | :--- | :------------------ | :-------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `uuid`      | no   | `gen_random_uuid()` | primary key                                                                                                           |
| `name`                 | `text`      | yes  |                     | Lipi mirrors `betterAuthName` here and reads it for member lists (falls back to email); Infinitunes need not write it |
| `email`                | `text`      | no   |                     | unique (`user_email_unique`)                                                                                          |
| `password`             | `text`      | yes  |                     | legacy bcrypt hash mirrored from the credential account; Lipi writes it, others may leave it null                     |
| `image`                | `text`      | yes  |                     |                                                                                                                       |
| `betterAuthName`       | `text`      | no   | `''`                | display name used by Better Auth                                                                                      |
| `emailVerifiedBoolean` | `boolean`   | no   | `false`             | email verified flag used by Better Auth                                                                               |
| `createdAt`            | `timestamp` | no   | `now()`             |                                                                                                                       |
| `updatedAt`            | `timestamp` | no   | `now()`             |                                                                                                                       |

Existing databases may also carry legacy nullable columns (`emailVerified timestamp`, `username`, `displayUsername`). Neither app declares them, so they must stay nullable.

`better_auth_account`

| Column                                            | Type        | Null | Default             | Notes                                                            |
| :------------------------------------------------ | :---------- | :--- | :------------------ | :--------------------------------------------------------------- |
| `id`                                              | `uuid`      | no   | `gen_random_uuid()` | primary key                                                      |
| `userId`                                          | `uuid`      | no   |                     | FK to `user.id`, `ON DELETE CASCADE`                             |
| `accountId`                                       | `text`      | no   |                     | for `credential` accounts, the user id                           |
| `providerId`                                      | `text`      | no   |                     | `credential`, `google`, `github`                                 |
| `accessToken`, `refreshToken`, `scope`, `idToken` | `text`      | yes  |                     |                                                                  |
| `accessTokenExpiresAt`, `refreshTokenExpiresAt`   | `timestamp` | yes  |                     |                                                                  |
| `password`                                        | `text`      | yes  |                     | bcrypt hash (`bcryptjs`, cost 10), only on `credential` accounts |
| `createdAt`, `updatedAt`                          | `timestamp` | no   | `now()`             |                                                                  |

Unique index `better_auth_account_provider_account_unique` on (`providerId`, `accountId`).

`better_auth_session`

| Column                   | Type        | Null | Default             | Notes                                       |
| :----------------------- | :---------- | :--- | :------------------ | :------------------------------------------ |
| `id`                     | `uuid`      | no   | `gen_random_uuid()` | primary key                                 |
| `userId`                 | `uuid`      | no   |                     | FK to `user.id`, `ON DELETE CASCADE`        |
| `token`                  | `text`      | no   |                     | unique (`better_auth_session_token_unique`) |
| `expiresAt`              | `timestamp` | no   |                     |                                             |
| `ipAddress`, `userAgent` | `text`      | yes  |                     |                                             |
| `createdAt`, `updatedAt` | `timestamp` | no   | `now()`             |                                             |

`better_auth_verification`

| Column                   | Type        | Null | Default             | Notes       |
| :----------------------- | :---------- | :--- | :------------------ | :---------- |
| `id`                     | `uuid`      | no   | `gen_random_uuid()` | primary key |
| `identifier`             | `text`      | no   |                     |             |
| `value`                  | `text`      | no   |                     |             |
| `expiresAt`              | `timestamp` | no   |                     |             |
| `createdAt`, `updatedAt` | `timestamp` | no   | `now()`             |             |

Rules for both apps: do not rename or drop these columns, add new auth columns only as nullable or defaulted, create the tables with `IF NOT EXISTS` so either app can run first, and keep per-app auth extras (rate limits, passkeys) in prefixed tables.

Cookies are not port-isolated on `localhost`, so two apps on different ports overwrite each other's `better-auth.session_token`. Give both the same `BETTER_AUTH_SECRET` (sessions are then valid in both) or set distinct cookie prefixes.

## Code layout

- `lib/db/schema/` holds the Drizzle schema (`auth.ts` unprefixed auth tables, `app.ts` the `lipi_*` tables); `lib/db/migrations/` are the `lipi_*` migrations.
- `lib/db/actions/` are the `"use server"` actions called from the client (documents, search, workspaces, members, settings).
- `lib/db/data/` is server-only data access (cached lists, mutation authorization, billing, quota helpers). Client components must not import it or `@/lib/db`; `lib/db/server-boundary.test.ts` enforces this.

## Browser state

The dashboard sidebar (shadcn `SidebarProvider`) stores its open state in the `sidebar_state` cookie (`"false"` means collapsed; absent means expanded). The workspace layout reads it on the server (`lib/dashboard/sidebar-cookie.ts`), so clear that cookie to reset the sidebar.

## Seed safety

`db:seed` refuses to run when `NODE_ENV=production` or when `DATABASE_URL` is not `localhost`, `127.0.0.1` or `::1`. It runs in one transaction with `ON CONFLICT DO NOTHING`, never updates or deletes rows, and stops if the local email already belongs to a different user ID.

## Realtime

`@hocuspocus/server` 4.7 fails under Bun (`crossws` rejects its Node adapter), so `realtime:dev` and `realtime:start` run on Node 22.

## Reset

- `bun run db:down` stops the containers and keeps the data volumes.
- To start Lipi data over without touching other data in the database, drop the `lipi_*` tables and `drizzle.__lipi_migrations`, then rerun `db:setup`.
- To wipe everything, run `docker compose down -v` (deletes both volumes), then `bun run db:up` and `bun run db:setup`.

## Production: one-time switch to `drizzle.__lipi_migrations`

Owner step, not automated. An existing production database recorded its history in the default `drizzle.__drizzle_migrations`. `drizzle.__lipi_migrations` starts empty, so the first `db:migrate` would re-run `0000` to the latest against a schema that already has them.

Before the first production `db:migrate` after this change:

1. Back up the database, then rehearse on a restored copy with `bun run db:migrate`.
2. Create `drizzle.__lipi_migrations` with the same shape as the default table (`id serial primary key`, `hash text not null`, `created_at bigint`) and insert one row per already-applied migration: `hash` is the sha256 hex of the migration's `.sql` file, `created_at` is its `when` value in `lib/db/migrations/meta/_journal.json`. Copying only the Lipi rows from `__drizzle_migrations` also works.
3. Seed only migrations that are really applied. If production never applied `0014`, leave it out so `db:migrate` runs it.
4. Run `bun run db:migrate`; it should report nothing to apply (or only the unseeded migrations).

Leave `drizzle.__drizzle_migrations` alone: another app may share it.
