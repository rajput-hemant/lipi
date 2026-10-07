# Local verification session R3-G, 2026-10-07

Branch `task/r3-g`, base `feat/complete-lipi` at `978669f`. Next.js 16.3.6 (Turbopack dev, production build for the status check), Node 22.13.1, Bun 1.4.x. Every Next, realtime and Playwright process was started with `env -i` and an explicit private `DATABASE_URL`.

## Environment

- Private Postgres container `lipi-r3g-pg` (`postgres:18.6-alpine`, tmpfs data) on `127.0.0.1:55450`; `bun run db:setup` applied the auth schema, 15 Lipi migrations and the seed.
- Dev server on `3110`, realtime on `1250`, browser via `chrome-devtools-axi` session `r3g`.
- The dev server banner "Local development account" prints `127.0.0.1:5432/local_platforms`. That text comes from `fixtures/local-dev-credentials.json` (`lib/dev-credentials-logger.ts`), not from the live `DATABASE_URL`, so it is misleading. Real connections were checked with `lsof`: only `127.0.0.1:55450` sockets from the Next processes, none to 5432 or 6379.
- The e2e suite hard-codes app 3100, realtime 1235 and Postgres 5544 in `tests/e2e/env.ts`. Port 3100 is reserved for another project, so `env.ts` was temporarily edited (ports 3110, 1250, 55450, container `lipi-r3g-e2e-pg`) for the run and restored with `git checkout`; it is not part of the commit.

## 1. `tests/e2e/roles.spec.ts`: verified-pass

`env -i ... bunx playwright test tests/e2e/roles.spec.ts` (suite builds the app, starts realtime, creates its own throwaway DB):

```
✓ 1 tests/e2e/roles.spec.ts:52:7 › role-based access › viewer is read-only, editor cannot manage the workspace, anonymous is redirected (23.9s)
1 passed (46.8s)
```

The spec has one test, so one result. No selector in the assertions added by `0596e39` needed a fix; the spec file is unchanged.

## 2. Nonexistent workspace and document h1

### `/dashboard/00000000-0000-4000-8000-000000000000`: verified-FAIL on "HTTP 404"

Signed in as the seeded user:

| Where                       | Status | Body                                                                    |
| :-------------------------- | :----- | :---------------------------------------------------------------------- |
| dev, in-page `fetch`        | 200    | "Page not found" heading (h1), `<meta name="robots" content="noindex">` |
| production build, `curl -b` | 200    | contains "Page not found"                                               |

The layout's `notFound()` (commit `141900c`) works for the UI and sets noindex, but the HTTP status is 200 in dev and in `next start`. Likely cause (not verified): `app/dashboard/loading.tsx` makes the shell flush with 200 before the layout awaits the session and membership, so the status is already committed when `notFound()` throws. The unit test only asserts that `notFound()` is called, so it cannot see this. Fixing it needs a routing change outside this task's file set.

React error #441: not present. The console shows only two Base UI warnings from `NotFound` (see findings).

### Document page h1: verified-pass

- `Welcome` (`...0011`): title `Welcome`, exactly one `<h1 class="sr-only">Welcome</h1>`.
- `Scratchpad` (`...0013`): title `Scratchpad`, exactly one `<h1>` with `Scratchpad`.
- Third item `Third root` in the sidebar was not in the database (browser-persisted tree from an earlier session); its page correctly showed "Document not found" with an h2 and no h1. Not a repo bug.

axe itself was not run; the h1 count was read from the DOM.

## 3. F-NEW-19 `Yjs was already imported`: verified-pass, config kept

| Run                                                  | Warning count | Realtime sync                                                            |
| :--------------------------------------------------- | :------------ | :----------------------------------------------------------------------- |
| Baseline (fresh dev start, login, workspace, docs)   | 1             | two tabs on one doc: typed text appeared live, remote cursor label shown |
| `serverExternalPackages: ["yjs"]`, fresh `.next/dev` | 0             | same two-tab check: both the earlier and the new text present live       |
| Control (config reverted, fresh `.next/dev`)         | 1             | -                                                                        |

The warning is printed on the first server render of a workspace or document route; the same warning also appeared in the production `next start` log during the e2e run. `next.config.ts` keeps the one-line addition. `next build` with the option succeeds.

## Findings outside the task

1. Nonexistent workspace returns 200 (above).
2. On a cold dev server, the first request to `/dashboard/[workspaceId]/[fileId]` logs `Error: Route ... encountered the unstable value new Date() while prerendering` from `lib/auth.ts:35` (`getSession` via `DashboardLayout`). It happens with and without the `yjs` option (control run), and did not appear when the route was reached through `/login` and `/dashboard` first.
3. `NotFound` logs two Base UI errors ("expected a native button because the nativeButton prop is true") in the console on the not-found page and on "Document not found".
4. The dev banner prints fixture database coordinates instead of the live `DATABASE_URL`.

## Not verified

- Stripe, Resend, OAuth and UploadThing flows (no credentials).
- axe-core run (only the DOM h1 count).
- The cause of the 200 status (hypothesis only).

## Cleanup

Dev, realtime, `next start`, the browser session and both containers (`lipi-r3g-pg`, the e2e `lipi-r3g-e2e-pg`) were stopped; ports 3110, 1250, 55450 and 9224 are free. Containers `sv-pg-20261007` and `local-platforms-redis` were not touched.
