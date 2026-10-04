# Lipi verification issue ledger

Canonical and only issue ledger for Lipi verification. Feature maps in [.agents/skills/verify/features](../../.agents/skills/verify/features/README.md) link here by ID and do not repeat the text. The harness is [.agents/skills/verify/SKILL.md](../../.agents/skills/verify/SKILL.md) (DRAFT).

Classes:

- **CONFIRMED**: reproduced with a command or deterministic file:line a reader can re-run.
- **HYPOTHESIS**: suspected from source or docs; not exercised at runtime.
- **GAP**: coverage not exercised. A GAP is never a PASS.

Date of the first (non-browser) pass: 2026-10-02, base `91f5f4b`. Date of the browser pass: 2026-10-02, commit `815ceda` (`fm/lipi-browser-verification` from `feat/complete-lipi`), production build on an isolated stack (ports 3161/1261/5561), Chrome via `chrome-devtools-axi` with one isolated profile per user. No product code was changed; findings below are for later ships. Raw evidence lives in the private task data directory `lipi-browser-verification/evidence/`, outside the repo.

## New evidence in this pass (non-browser)

| Check                | Command                                                                                                                                                     | Result                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Types                | `bun run type-check`                                                                                                                                        | exit 0                                             |
| Lint                 | `bun run lint`                                                                                                                                              | exit 0                                             |
| Unit tests           | `bun run test` (`vitest run --maxWorkers=2`)                                                                                                                | 62 files, 225 tests passed                         |
| Greenfield migration | disposable `postgres:18` on `127.0.0.1:5561`, `DATABASE_URL=postgresql://postgres:test@127.0.0.1:5561/postgres SKIP_ENV_VALIDATION=true bun run db:migrate` | failed, see LIP-V001; container removed afterwards |

These pass/fail results prove only the code paths the unit tests cover. They do not prove any UI or authentication flow.

## Prior proofs (separate from this pass)

Not re-run here and not counted as new verification:

- Playwright specs `tests/e2e/auth-workspace.spec.ts`, `documents-editor.spec.ts`, `collaboration.spec.ts`, `stripe-checkout.spec.ts`, added in `4b4b717` (`test(e2e): add playwright suite with throwaway postgres setup`) and cited as evidence in [requirements](../requirements.md) and [todo](../todo.md). Stripe is mocked there.
- Earlier trash UI polish is cited as landed (`0b86a64`), proved by `components/trash.test.tsx` only.

## Corrected stale process items

- Root `README.md` had been reduced to a pointer to `docs/project.md`. The body is restored to `README.md` and the duplicate `docs/project.md` removed (commit "docs: restore root README body and drop duplicate docs/project.md"). Links in other docs to `docs/project.md`: none existed.
- [todo](../todo.md) says its checked items cite files but "the tests were not re-run when this index was written". This pass re-ran type-check, lint and unit tests (table above); it did not re-run e2e.

## Issues

### LIP-V001 Greenfield `bun run db:migrate` fails

- Class: CONFIRMED. Severity: medium. State: fixed (2026-10-02, fix branch `fm/lipi-verified-issue-fixes`).
- Surface: `bun run db:migrate` (`lib/db/migrate.ts`, migrations in `lib/db/migrations/`); documented as the setup path.
- Evidence: command in the table above printed `PostgresError: column "in_trash" cannot be cast automatically to type boolean` ... `hint: You might need to specify "USING in_trash::boolean"`, code `42804`, then `error: script "db:migrate" exited with code 1`. The same limitation is described in the comment at the top of `tests/e2e/apply-lipi-database.ts` (it works around it with `drizzle-kit push`).
- Reproduction: 1) `docker run -d --rm --name lipi-verify-pg-draft -e POSTGRES_PASSWORD=test -p 127.0.0.1:5561:5432 --tmpfs /var/lib/postgresql postgres:18`; 2) wait for `pg_isready`; 3) run the migrate command above; 4) `docker rm -f lipi-verify-pg-draft`.
- Expected: migrations apply to an empty database. Actual: fails at the `in_trash` text-to-boolean step (migration 0004 per the e2e comment; the failing statement was not isolated here).
- Re-run 2026-10-02 (`815ceda`): exit 1 again; the failing statement is `ALTER TABLE "lipi_files" ALTER COLUMN "in_trash" SET DATA TYPE boolean;`. Everything else in the browser pass used the e2e `drizzle-kit push` path on a throwaway database; that alternate setup is **not** evidence that production migrations pass.
- Fix: `0004_minor_micromacro.sql` now drops the text default, casts with `USING "in_trash"::boolean`, then restores `DEFAULT false`, for each of the three tables. Drizzle's migrator skips migrations whose `created_at` is not newer than the last applied one, so databases that already applied 0004 are untouched; the journal and every other migration are unchanged. Proof on a disposable `postgres:18` (127.0.0.1:5562): empty database, shared auth tables via the e2e push config, then `bun run db:migrate` applied all 13 migrations (`__drizzle_migrations` count 13), a second run was a no-op, `in_trash` is `boolean` default `false`, and the 0004 statements converted rows `'true'`/`'false'` to `t`/`f` in a scratch table. Not proven: a database that really applied the old 0004 (none exists locally); `drizzle-kit push` was not used for the migrated schema.

