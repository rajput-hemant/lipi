# Local verification session R4-VSKILL, 2026-10-10

Branch `task/r4-vskill`, base `feat/complete-lipi` at `37e892b`. Maintenance pass over `.agents/skills/verify` (`.claude/skills/verify` is a symlink to it). Production build (`bun run build`, `bunx next start`), realtime `node realtime/bootstrap.mjs`, browser `chrome-devtools-axi` session `task-r4-vskill`. Every process ran under `env -i` with an explicit `DATABASE_URL`.

## Environment

- Postgres `lipi-r4v-pg` (`postgres:18.6-alpine`, tmpfs) on `127.0.0.1:55459`; `bun run db:setup` applied auth, Lipi migrations and the seed.
- App `127.0.0.1:3119`, realtime `127.0.0.1:1259`. No Stripe, UploadThing, OAuth or Resend credentials.
- One user created through the sign-up form (`verify-a-1@example.com`), workspace `Verify WS`, pages `Alpha` and `Beta`.

## Skill steps exercised

| Step                                          | Result                                                                                                                                                                                                  |
| :-------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Launch: container, `db:setup`, build, servers | pass after fixes: the old `db:auth` + `db:migrate` recipe leaves no seed; servers must be separate backgrounded tasks                                                                                   |
| Doctor                                        | pass: 8 `lipi_%` tables, `/pricing` 200, `/dashboard` 307 to `/login?from=%2Fdashboard`, anonymous token route 307, ports owned by the recorded pids, realtime `nc -z` ok                               |
| Drive: browser                                | first two attempts failed with `BRIDGE_NOT_READY`: the documented `which chrome-devtools-mcp` path is empty here, and wrapping the CLI in `heavy` also fails; works with the npx-cache path, no wrapper |
| Evidence and cleanup                          | browser session stopped, both servers killed by port owner, container removed, ports 3119, 1259, 55459 free                                                                                             |

## Features exercised

| Feature                         | Result                                                                                                                                                                                                                                                                                                                 |
| :------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Uploads (no live proof before)  | anonymous POST with body: 403 `Unauthorized` (no body: 400); owner in-page POST for `workspaceLogo`: 500 `Missing token...`; Settings logo URL saved, toast `Workspace updated`, `lipi_workspaces.logo` set. Viewer 403 not re-driven. Console: `ERR_NAME_NOT_RESOLVED` from the example.com logo and the expected 500 |
| Billing                         | anonymous `/pricing`: `Get Started`, `Sign in to upgrade`; signed in `Go Pro`: 503, toast `Billing unavailable` / `Stripe billing is not configured`, stays on `/pricing`; webhook 400 `Missing signature` and 400 `Invalid webhook signature`                                                                         |
| Trash and search                | `Alpha` and `Beta` given body `needle-zz1` (rows contain it); `Meta+k` plus `fill` listed both; `Move to trash` on `Alpha` (toast `Moved to trash.`, `in_trash` t) left only `Beta`; `Restore Alpha` set `in_trash` f. Search results are visible only in the dialog DOM text, not in the accessibility snapshot       |
| Public routes                   | `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` 200; robots disallows `/api/` and `/dashboard/`; `GET /nope` anonymous is 307 to `/login?from=%2Fnope`                                                                                                                                                          |
| Auth, workspace, document pages | sign-up through the form landed on `/dashboard/new-workspace`; `Create workspace`; `New page` with inline title, toast `Page created.`; body typing persisted to `lipi_documents.content`                                                                                                                              |

## Not exercised in this run

Realtime collaboration (covered by the r4-sec doc), invites and roles, change-password and reset flow, UI quality at 390 px, uploads for viewer and editor, signed-in unknown-route page, subpages, rename, duplicate, trash descendants, block quota.
