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

- Playwright specs `tests/e2e/auth-workspace.spec.ts`, `documents-editor.spec.ts`, `collaboration.spec.ts`, `stripe-checkout.spec.ts`, added in `4b4b717` (`test(e2e): add playwright suite with throwaway postgres setup`) and cited as evidence in [requirements](../requirements/requirements.md) and [todo](../TODO.md). Stripe is mocked there.
- Earlier trash UI polish is cited as landed (`0b86a64`), proved by `components/trash.test.tsx` only.

## Corrected stale process items

- Root `README.md` had been reduced to a pointer to a duplicate project doc; the body was restored to `README.md` and the duplicate removed. No other doc linked to it.
- [todo](../TODO.md) says its checked items cite files but "the tests were not re-run when this index was written". This pass re-ran type-check, lint and unit tests (table above); it did not re-run e2e.

## Issues

### LIP-V001 Greenfield `bun run db:migrate` fails

- State: CONFIRMED, medium. Fixed in `c081bfe` (2026-10-02): `0004_minor_micromacro.sql` casts `in_trash` with `USING`; proven on a disposable `postgres:18` (13 migrations applied, rerun a no-op). Not proven: a database that applied the old 0004.

### LIP-V002 Username sign-in removed (email-only)

- State: RESOLVED. Fixed in `5983731`: username sign-in, the Better Auth `username` plugin and the `user.username` columns were removed; sign-in is email and password only.

### LIP-V003 Reset-password server action: unauthenticated, enumerating, unthrottled

- State: HYPOTHESIS, medium. Resolved: the unauthenticated `resetPassword` server action (enumerating, unthrottled) was hardened in `1fe9c47` and removed in `02941f2` (D-5). Recovery is now the Better Auth emailed flow (`b04d298`, `/forgot-password` then `/reset-password?token=`) and signed-in `/dashboard/change-password`. Not exercised in a browser; see LIP-V007.

### LIP-V004 Invite page sends `callbackUrl`, login reads `from`

- Class: HYPOTHESIS. Severity: low. State: open.
- Surface: `app/invite/[token]/route.ts` (was `page.tsx`), `app/(auth)/components/login-form.tsx`.
- Evidence: `redirect(\`/login?callbackUrl=...\`)`in the invite page versus`searchParams.get("from")`in the login form;`proxy.ts`already redirects unauthenticated`/invite/...`requests to`/login?from=...` first, so the page branch is probably unreachable in practice.
- Reproduction (not run): open `/invite/<token>` logged out, log in, check the landing URL.
- Expected: land on the invite and accept it. Actual: expected to work via the proxy `from` path; unverified.
- Update 2026-10-02: the dead page branch is gone with LIP-V019's route handler, which now uses `from`. A signed-out `?from=` round trip through the proxy was not driven.

### LIP-V005 `?invite=invalid` is never displayed

- State: CONFIRMED, low. Fixed in `0b24f44`: the workspace page shows an invalid-invite notice for `?invite=invalid` (`app/dashboard/invite-notice.tsx`, unit-tested). Not driven in a browser.

### LIP-V006 Newsletter form reports success without subscribing

- State: CONFIRMED, low. Resolved in `6abc18c` by removing the stub footer newsletter form.

### LIP-V007 Auth flows partly exercised in a browser

- Class: GAP (partial). Severity: medium (coverage). State: open.
- Exercised 2026-10-02: sign-up with required and mismatch validation, sign-in, wrong-password message, sign-out, `/dashboard` redirect when logged out, authenticated redirect away from `/login`. NOT exercised: forgot-password, reset-password and change-password flows (LIP-V003), `?from=` return after login, password-rule messages, session expiry, unknown-user message.
- Scope: sign-up, sign-in, sign-out, validation messages, redirect handling, authenticated-user redirect away from auth pages, forgot/reset/change password, session persistence after reload. Feature: [auth-session](../../.agents/skills/verify/features/auth-session.md).
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
- Scope: `Go Pro` with billing unconfigured, portal, webhook signature failures, Free-plan quota messages (1 workspace, 2 collaborators, 500 blocks). Live Stripe stays out of scope per [requirements](../requirements/requirements.md). Feature: [billing-pricing](../../.agents/skills/verify/features/billing-pricing.md).

### LIP-V012 Verify skill run once, with corrections

- Class: GAP (partial). Severity: medium (process). State: open.
- 2026-10-02: Launch (container, `drizzle-kit push`, realtime, production build, `next start`), Doctor and Cleanup ran as written except: anonymous `POST /api/realtime/token` returns 307 (not 403); `bun run realtime:start` leaves a bun and a node PID, both recorded; the app PID is the `lsof` listener. SKILL.md was corrected. Production-build startup only; the dev server path was not run.
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

