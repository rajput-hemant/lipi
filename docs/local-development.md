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

- Bun 1.4.2 (pinned in `package.json` `packageManager`)
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

`db:setup` runs `db:auth`, `db:migrate` and `db:seed` in order. Sign in at `http://localhost:3000/login` with the local user documented in `fixtures/local-dev-credentials.json` (`local@example.test`, `LocalDev123!`). On dev server startup these credentials are logged to the terminal (only when `DATABASE_URL` points to loopback).

Sign in with email and password only. Without `RESEND_API_KEY`, "Forgot password?" on the login form logs the email, reset link included, to the dev server terminal outside production (`lib/email/send-email.ts`); open that link at `/reset-password?token=...`. With the key, set `EMAIL_FROM` too. Signed-in users change their password at `/dashboard/change-password` (sidebar account popover).

`DATABASE_URL` must be set (the `.env.example` value is `postgresql://postgres:postgrespassword@127.0.0.1:5432/local_platforms`). If it is missing, the app, `drizzle-kit` and the seed stop with `DATABASE_URL is not set` instead of connecting as your OS user.

## Commands

| Command                              | Does                                                                                                                                                     |
| :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run db:up` / `db:down`          | `docker compose up -d --wait` / `docker compose down`. `down` keeps the named volumes.                                                                   |
| `bun run db:auth`                    | Create the auth tables (`user`, `better_auth_*`, legacy `account`, `verificationToken`) from `lib/db/auth-migrations`. Loopback only, idempotent.        |
| `bun run db:migrate`                 | `drizzle-kit migrate` for the `lipi_*` tables. History goes to `drizzle.__lipi_migrations` when `DATABASE_URL` is loopback, otherwise the default table. |
| `bun run db:seed`                    | Idempotent local seed: the local user, a credential account, one workspace with three pages.                                                             |
| `bun run db:setup`                   | `db:auth`, `db:migrate`, `db:seed`.                                                                                                                      |
| `bun run dev`                        | Next.js dev server on the host.                                                                                                                          |
| `bun run realtime:dev`               | Hocuspocus server on Node (optional, only for live collaboration).                                                                                       |
| `bun run test`, `type-check`, `lint` | Unit tests (Vitest), TypeScript, ESLint. `bun run test:e2e` starts its own throwaway database.                                                           |

## Environment

`.env.example` is grouped under hash headings, and every variable is read through `lib/env.ts`:

| Group         | Variables                                                                                                       | Local default                                             |
| :------------ | :-------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------- |
| App           | `NEXT_PUBLIC_APP_URL`, `SKIP_ENV_VALIDATION`                                                                    | `http://localhost:3000`, `false`                          |
| Auth          | `AUTH_URL`, `AUTH_SECRET`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`                                              | local URL and a 32+ character dev secret                  |
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
| App                | 3000 | `AUTH_URL`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`  |
| PostgreSQL         | 5432 | `DATABASE_URL`                                        |
| Redis              | 6379 | not used directly by Lipi                             |
| Redis REST adapter | 8079 | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`  |
| Realtime           | 1234 | `NEXT_PUBLIC_LIPI_REALTIME_URL`, `LIPI_REALTIME_PORT` |

Redis is only used for rate limiting, which is off locally (`ENABLE_RATE_LIMITING=false`).

## Tables and prefixes

- Auth tables are unprefixed: `user`, `account`, `verificationToken`, `better_auth_account`, `better_auth_session`, `better_auth_verification`. Sign-in is email and password only.
- Application tables are prefixed `lipi_`; `drizzle.config.ts` filters on `lipi_*`, so `db:generate` never emits auth tables. The auth baseline is generated separately with `drizzle.auth.config.ts`.
- Production keeps the auth tables it already has: `db:auth` refuses non-loopback URLs and `db:migrate` keeps the default history table there.

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