### LIP-V002 Username sign-in may not match the shared auth schema

- Class: HYPOTHESIS. Severity: medium. State: open.
- Surface: `/login` username toggle, `lib/auth/create-auth.ts` username plugin.
- Evidence: `app/(auth)/components/login-form.tsx` calls `signIn.username(...)` in username mode; `lib/auth/create-auth.ts` registers the `username` plugin and `additionalFields.username`; `lib/db/shared-auth-schema.snapshot.json` and `lib/db/schema/auth.ts:20` still carry a `username` column; `docs/requirements.md` §3.1 says "email/username sign-in". The fleet research report (private) notes that Infinitunes, which owns the shared auth tables, removed username in its own history (`1e73ae3`).
- Reproduction (needs a stack with Infinitunes' migrations, `INFINITUNES_ROOT`): sign up by email, try username sign-in; inspect the `user` table columns on the Infinitunes-migrated DB.
- Expected: username sign-in works or is removed consistently across docs, UI and schema. Actual: unknown.
- Gap: the Infinitunes checkout was not available; behavior unexercised.
- Follow-up: source check against Infinitunes' schema, then decide to keep or remove the toggle.

### LIP-V003 Reset-password server action: unauthenticated, enumerating, unthrottled

- Class: HYPOTHESIS. Severity: medium. State: open.
- Surface: `/reset-password` -> `resetPassword` in `lib/actions.ts` ("use server").
- Evidence: `lib/actions.ts` (function `resetPassword`) throws `User not found, please try signing up` for unknown emails and `Previous password is incorrect, please try again` for wrong passwords, and has no session check; it is not routed through Better Auth, whose limiter (`lib/auth/auth-rate-limit.ts`) therefore does not cover it; proxy limiting is active only with `ENABLE_RATE_LIMITING=true`, production and Redis (`lib/proxy/rate-limiting.ts`).
- Reproduction (not run): submit the form with known and unknown emails and compare error messages; repeat wrong passwords quickly.
- Expected: no account enumeration; throttled attempts. Actual (from source): distinguishable errors and an old-password check an unauthenticated caller can repeat.
- Gap: server action unexercised; real throttling depends on deployment config.
- Follow-up: separate hardening ship after a live repro.

### LIP-V004 Invite page sends `callbackUrl`, login reads `from`

- Class: HYPOTHESIS. Severity: low. State: open.
- Surface: `app/invite/[token]/page.tsx`, `app/(auth)/components/login-form.tsx`.
- Evidence: `redirect(\`/login?callbackUrl=...\`)`in the invite page versus`searchParams.get("from")`in the login form;`proxy.ts`already redirects unauthenticated`/invite/...`requests to`/login?from=...` first, so the page branch is probably unreachable in practice.
- Reproduction (not run): open `/invite/<token>` logged out, log in, check the landing URL.
- Expected: land on the invite and accept it. Actual: expected to work via the proxy `from` path; unverified.
- Update 2026-10-02: the dead page branch is gone with LIP-V019's route handler, which now uses `from`. A signed-out `?from=` round trip through the proxy was not driven.

### LIP-V005 `?invite=invalid` is never displayed

- Class: HYPOTHESIS. Severity: low. State: open.
- Surface: `/invite/<bad-token>`.
- Evidence: `app/invite/[token]/page.tsx` redirects to `/dashboard?invite=invalid`; `app/dashboard/page.tsx` ignores search params and redirects again; `grep -rn "invite=invalid" app components lib` finds only the redirect.
- Expected: a visible "invalid or expired invite" message. Actual (source): silent landing in the default workspace or new-workspace page.
- Browser pass: the banner is still not shown, and the same redirect is hit after a successful accept, see LIP-V019.
- Follow-up: browser check, then a small UX ship.

### LIP-V006 Newsletter form reports success without subscribing

- Class: CONFIRMED (deterministic source). Severity: low. State: fixed (2026-10-04, source-only).
- Surface: footer newsletter form.
- Evidence before removal: `components/site-footer/newsletter-subscription-form.tsx:32` `// TODO: Add newsletter subscription logic here.`; the action returns `subscribed: true` after a timed toast `You have successfully subscribed to our newsletter.`. Original source command: `sed -n 28,42p components/site-footer/newsletter-subscription-form.tsx`.
- Expected: either a real subscription or no success claim. Actual before removal: success toast, nothing stored or sent.
- Fix 2026-10-04: removed the newsletter section and its import from `components/site-footer/footer.tsx`, the only caller, and deleted `components/site-footer/newsletter-subscription-form.tsx`. Lipi no longer offers the unsupported subscription or claims success. No new live proof; footer layout remains unexercised after removal.

### LIP-V007 Auth flows partly exercised in a browser

- Class: GAP (partial). Severity: medium (coverage). State: open.
- Exercised 2026-10-02: sign-up with required and mismatch validation, sign-in, wrong-password message, sign-out, `/dashboard` redirect when logged out, authenticated redirect away from `/login`. NOT exercised: reset password, username sign-in, `?from=` return after login, password-rule messages, session expiry, unknown-user message.
- Scope: sign-up, sign-in, sign-out, validation messages, redirect handling, authenticated-user redirect away from auth pages, reset password, session persistence after reload. Feature: [auth-session](../../.agents/skills/verify/features/auth-session.md).
- Existing evidence: unit tests in `lib/auth/*.test.ts` and prior e2e `auth-workspace.spec.ts` (not re-run).
- Follow-up: Stage B live run with disposable DB and ports from SKILL.md.

### LIP-V008 Authorization and anonymous-access matrix partly exercised live

- Class: GAP (partial). Severity: medium (coverage). State: open.
- Exercised: anonymous curl matrix (`/dashboard`, `/api/stripe/checkout`, `/api/uploadthing`, `/api/realtime/token`, `/invite/<t>` all 307 to login), non-member denial (`Failed to load workspace`), viewer read-only. Because the proxy redirects every non-auth `/api` request first, the documented 403/400/401/503 branches of the token and Stripe routes were not reached and need a signed-in `curl` with cookies. NOT exercised: UploadThing permissions, webhook signature, owner-only controls for editors.
- Scope: logged-out redirects, non-member access to another workspace, viewer vs editor vs owner UI and API denials, realtime token route 401/403, UploadThing permissions, Stripe route 401. Features: [access-control-anonymous](../../.agents/skills/verify/features/access-control-anonymous.md), [workspaces-roles-invites](../../.agents/skills/verify/features/workspaces-roles-invites.md).
- Existing evidence: `lib/workspace/authorization-matrix.test.ts` and related unit tests; `proxy.auth-routes.test.ts`. A passing unit test does not prove the live gate.

### LIP-V009 Realtime collaboration partly exercised

- Class: GAP (partial). Severity: medium (coverage). State: open.
- Exercised: two users editing one page live in both directions, persisted to the database; viewer `View only` and no write. NOT exercised: three users, token refresh after 60 s, reconnect after realtime restart, revoked member, sidebar stateless events.
- Scope: two or three contexts, presence, viewer read-only, token refresh after 60 s, reconnect after server restart. Features: [realtime-collaboration](../../.agents/skills/verify/features/realtime-collaboration.md), [documents-editor](../../.agents/skills/verify/features/documents-editor.md).
- Existing evidence: prior `collaboration.spec.ts` (not re-run).

### LIP-V010 Documents, trash, search and uploads partly exercised live

- Class: GAP (partial). Severity: medium (coverage). State: open.
- Exercised: page create/edit/reload persistence, move to trash, restore, permanent delete with cancel, empty trash, `Document not found`. NOT exercised: subpages, rename/duplicate, icons/covers, block quota, uploads, trash descendants. Search is covered by LIP-V020.
- Scope: page tree, editor persistence, trash/restore/permanent delete, ⌘K search with permissions, URL-based cover/logo; UploadThing binary delivery needs `UPLOADTHING_TOKEN` and stays out of scope. Features: [documents-editor](../../.agents/skills/verify/features/documents-editor.md), [trash-search](../../.agents/skills/verify/features/trash-search.md), [uploads](../../.agents/skills/verify/features/uploads.md).

### LIP-V011 Billing and quotas not exercised live

- Class: GAP. Severity: medium (coverage). State: open.
- Scope: `Go Pro` with billing unconfigured, portal, webhook signature failures, Free-plan quota messages (1 workspace, 2 collaborators, 500 blocks). Live Stripe stays out of scope per [requirements](../requirements.md). Feature: [billing-pricing](../../.agents/skills/verify/features/billing-pricing.md).

### LIP-V012 Verify skill run once, with corrections

- Class: GAP (partial). Severity: medium (process). State: open.
- 2026-10-02: Launch (container, `drizzle-kit push`, realtime, production build, `next start`), Doctor and Cleanup ran as written except: anonymous `POST /api/realtime/token` returns 307 (not 403); `bun run realtime:start` leaves a bun and a node PID, both recorded; the app PID is the `lsof` listener. SKILL.md was corrected. Production-build startup only; the dev server path and the Infinitunes-migrated database variant were not run.
- Scope: Launch, Doctor, Drive, Evidence and Cleanup in SKILL.md are unexecuted text. In particular the ports 3161/1261/5561, the `drizzle-kit push` schema step, the production-build start and the doctor curl expectations (`/dashboard` redirect, token route 403) are derived from source and from `tests/e2e/`, not observed. Only the `postgres:18` container start and a `db:migrate` attempt (LIP-V001) were observed.
- Follow-up: Stage B run by one worker with the chosen browser skill; update `Last live proof` in each feature file.

### LIP-V013 UI quality partly assessed

- Class: GAP (partial). Severity: medium (coverage). State: open.
- Exercised: dark theme and 390 px on the editor page, console errors empty on exercised pages. See LIP-V021 for an overlap. NOT exercised: light/dark on dialogs and auth pages, long content, loading/error states, keyboard focus order, reduced motion, tablet width.
- Scope: light/dark, 390 and 1280 px, empty/loading/error/long-content states, keyboard focus, accessible names, reduced motion, console cleanliness. Feature: [ui-quality](../../.agents/skills/verify/features/ui-quality.md).

### LIP-V014 OAuth and passkeys cannot be proved locally

- Class: GAP. Severity: low (coverage). State: open.
- Scope: Google/GitHub sign-in needs real credentials; the verification env uses fake ids so the buttons render but the round trip fails by design. No passkey flow exists in Lipi's source.

### LIP-V015 Existing Playwright suite not re-run

- Class: GAP. Severity: medium (process). State: open.
- Scope: `bun run test:e2e` starts its own Docker Postgres (`lipi-p9-e2e-pg`, 5544), realtime (1235) and a production build on 3100, and drives Chromium, so it is held with all browser automation. Its past results are prior proofs, not new ones.

### LIP-V016 Shared-database backfill and production realtime topology undecided

- Class: GAP (operational/decision). Severity: medium. State: open.
- Scope: `BACKFILL_ALL` on the shared database for legacy users, and the same-host vs separate-host realtime arrangement. Tracked in [todo](../todo.md), [shared-database-auth](../shared-database-auth.md), [requirements](../requirements.md) §4. Local runs cannot answer either.

### LIP-V017 Free-plan single-workspace limit constrains verification scenarios

- Class: GAP (verification constraint). Severity: low. State: open.
- Detail: `FREE_PLAN_MAX_WORKSPACES = 1` (`lib/billing/plan-quotas.ts`); each verification user can own one workspace, so multi-workspace tests (outsider access, switching) need separate users. No product change implied.

### LIP-V018 `.env.example` omits realtime and UploadThing variables

- Class: CONFIRMED. Severity: low. State: fixed (2026-10-04, source-only).
- Evidence before fix: `grep -cE "UPLOADTHING|REALTIME" .env.example` prints `0`, while `lib/env.ts:85-87` declares `UPLOADTHING_TOKEN`, `UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID` and the realtime server reads `LIPI_REALTIME_PORT` and `LIPI_REALTIME_ALLOWED_ORIGINS` (`realtime/server.ts`) and the app reads `NEXT_PUBLIC_LIPI_REALTIME_URL`.
- Expected: the example env lists everything needed to run editor and uploads. Actual before fix: someone following the README gets no hint about the realtime process or its variables.
- Fix 2026-10-04: `.env.example` now lists `NEXT_PUBLIC_LIPI_REALTIME_URL`, `LIPI_REALTIME_PORT`, `LIPI_REALTIME_ADDRESS`, and `LIPI_REALTIME_ALLOWED_ORIGINS` with development defaults documented from `lib/realtime/client.ts` and `realtime/server.ts`. The public URL and origins are blank so production still requires explicit configuration. It documents production `wss://` and exact browser origins without choosing a deployment. `docs/realtime.md` explains that the standalone Node process needs exported variables or `--env-file=.env.local`; it does not load that file automatically. It also lists a blank `UPLOADTHING_TOKEN`, which the installed SDK requires, and marks `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID` as optional legacy values declared in `lib/env.ts`. The example leaves `SKIP_ENV_VALIDATION` empty because `lib/env.ts` uses `!!process.env.SKIP_ENV_VALIDATION`, so even `false` skips schema validation; separate production database and auth guards bypass only on the exact value `true`. No runtime env behavior changed. No new live proof; realtime startup and binary uploads remain open verification gaps.

### LIP-V019 Accepting an invite lands on `?invite=invalid`

- Class: CONFIRMED. Severity: medium. State: fixed (2026-10-02, fix branch; two isolated users in a browser).
- Surface: `/invite/<token>` (was `app/invite/[token]/page.tsx`, now `route.ts`).
- Evidence: user B opened a valid editor invite while signed in. The database then had the `lipi_collaborators` row (role editor) and the invite row was deleted, yet the browser ended on `/dashboard?invite=invalid` (then the default workspace). Screenshot `evidence/workspaces-roles-invites/04-after-accept-landed-invite-invalid.png`. Cause from source: `redirect(`/dashboard/${workspaceId}`)`is called inside the`try`; Next's redirect throws, the `catch`swallows it and redirects to`?invite=invalid`.
- Reproduction: owner invites a second user in Settings; read the token from `lipi_workspace_invites` in the disposable database; second user opens `/invite/<token>`.
- Expected: land on the invited workspace. Actual: success is reported as an invalid invite; the user only reaches the workspace because `/dashboard` redirects to the first workspace they belong to, which may be a different one for users with several.
- Correction: the source cause above was not the failing path. Moving the redirect out of the `try` alone did not change the result; the dev server log showed `acceptWorkspaceInvite` throwing `Route /invite/[token] used "revalidateTag get_private_workspaces" during render` after the collaborator insert, which the catch turned into `?invite=invalid`.
- Fix: the page is replaced by a route handler (`app/invite/[token]/route.ts`), where tag revalidation is allowed; it redirects signed-out visitors to `/login?from=...`, valid accepts to `/dashboard/<workspaceId>` and failures to `/dashboard?invite=invalid`, with relative redirects so the host in use keeps its cookies. Verified live: owner invited user B, B opened the invite and landed on `/dashboard/<workspace>` (307, no `invalid` hop), the collaborator row exists and the invite row is gone; a random token and another user's invite both gave `?invite=invalid` with no new collaborator and the invite kept; a non-member opening the workspace URL got `Failed to load workspace`; a viewer saw `View only`. Unit test `app/invite/[token]/route.test.ts` covers the three redirects but mocks the revalidation, so the live run is the proof for the real cause. Supersedes the hypothesis part of LIP-V004/V005.

### LIP-V020 Search dialog shows neither results nor empty or error state

- Class: CONFIRMED (partly retracted). Severity: medium. State: fixed for the confirmed part (2026-10-02, fix branch).
- Surface: header search (Cmd/Ctrl+K), `components/search-command.tsx`, `searchDocumentsInWorkspace`.
- Evidence: production build, signed-in owner in a workspace holding the page `Shared Page` with body text. Opening the dialog with an empty query, then queries `Shared`, `typed by` and `zzzzqq`, each left the listbox empty with no `No documents found.` text, no error alert and no results; screenshots `evidence/trash-search/09-search-*.png`, `10-search-empty-query.png`; the server log showed no search error. By source an empty query should list up to 10 recent pages and a miss should show `No documents found.`.
- Reproduction: sign in, create a page, press Cmd+K, wait 4 s, read the listbox via `snapshot`.
- Expected: results or the empty-state copy. Actual: blank list. Hypothesis for the cause (unverified): the Base UI combobox filters or hides items and the empty slot.
- Re-investigation 2026-10-02 (dev build, `fm/lipi-verified-issue-fixes`): results do render. With the page body `typed by owner alpha`, queries empty, `typed by` and `Shared` produced the `Shared Page` option in the DOM and in a screenshot; the earlier "empty list" came from the `chrome-devtools-axi` accessibility snapshot, which did not list the option, and the earlier screenshot `09-search-Shared.png` also shows the result. The server action returned the row and non-members are rejected by `requireWorkspacePermission` (unit-tested). The one real defect was the `No documents found.` copy: `ComboboxEmpty` ships `hidden` plus `group-data-empty/combobox-content:flex`, and the list has no such ancestor, so it stayed `display: none`. It now carries `flex` (computed display `flex`, 68 px high for `zzzzqq`). Also fixed: Escape did not close the dialog because the combobox is permanently `open`; `onOpenChange` now closes the dialog. Not re-run in a production build; cross-workspace content exposure was not attempted live beyond the non-member denial under LIP-V019.

### LIP-V021 Collaborator avatar overlaps the search button at 390 px

- Class: CONFIRMED (visual). Severity: low. State: fixed (2026-10-02, fix branch, 390x844 emulation).
- Evidence: `evidence/ui-quality/03-mobile-dark.png`: on the editor page at 390 px the pink avatar `V` sits on the search button's icon. The left 80 px of the screenshot are blank, which is not diagnosed (HYPOTHESIS: screenshot/emulation artifact).
- Cause: two defects. The desktop sidebar panel is `hidden lg:block` on its inner element, but the resizable group still allotted its outer wrapper 16% of the width (62 px blank at 390 px, the "blank left 80 px"), and the header's right group could shrink the avatar to a sliver under the full-width search button while the theme toggle was pushed off-screen. Fix: the panel group hides the sidebar wrapper below `lg`; the navbar search button is an icon (36 px, `aria-label="Search documents"`, title `Search (⌘K)`) below `sm`; the right group and avatars are `shrink-0`. After: header items at 390 px sit at nav 16-43, breadcrumb 67-242, avatar 258-290, search 298-334, theme toggle visible, no horizontal scroll. Keyboard: the search button takes focus, Enter opens the dialog with the input focused, Escape closes it; the mobile navigation sheet opens from the hamburger and closes on Escape. `resize` in the browser tool floors at 500 px, so 390 used `emulate --viewport`. Not checked: tablet widths, more than four collaborators.

### LIP-V022 Trashed page stays open at its URL

- Class: CONFIRMED (observed). Severity: low. State: fixed (2026-10-02, fix branch).
- Evidence: after `Move to trash` from the open page, the URL stayed on the document and the editor still showed its title and body (`evidence/trash-search/02-page-trashed-view.png`) until a reload, which gave `Document not found` only after permanent delete. Whether the trashed page is still editable was not tested.
- Fix: `Move to trash` in the tree now navigates to `/dashboard/<workspaceId>` when the open page, or one of its descendants, is among the trashed ids. Verified live: before, the URL and editor stayed after trashing; after, the URL became the workspace root. Whether a trashed page opened by direct URL is editable was not tested.

### LIP-V023 Tree context menu not opened by keyboard

- Class: HYPOTHESIS. Severity: low. State: open.
- Evidence: focusing a tree link and pressing `Shift+F10` through the browser tool did not open the menu; a synthetic `contextmenu` event did. The tool's key emulation may differ from a real keyboard.
- Follow-up: check with a real keyboard; if confirmed, the actions are mouse-only.

### LIP-V024 Workspace name not shown in breadcrumb or page heading

- Class: HYPOTHESIS. Severity: low. State: open.
- Evidence: workspace named `Alpha Space`; the empty-workspace view shows breadcrumb root `Workspace` and heading `workspace page`. May be intended placeholder copy.

### Automatic verification triggers

Checked 2026-10-02: no Git hook, package lifecycle script or CI job starts browser verification. `.husky/pre-commit` runs `bunx lint-staged` (prettier and eslint on staged files), `.husky/commit-msg` runs commitlint, `package.json` `prepare` runs `husky`, and `.github/workflows/ci.yml` runs type-check, lint, unit tests, build and a commit-message check. `test:e2e` (Playwright) is a manual script, not referenced by those. These are unrelated lint/unit checks, not verification.

## Remaining browser proof

Everything in the GAP entries above, plus billing and uploads (no feature proof), reset password, transfer/delete workspace, and tablet/long-content/keyboard checks. A later run follows SKILL.md when explicitly asked.