### LIP-V016 Shared-database backfill and production realtime deployment

- Class: GAP (operational/decision). Severity: medium. State: open.
- Scope: the credential backfill on the production database for legacy users, and deploying the realtime process on its separate host (arrangement decided as D-1 in [todo](../TODO.md); see [requirements](../requirements/requirements.md) §4). Local runs cannot answer either.

### LIP-V017 Free-plan single-workspace limit constrains verification scenarios

- Class: GAP (verification constraint). Severity: low. State: open.
- Detail: `FREE_PLAN_MAX_WORKSPACES = 1` (`lib/billing/plan-quotas.ts`); each verification user can own one workspace, so multi-workspace tests (outsider access, switching) need separate users. No product change implied.

### LIP-V018 `.env.example` omits realtime and UploadThing variables

- State: CONFIRMED, low. Fixed in `c229fef` (realtime and UploadThing variables added to `.env.example`; grouped under headings in `9472258`).

### LIP-V019 Accepting an invite lands on `?invite=invalid`

- State: CONFIRMED, medium. Fixed in `c081bfe`: `app/invite/[token]/route.ts` replaces the page (tag revalidation is not allowed during render, which the catch turned into `?invite=invalid`); verified live with two users and covered by `route.test.ts`.

### LIP-V020 Search dialog shows neither results nor empty or error state

- State: CONFIRMED (partly retracted), medium. Fixed in `c081bfe`: results did render; the real defects were the hidden `No documents found.` copy and Escape not closing the dialog. The empty list seen earlier was an accessibility-snapshot artifact.

### LIP-V021 Collaborator avatar overlaps the search button at 390 px

- State: CONFIRMED (visual), low. Fixed in `c081bfe`: sidebar wrapper hidden below `lg`, icon-only search button below `sm`, `shrink-0` header groups; verified at 390 px.

### LIP-V022 Trashed page stays open at its URL

- State: CONFIRMED, low. Fixed in `c081bfe`: `Move to trash` navigates to the workspace root when the open page or a descendant is trashed; verified live. Update 2026-10-05: direct-URL editing of a trashed page was possible for the header metadata (title, icon, cover); the body was already blocked by the realtime server. Fixed: the page returns not-found for trashed pages and `updateDocument` rejects them (`[fileId]/page.test.tsx`, `document.forbidden.test.ts`); driven live.

### LIP-V023 Tree context menu not opened by keyboard

- State: HYPOTHESIS (tool-dispatched proof), low. Fixed in `250fa79`: the tree row opens its context menu on the `ContextMenu` key or `Shift+F10`; unit-tested and driven in Chrome. Physical-keyboard behaviour across OS and browsers is unverified.

### LIP-V024 Workspace name not shown in breadcrumb or page heading

- State: CONFIRMED, low. Fixed in `250fa79`: the workspace title shows in the breadcrumb and a workspace home view, and search restores focus on close; verified live at 390, 768 and 1280 px.

### LIP-V025 Viewer sees edit actions; failed trash leaves pages removed

- State: CONFIRMED (live on `cc338f4`), medium. Fixed in `ef68580`: viewers get no `New page` or tree menu, read-only Trash and a `View only` badge; failed trash rolls back. Gap: production builds sanitize server-action errors, so the toast stays generic. Not re-verified: other roles at 768 px, reduced motion.

### LIP-V026 Workspace title and member role could go stale in open sessions

- State: HYPOTHESIS about base, low. Fixed in `ef68580`: Settings save, role change and transfer refresh the store and send `pages:changed`; verified live for title and role. Update 2026-10-05: the removed user's open session was driven live; it swapped to the access-revoked view within 1 s without navigation.

### LIP-V027 Failed root page creation is not rolled back

- State: CONFIRMED (source), low. Fixed in `9cab940`: `createRootPage` rolls the optimistic page back when the server rejects it. Not reproduced live.

### Automatic verification triggers

Checked 2026-10-02: no Git hook, package lifecycle script or CI job starts browser verification. `.husky/pre-commit` runs `bunx lint-staged` (prettier and eslint on staged files), `.husky/commit-msg` runs commitlint, `package.json` `prepare` runs `husky`, and `.github/workflows/ci.yml` runs type-check, lint, unit tests, build and a commit-message check. `test:e2e` (Playwright) is a manual script, not referenced by those. These are unrelated lint/unit checks, not verification.

## Remaining browser proof

Everything in the GAP entries above, plus billing and uploads (no feature proof), forgot/reset/change password, transfer/delete workspace, and tablet/long-content/keyboard checks. A later run follows SKILL.md when explicitly asked.
