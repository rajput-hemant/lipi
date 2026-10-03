# Local verification checklist

Runnable steps for the items in [TODO](../TODO.md) section "Needs local environment". Setup details live in [local-development](../local-development.md); the verify skill harness is [.agents/skills/verify](../../.agents/skills/verify/SKILL.md). Tick items here while testing and record results in the TODO, not in this file.

## 0. Setup

1. `cp .env.example .env.local`, then set `AUTH_SECRET` and `BETTER_AUTH_SECRET` (`openssl rand -base64 32`), `DATABASE_URL` for your test database, and optionally `RESEND_API_KEY` and `EMAIL_FROM`.
2. `bun i`, then `bun run db:setup` (auth tables, `lipi_*` migrations, seed). `db:auth` and `db:seed` refuse a non-loopback `DATABASE_URL`, so use a local or tunnelled database for them. Check that `db:migrate` ends with no error: this proves LIP-V001 on an empty database.
3. Terminal 1: `bun run dev`. Terminal 2 (Node 22): `bun run realtime:dev`. Sign in as the seeded user (`fixtures/local-dev-credentials.json`, also logged at dev startup).
4. Create two more users (sign-up) for owner, editor and viewer roles; use separate browser profiles per user.

Gates first: `bun run type-check && bun run lint && bun run test` (expect 100 files, 445 tests).

## 1. Whole-app smoke (30 minutes)

- Sign up, sign out, sign in, wrong password message, reload keeps the session.
- Forgot password: request a link (without a Resend key the link is printed in the server console), open it, set a new password, other sessions are signed out, the link cannot be reused. Signed in: change password from the sidebar account menu.
- Dashboard: create a page and a subpage, rename, duplicate, trash, restore, permanent delete; reload keeps everything. Open a trashed page by URL (TODO: is it editable?).
- Sidebar (shadcn Sidebar): expand and collapse, tooltip on the rail, Ctrl/Cmd+B (also while typing in the editor: bold must not toggle the sidebar), reload keeps the state, 320 and 390 px sheet closes after choosing a page, 768 to 1023 px layout, long page titles, Shift+F10 on a tree item with a real keyboard.
- Search (Cmd/Ctrl+K): results, empty state, Escape, select by keyboard; check a large workspace feels fast after migration `0013` (pg_trgm).
- After navigating between pages with the keyboard, focus lands on the main content; the skip link works.

## 2. Roles, invites, quotas

- Owner invites a user as editor and as viewer (Settings); open the invite link in the other profile: lands on the workspace. Open an invalid link: the "invalid or expired" notice shows.
- Viewer: no New page, no context menu, View only badge, read-only Trash, typed permission toast on forced actions.
- Demote and remove a member while that user has the workspace open: friendly "no longer have access" state on next navigation (TODO F-COR-5: confirm a child page error never reaches the boundary).
- Free plan: second workspace blocked with a readable message, third collaborator blocked (pending invites count), 500 blocks, root-page limit including restore and move to root, ownership transfer to a Free user over the limit is rejected.

## 3. Realtime (three profiles)

- Two and three users edit one page, presence list, viewer cannot type.
- Wait over 60 seconds: token refresh. Stop and restart `realtime:dev`: reconnect. Remove a member: connection closes.
- `pages:changed` messages are accepted from any connected client (TODO F-SEC-6): try sending one from a viewer.

## 4. Billing and API matrix

- `/pricing` anonymous and signed in; Go Pro with Stripe unset shows the unavailable message; with test keys, checkout and portal redirect; send a webhook with a bad signature: generic 400, no internal message.
- Signed-in `curl` with the session cookie against `/api/realtime/token` and `/api/stripe/checkout` for 401, 403, 400 and 503 branches; same-origin check on the token route.
- Uploads (needs UploadThing keys): unauthenticated rejection, viewer denied, editor and owner allowed, URL based cover and logo.

## 5. Browser and production-build checks

- `bun run build` then `bun run start` (the cloud sandbox crashed Bun at the end of `next build`; check it on your machine). Check lobby, auth and dashboard pages, `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, a 404 (must return HTTP 404), error boundaries, and that no credentials are printed on production start.
- Content-Security-Policy is report-only: open the console on lobby, auth, dashboard and editor routes, an avatar, an upload, Stripe redirects and the realtime socket, and note every violation, then decide whether to enforce (TODO F-SEC-2).
- Light and dark on dialogs and auth pages, reduced motion (OS setting), 320, 768, 1280 and 1920 px, more than four collaborators in the header, collapsed rail popover with a long tree, Safari and Firefox.
- Contrast on collaborator cursor colours and presence avatars; run an axe scan if available.

## 6. Existing suites and operations

- `bun run test:e2e` (starts its own throwaway database, realtime and production build): record pass or fail per spec.
- Migration history table on a production-like database and the LIP-V001 `0004` fix on a database that applied the old `0004` (TODO F-OPS-2). `CREATE EXTENSION pg_trgm` must be allowed on production before migration `0013`.
- Production credential backfill for legacy users (TODO F-OPS-1); with it, verify a legacy user can use change password and forgot password (TODO F-AUTH-2).
- Permanent delete of a nested trashed tree against the real database (single `DELETE ... WHERE id IN` against the RESTRICT self-reference).
- OAuth sign-in with real credentials (Google and GitHub).

## Reporting back

For every failed step send the route, the role, what you saw and the browser console plus server log lines. Passing items are ticked off in the TODO with the date and commit.
