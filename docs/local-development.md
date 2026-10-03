# Local development

Docker runs **resources only** (PostgreSQL, Redis, and a Redis REST adapter). The Next.js app, migrations and seeds always run on the host with Bun. Lipi and Infinitunes share one local PostgreSQL database.

## Ownership

Both Lipi and Infinitunes ship their own `docker-compose.yml` for the shared resources, so you can start the database from either checkout without the other. The two files are byte-identical and define one shared identity:

| Item                  | Value                                                                             |
| :-------------------- | :-------------------------------------------------------------------------------- |
| Compose project       | `local-platforms`                                                                 |
| Containers            | `local-platforms-postgres`, `local-platforms-redis`, `local-platforms-redis-rest` |
| Volumes               | `local_platforms_pgdata_18`, `local_platforms_redis_data`                         |
| Network               | `local_platforms_net`                                                             |
| Images                | `postgres:18.6-alpine`, `redis:7.4-alpine`, `hiett/serverless-redis-http:0.0.10`  |
| Ports (loopback only) | 5432, 6379, 8079                                                                  |
| Database              | `local_platforms` (user `postgres`)                                               |

Starting from either checkout reuses the same containers and data. The Postgres init SQL is inlined in the compose file (`configs.content`) instead of a bind mount, because a bind-mount path differs per checkout and would make Compose recreate the container whenever you switch. If you change one file, change the other the same way.

Infinitunes owns the canonical fixture. It is the single constant file for the shared credentials, and Lipi reads it through `LOCAL_DEV_CONFIG` (this is a seed-time path, not needed to start the containers):

| Asset                             | Where                                 | Lipi consumes it through |
| :-------------------------------- | :------------------------------------ | :----------------------- |
| Credentials and canonical user ID | Infinitunes `local-dev/fixtures.json` | `LOCAL_DEV_CONFIG`       |

Lipi does not keep a copy of the credentials. Find them in that file (`user.email`, `user.password`).

## Prerequisites

- Bun 1.4.2 (pinned in `package.json` `packageManager`)
- Docker with Compose
- Node 22 only for the realtime process (see [Realtime](#realtime))

## Start once

```bash
cp .env.example .env.local        # local defaults are already filled in
export LOCAL_DEV_CONFIG=/path/to/infinitunes/local-dev/fixtures.json   # only for migrate/seed

bun i
bun run db:up                     # Postgres, Redis, REST adapter (waits for healthy); safe if Infinitunes already started them
```

Then, from the Infinitunes checkout, run its migrations first (it owns the shared `user` and `better_auth_*` tables):

```bash
bun run db:migrate                # in Infinitunes
```

Back in Lipi:

```bash
bun run db:migrate                # Lipi tables only (lipi_*)
bun run db:seed
bun run dev                       # host Next.js on http://localhost:3000
```

Sign in with the email and password from the fixture file (`user.email`, `user.password`; the username also works).

## Commands

| Command                              | Does                                                                                                              |
| :----------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| `bun run db:up` / `db:down`          | `docker compose up -d --wait` / `docker compose down` for the shared containers. `down` keeps the named volumes.  |
| `bun run db:migrate`                 | Apply Lipi migrations. With `LOCAL_DEV_CONFIG` set, history is stored in `drizzle.__lipi_migrations` (see below). |
| `bun run db:seed`                    | Idempotent local seed: shared user, credential account, one workspace with three pages.                           |
| `bun run dev`                        | Next.js dev server on the host.                                                                                   |
| `bun run realtime:dev`               | Hocuspocus server on Node (optional, only for live collaboration).                                                |
| `bun run test`, `type-check`, `lint` | Unit tests (Vitest), TypeScript, ESLint. `bun run test:e2e` needs a running stack.                                |

## Ports and env

| Service            | Port | Env                                                          |
| :----------------- | :--- | :----------------------------------------------------------- |
| App                | 3000 | `AUTH_URL`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`         |
| PostgreSQL         | 5432 | `DATABASE_URL` (shared database name comes from the fixture) |
| Redis              | 6379 | not used directly by Lipi                                    |
| Redis REST adapter | 8079 | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`         |
| Realtime           | 1234 | `NEXT_PUBLIC_LIPI_REALTIME_URL`, `LIPI_REALTIME_PORT`        |

Keep the same local `AUTH_SECRET` / `BETTER_AUTH_SECRET` as Infinitunes (the `.env.example` default, `local-development-secret-must-be-at-least-32-chars-long`, is identical in both). Lipi seeds no Redis data: it only uses Redis for rate limiting, which is off locally (`ENABLE_RATE_LIMITING=false`).

## Shared database, user and prefixes

- One database, one physical `public."user"` table. The seed inserts the fixture user (fixed UUID) plus a `better_auth_account` row with `providerId = 'credential'` and a bcrypt (cost 10) hash. Both apps verify that same hash, so both accept the same login against the same row.
- Shared (unprefixed, owned by Infinitunes migrations): `user`, `account`, `verificationToken`, `better_auth_account`, `better_auth_session`, `better_auth_verification`.
- Lipi tables are prefixed `lipi_`; Infinitunes tables are `infinitunes_`. `drizzle.config.ts` filters on `lipi_*`.
- Sessions live in the shared `better_auth_session` table and the cookie name is Better Auth's default, so on `localhost` a session signed with the same secret is accepted by either app. Both apps run on `localhost` and cookies are not port-scoped, so the shared secret is deliberate: with different secrets the two apps would overwrite each other's cookie and keep signing you out. The trade-off is that one sign-in is valid in both apps.

## Migration history

Both projects use Drizzle. Their default history table is shared, and Infinitunes' newer timestamps would make Drizzle skip every Lipi migration. When `LOCAL_DEV_CONFIG` is set (and `DATABASE_URL` is loopback), Lipi records its history in `drizzle.__lipi_migrations` instead. Without `LOCAL_DEV_CONFIG`, behavior is unchanged and production keeps using the default table.

- Existing local database whose default history holds only Lipi rows: those rows are copied (not moved) on first run.
- Default history that mixes Lipi and other rows: the migration stops with instructions. Reset the local database and migrate Infinitunes first, then Lipi.
- Production adoption is not automated and has not been exercised. See the open item in [todo](./todo.md).

## Seed behavior and safety

`db:seed` refuses to run when `NODE_ENV=production`, when `LOCAL_DEV_CONFIG` is unset, or when `DATABASE_URL` is not `localhost`, `127.0.0.1` or `::1`. It runs in one transaction with `ON CONFLICT DO NOTHING`, so running it twice leaves row counts unchanged. It never updates or deletes existing rows, and it stops if the fixture email already belongs to a different user ID.

## Realtime

`@hocuspocus/server` 4.7 fails under Bun (`crossws` rejects its Node adapter), so `realtime:dev` and `realtime:start` still run on Node 22. Everything else uses Bun.

## Safe reset

- `bun run db:down` stops the shared containers (Infinitunes' too) and keeps the data volumes.
- Do not run `docker system prune` or delete the shared volumes from here: other projects use them.
- To start Lipi data over, drop only the `lipi_*` tables and `drizzle.__lipi_migrations` in the shared database, then rerun `db:migrate` and `db:seed`.
