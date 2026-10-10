---
name: verify
description: "Manual-only verification playbook for Lipi, a Notion-style Next.js 16 web app (workspaces, BlockNote documents, Hocuspocus realtime, Better Auth, Stripe). Use only when the user explicitly asks to verify Lipi: launches an isolated stack, checks readiness, drives a mapped feature through the browser UI with chrome-devtools-axi, and records evidence. Partially live-proven; see features/README.md for per-feature status."
disable-model-invocation: true
---

# Verify Lipi

**Manual trigger only.** Run this skill only when the user explicitly asks to verify Lipi. Commits, pushes, PR creation and enabling other modes do not authorize it, and nothing in this repo (git hooks, package lifecycle scripts, CI) starts it. Do not add commit/push hooks, CI jobs or schedules for it.

Invoke it standalone:

- Claude Code: `/verify`.
- Codex: `$verify` where the skill is discovered; otherwise explicitly read and follow `.agents/skills/verify/SKILL.md`.
- Any other agent: read and follow this file explicitly.

**Status: partially live-proven.** Launch, doctor, auth, workspace, document, trash, invite, realtime, viewer, theme and mobile-layout flows were driven in a real browser on 2026-10-02 at commit `815ceda`; the 2026-10-10 sessions in `docs/verification/` (`r4-sec`, `r4-ui`, and the `r4-vskill` run that re-drove this skill's launch, doctor, drive, evidence and cleanup steps at `37e892b`) added CSP, three-user realtime, search, uploads (no credentials), billing (no credentials) and public-route proof. Browser authorization for those runs came from task briefs; a new run needs a fresh explicit request. Per-feature status and evidence are in [features/README.md](features/README.md); only features with a `Last live proof:` date were exercised, and only the sub-features ticked in their files. Do not write PASS for anything not exercised in a run.

Read `AGENTS.md` first: this is a breaking-changes Next.js 16; read the relevant guide in `node_modules/next/dist/docs/` before changing app code. This skill does not change product code.

Project overview and setup: [README.md](../../../README.md). Scope and acceptance criteria: [docs/requirements/requirements.md](../../../docs/requirements/requirements.md). Open work: [docs/TODO.md](../../../docs/TODO.md). Known problems, hypotheses and coverage gaps live in exactly one place: [docs/verification/verification-issues.md](../../../docs/verification/verification-issues.md) (IDs `LIP-Vnnn`). Feature files link to it and do not repeat it.

## Surface

Primary surface is the web UI (Next.js App Router, port 3000 by default; 3161 in this skill). A second long-lived process, the Hocuspocus realtime server (`realtime/server.ts`), is required for the document editor; without it pages show "Syncing page..." / "Reconnecting to collaborators...". Secondary surfaces are plain HTTP routes (`/api/auth/*`, `/api/realtime/token`, `/api/stripe/*`, `/api/uploadthing`). Lipi has no CLI.

## Prerequisites

- `bun`, `docker` (disposable Postgres only), a free set of ports (below), Node 22 for `realtime/bootstrap.mjs` (Hocuspocus does not run under Bun; Node 24 also worked in the `r4-sec` run).
- Dependencies installed (`bun i`). `node_modules` is not shared between worktrees.
- No real credentials are needed or allowed. Use the throwaway env block below. OAuth (Google/GitHub), Stripe, UploadThing and Upstash need real credentials and are therefore GAPs, not drive targets.
- Never point `DATABASE_URL` at the shared local development database or any production database.

## Isolation: data and ports

Lipi's own e2e uses fixed names (`lipi-p9-e2e-pg`, ports 5544/3100/1235; see `tests/e2e/env.ts`). Do not reuse them while another run may be active. Verification uses its own:

| Resource           | Value                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| Postgres container | `lipi-verify-pg` (postgres:18, `--rm`, tmpfs data)                                 |
| Postgres port      | `127.0.0.1:5561`                                                                   |
| App (Next)         | `127.0.0.1:3161`                                                                   |
| Realtime           | `127.0.0.1:1261`                                                                   |
| Scratch dir        | `$SCRATCH/lipi-verify` (evidence under `$SCRATCH/lipi-verify/evidence/<feature>/`) |

`$SCRATCH` is the agent's per-session scratch directory (create `$SCRATCH/lipi-verify/evidence` before launch). One dev/prod server per task. If any of those ports is already taken, stop and pick the next free triple; never kill a process you did not start.

Throwaway env. Put it in a file (for example `$SCRATCH/lipi-verify/env.sh`) and start every process as `env -i PATH="$PATH" HOME="$HOME" bash -c 'source <file>; exec <command>'` so no `DATABASE_URL` or other variable from the calling shell can leak in (an earlier run started Next with a shared database that way). Values are fake and local-only:

```sh
export DATABASE_URL=postgresql://postgres:test@127.0.0.1:5561/postgres
export SKIP_ENV_VALIDATION=true
export BETTER_AUTH_SECRET=verify-local-auth-secret-min-32-characters-long
export BETTER_AUTH_URL=http://127.0.0.1:3161
export NEXT_PUBLIC_APP_URL=http://127.0.0.1:3161
export NEXT_PUBLIC_LIPI_REALTIME_URL=ws://127.0.0.1:1261
export LIPI_REALTIME_PORT=1261 LIPI_REALTIME_ADDRESS=127.0.0.1
export LIPI_REALTIME_ALLOWED_ORIGINS=http://127.0.0.1:3161,http://localhost:3161
export ENABLE_RATE_LIMITING=false UPSTASH_REDIS_REST_URL= UPSTASH_REDIS_REST_TOKEN=
export GOOGLE_CLIENT_ID=verify GOOGLE_CLIENT_SECRET=verify GITHUB_CLIENT_ID=verify GITHUB_CLIENT_SECRET=verify
```

This mirrors `e2eProcessEnv()` in `tests/e2e/env.ts` with different ports. Use `127.0.0.1` consistently (not `localhost`): the realtime token route and cookie host matching treat them as one origin only through `normalizeLoopbackHost` in `app/api/realtime/token/route.ts`, but cookies are host-bound.

## Launch

Do this once per run. Steps are the documented e2e path adapted to isolated names; executed live on 2026-10-02 (see ledger LIP-V012).

1. Database container:
   ```sh
   docker run -d --rm --name lipi-verify-pg -e POSTGRES_PASSWORD=test \
     -p 127.0.0.1:5561:5432 --tmpfs /var/lib/postgresql postgres:18.6-alpine
   until docker exec lipi-verify-pg pg_isready -U postgres -h 127.0.0.1; do sleep 1; done
   ```
2. Schema. The throwaway database is loopback, so the local scripts apply on an empty database. `db:setup` runs `db:auth`, `db:migrate` and `db:seed` (the seed creates `local@example.test`, one workspace and a few pages; use it, or the sign-up form for fresh users):
   ```sh
   bun run db:setup
   ```
   Push alternative (auth tables first, then `lipi_*`; this is what the e2e suite uses):
   ```sh
   bunx drizzle-kit push --force --config tests/e2e/drizzle-auth.config.ts
   bunx drizzle-kit push --force --config tests/e2e/drizzle-lipi.config.ts
   ```
   (`tests/e2e/apply-auth-database.ts` / `apply-lipi-database.ts` document these.)
3. Realtime server, log to the scratch dir. Start it as its own backgrounded harness task (the tool's background-run option), not a trailing `&` inside a shell call that returns: the child dies when the call returns and the browser then shows `ERR_CONNECTION_REFUSED` on form submits. Command: `env -i ... bash -c 'source env.sh; exec bun run realtime:start' > "$SCRATCH/lipi-verify/realtime.log" 2>&1`. The port owner is the pid record:
   ```sh
   sleep 3; lsof -tiTCP:1261 -sTCP:LISTEN > "$SCRATCH/lipi-verify/realtime.pid"
   ```
4. App. The e2e path uses a production build; a dev server also works but is slower per route and logs extra dev warnings that must not be counted as product console errors.
   ```sh
   env -i PATH="$PATH" HOME="$HOME" bash -c 'source env.sh; bun run build'
   # separate backgrounded task, same env.sh:
   env -i PATH="$PATH" HOME="$HOME" bash -c 'source env.sh; exec bunx next start --port 3161 --hostname 127.0.0.1' > "$SCRATCH/lipi-verify/app.log" 2>&1
   sleep 6; lsof -tiTCP:3161 -sTCP:LISTEN > "$SCRATCH/lipi-verify/app.pid"
   ```
   `SKIP_ENV_VALIDATION=true` from the env block is enough for the build; no real credentials are needed.
   Dev alternative: `bunx next dev --turbopack --port 3161 --hostname 127.0.0.1` (the package `dev` script has no port flag).

**Ready when:** `curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3161/` prints `200` **and** `nc -z 127.0.0.1 1261` succeeds. For the build path, the app log shows `Ready`.

## Doctor (read-only)

Run first whenever anything looks off. It changes nothing.

```sh
docker ps --filter name=lipi-verify-pg                                          # our container, port 5561
docker exec lipi-verify-pg psql -U postgres -tAc "select count(*) from information_schema.tables where table_name like 'lipi_%'"   # > 0
kill -0 "$(cat $SCRATCH/lipi-verify/app.pid)" && kill -0 "$(cat $SCRATCH/lipi-verify/realtime.pid)"   # both are ours
lsof -nP -iTCP:3161 -sTCP:LISTEN | grep "$(cat $SCRATCH/lipi-verify/app.pid)"                # port owned by us
nc -z 127.0.0.1 1261                                                                           # realtime listening
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3161/pricing                        # 200, public route
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://127.0.0.1:3161/dashboard       # 307 -> /login?from=%2Fdashboard (proxy gate)
curl -s -X POST -H 'content-type: application/json' -d '{"roomName":"x"}' \
  -o /dev/null -w '%{http_code} %{redirect_url}\n' http://127.0.0.1:3161/api/realtime/token    # 307 -> /login?from=%2Fapi%2Frealtime%2Ftoken (proxy gates all /api except /api/auth)
```

Worth driving only if every line above matches. A foreign process on a port, a missing `lipi_*` table, or a `/dashboard` response other than a redirect to `/login` means the instance is not the one this skill launched (or auth gating is broken): stop and record it in the ledger instead of driving.

## Drive

Browser tool: `chrome-devtools-axi` (read `chrome-devtools-axi --help` first). Per role (`a`, `b`, `anon`) use one bridge session, which gets its own isolated temporary Chrome profile and cookie jar:

```sh
export CHROME_DEVTOOLS_AXI_SESSION=lipi-browser-verification-<role>
export CHROME_DEVTOOLS_AXI_MCP_PATH="$(command ls -d ~/.npm/_npx/*/node_modules/chrome-devtools-mcp | head -1)/build/src/bin/chrome-devtools-mcp.js"   # optional: skips the npx bootstrap; verify with `ls`, and leave it unset if the path does not exist
unset CHROME_DEVTOOLS_AXI_AUTO_CONNECT CHROME_DEVTOOLS_AXI_USER_DATA_DIR CHROME_DEVTOOLS_AXI_BROWSER_URL   # never attach to the user's browser
chrome-devtools-axi open http://127.0.0.1:3161/signup
```

Do not wrap `chrome-devtools-axi` in a CPU-throttling wrapper (a `heavy`-style queue): the bridge then exits with `BRIDGE_NOT_READY` before Chrome is up. `chrome-devtools-mcp` is not on `PATH` in a typical setup, so a `which`-derived `CHROME_DEVTOOLS_AXI_MCP_PATH` is an empty path and fails the same way.

Tool behaviors learned live: element refs (`@g1:1_20`) go stale after every action, so re-run `snapshot` and pick the fresh ref before each `click`/`fill`; wrap that in a tiny shell helper that greps the snapshot line by role and name and acts on its `uid`. `fill` replaces a field's value, `type` appends to the focused element. There is no right-click: open the sidebar tree context menu by dispatching a `contextmenu` MouseEvent on the `[id^=document-tree-item]` link via `eval` (state this when citing it; hardware-keyboard `Shift+F10` is unproven). The accessibility snapshot does not list the ⌘K search results (`listbox` shows no options): read them with `eval "() => document.querySelector('[role=dialog]').innerText"`; open the dialog with `press Meta+k`, set the query with `fill` on the `combobox`. `screenshot <path>`, `console --type error` and `network` give evidence; `resize 390 844` emulates mobile.

A fresh-ref helper pattern that worked (`act.sh click|fill '<grep pattern>' [text]`): run `chrome-devtools-axi snapshot`, `grep -m1 -E "$pattern"`, extract `uid=` as `@uid`, then call the action. For fields that share a name (the two `••••••••••` password boxes on `/signup`) take the nth match.

Stable handles, confirmed live unless marked otherwise:

- Auth forms: placeholder `you@domain.com` (email), `••••••••••` (password; two on `/signup`, the second is confirm), buttons `Sign Up`, `Login with Email`. Routes `/login`, `/signup`, `/forgot-password`, `/reset-password`.
- Dashboard: `/dashboard` redirects to `/dashboard/<workspaceId>` or `/dashboard/new-workspace`; workspace form placeholder `Workspace name`, button `Create workspace`.
- Sidebar: `aria-label="Workspace pages"`, tree role `tree`, button `New page` / `Cancel new page`, link by page title, context menu item `New subpage`, toast `Page created.`.
- Editor: `.bn-editor`, text `Syncing page...`, `Reconnecting to collaborators...`, `View only` (viewer), `aria-label="Page collaborators"`, `aria-label="Breadcrumb"`, `aria-label="Choose page icon"`.
- Search: `aria-label="Search documents"`, `title="Search (⌘K)"`, shortcut Cmd/Ctrl+K, input placeholder `Type to search pages or body text...`.
- Search results are only in the DOM text (see above); zero-result copy `No pages match “<query>”.`.
- Trash: `Trash` dialog, empty text `Nothing in the trash`, buttons `Restore <title>` and `Delete <title> permanently`, then alertdialog `Delete permanently?` with `Cancel` / `Delete permanently`; context menu items `New subpage`, `Rename`, `Duplicate`, `Move to trash`; toasts `Moved to trash.`, `Page deleted permanently.`.
- Settings dialog: button `Settings`, field `Invite by email`, role `<select>` (`editor`/`viewer`), button `Invite`, toast `Invite created`, section `Danger zone`, `Transfer ownership`, `Delete workspace`.
- Pricing: signed in, button `Go Pro` (toast `Billing unavailable` / `Stripe billing is not configured` without Stripe env); signed out, link `Sign in to upgrade` to `/login` and `Get Started` on the Free card. Footer theme toggle buttons are `Toggle Light Mode` / `Toggle Dark Mode` / `Toggle System Mode`.
- Theme: button `Toggle theme` opens menu items `Light` / `Dark` / `System` (`html` class becomes `dark`).
- Mobile nav: `aria-label="Open navigation menu"` (appears at 390 px). In the dashboard the sidebar trigger is `Toggle Sidebar` (sheet below 768 px, icon rail on desktop, cookie `sidebar_state`).
- Settings members: row role button (`Editor`) opens menu `Editor` / `Viewer` / `Remove`.

Multi-user flows need **separate bridge sessions (one per user)** (one cookie jar per user), never one shared logged-in profile. Never drive the user's own authenticated browser session.

Create users through the real sign-up form. Use unique emails like `verify-<label>-<timestamp>@example.com` and a password that satisfies `passwordSchema` in `lib/validations.ts` (8+ chars, upper, lower, digit, special; e.g. `Verify-test-password-9`). Pace sign-ups roughly 11 s apart: in a production build Better Auth's built-in limiter stays on regardless of `ENABLE_RATE_LIMITING` (`lib/auth/auth-rate-limit.ts` only disables it outside production when `DISABLE_AUTH_RATE_LIMIT=true`), and the e2e helper paces for it (`tests/e2e/helpers/auth.ts`).

Invite acceptance needs the invite token, which is emailed in production but has no mailer locally. Read it read-only from the disposable DB (note: the token is consumed on accept and the invite row is deleted):

```sh
docker exec lipi-verify-pg psql -U postgres -tAc \
  "select token from lipi_workspace_invites where lower(email)=lower('<email>') order by created_at desc limit 1"
```

## Evidence

Store under `$SCRATCH/lipi-verify/evidence/<feature>/` and copy the final set into the task's private report. A proof must:

- exercise the real UI path, not internal setters, direct DB writes or test-only endpoints (the invite-token lookup above is a read of an unavoidable out-of-band channel, and must be stated as such);
- capture the action and the resulting state, not only the final screen;
- verify side effects alongside what is visible: rows via `docker exec lipi-verify-pg psql ...` (`user`, `better_auth_account`, `lipi_workspaces`, `lipi_workspace_members`, `lipi_workspace_invites`, `lipi_documents`, `lipi_realtime_documents`), HTTP status codes for gated routes, and `app.log` / `realtime.log` lines;
- record browser console errors/warnings and the build/commit (`git rev-parse --short HEAD`) of the instance;
- for UI quality, capture light and dark, 390 px and 1280 px, empty/loading/error/long-content states, keyboard focus order, and reduced motion, when the browser skill allows it.

Update the feature file's `Last live proof:` with date, commit, and evidence path. File anything that goes wrong in the ledger with a `LIP-Vnnn` ID (CONFIRMED with reproduction, HYPOTHESIS, or GAP) rather than describing it in the feature file.

## Cleanup

Tear down only what this run started, in this order. Evidence under `$SCRATCH/lipi-verify/evidence/` is preserved.

```sh
kill "$(cat $SCRATCH/lipi-verify/app.pid)" "$(cat $SCRATCH/lipi-verify/realtime.pid)"
for r in a b anon; do CHROME_DEVTOOLS_AXI_SESSION=lipi-browser-verification-$r chrome-devtools-axi stop; done   # one bridge per role you opened
docker rm -f lipi-verify-pg
docker ps -a --filter name=lipi-verify     # confirms nothing is left
rm -f "$SCRATCH/lipi-verify/"*.pid*         # keep *.log, env.sh and evidence/
lsof -nP -iTCP:3161 -iTCP:1261 -iTCP:5561 -sTCP:LISTEN   # prints nothing when every port is free
```

Never `pkill node`, `killall bun`, or kill by process name. If a pid file is missing, find the owner with `lsof -nP -iTCP:3161 -sTCP:LISTEN` and confirm it is yours before stopping it. Remove `.next` only if this run created it.

## Helpers

None ship in the repo. Every command is shown inline above; the snapshot-grep helper is described under Drive.

## Coverage

See [features/README.md](features/README.md) for the feature index with status per feature. Unexercised features stay DRAFT with `Last live proof: none`; partially exercised ones say which sub-features were proven. Non-browser type-check, lint and unit results in the ledger are not proof of any UI or authentication flow.
