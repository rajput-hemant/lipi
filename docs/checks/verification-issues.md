# Lipi verification issue ledger

Canonical and only issue ledger for Lipi verification. Feature maps in [.agents/skills/verify/features](../../.agents/skills/verify/features/README.md) link here by ID and do not repeat the text. The harness is [.agents/skills/verify/SKILL.md](../../.agents/skills/verify/SKILL.md) (DRAFT).

Classes:

- **CONFIRMED**: reproduced with a command or deterministic file:line a reader can re-run.
- **HYPOTHESIS**: suspected from source or docs; not exercised at runtime.
- **GAP**: coverage not exercised. A GAP is never a PASS.

Date of this pass: 2026-10-02. Base commit: `91f5f4b` on `fm/lipi-pstack-verification` (from `feat/complete-lipi` at `0b86a64`). No browser, Playwright, screenshot or UI driving was done. No product code was changed; findings below are for later ships.

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

- Class: CONFIRMED. Severity: medium. State: open.
- Surface: `bun run db:migrate` (`lib/db/migrate.ts`, migrations in `lib/db/migrations/`); documented as the setup path.
- Evidence: command in the table above printed `PostgresError: column "in_trash" cannot be cast automatically to type boolean` ... `hint: You might need to specify "USING in_trash::boolean"`, code `42804`, then `error: script "db:migrate" exited with code 1`. The same limitation is described in the comment at the top of `tests/e2e/apply-lipi-database.ts` (it works around it with `drizzle-kit push`).
- Reproduction: 1) `docker run -d --rm --name lipi-verify-pg-draft -e POSTGRES_PASSWORD=test -p 127.0.0.1:5561:5432 --tmpfs /var/lib/postgresql postgres:18`; 2) wait for `pg_isready`; 3) run the migrate command above; 4) `docker rm -f lipi-verify-pg-draft`.
- Expected: migrations apply to an empty database. Actual: fails at the `in_trash` text-to-boolean step (migration 0004 per the e2e comment; the failing statement was not isolated here).
- Follow-up: separate ship to add `USING in_trash::boolean` (or equivalent) without breaking databases that already applied 0004. Until then verification uses `drizzle-kit push` (SKILL.md Launch).

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
- Follow-up: confirm in the browser; delete the dead branch or align the parameter.

### LIP-V005 `?invite=invalid` is never displayed

- Class: HYPOTHESIS. Severity: low. State: open.
- Surface: `/invite/<bad-token>`.
- Evidence: `app/invite/[token]/page.tsx` redirects to `/dashboard?invite=invalid`; `app/dashboard/page.tsx` ignores search params and redirects again; `grep -rn "invite=invalid" app components lib` finds only the redirect.
- Expected: a visible "invalid or expired invite" message. Actual (source): silent landing in the default workspace or new-workspace page.
- Follow-up: browser check, then a small UX ship.

### LIP-V006 Newsletter form reports success without subscribing

- Class: CONFIRMED (deterministic source). Severity: low. State: open.
- Surface: footer newsletter form.
- Evidence: `components/site-footer/newsletter-subscription-form.tsx:32` `// TODO: Add newsletter subscription logic here.`; the action returns `subscribed: true` after a timed toast `You have successfully subscribed to our newsletter.`. Re-run: `sed -n 28,42p components/site-footer/newsletter-subscription-form.tsx`.
- Expected: either a real subscription or no success claim. Actual: success toast, nothing stored or sent.
- Follow-up: remove the form or implement; showcase decision.

### LIP-V007 Auth flows not exercised in a browser

- Class: GAP. Severity: high (coverage). State: open until the browser skill lands.
- Scope: sign-up, sign-in, sign-out, validation messages, redirect handling, authenticated-user redirect away from auth pages, reset password, session persistence after reload. Feature: [auth-session](../../.agents/skills/verify/features/auth-session.md).
- Existing evidence: unit tests in `lib/auth/*.test.ts` and prior e2e `auth-workspace.spec.ts` (not re-run).
- Follow-up: Stage B live run with disposable DB and ports from SKILL.md.

### LIP-V008 Authorization and anonymous-access matrix not exercised live

- Class: GAP. Severity: high (coverage). State: open.
- Scope: logged-out redirects, non-member access to another workspace, viewer vs editor vs owner UI and API denials, realtime token route 401/403, UploadThing permissions, Stripe route 401. Features: [access-control-anonymous](../../.agents/skills/verify/features/access-control-anonymous.md), [workspaces-roles-invites](../../.agents/skills/verify/features/workspaces-roles-invites.md).
- Existing evidence: `lib/workspace/authorization-matrix.test.ts` and related unit tests; `proxy.auth-routes.test.ts`. A passing unit test does not prove the live gate.

### LIP-V009 Realtime collaboration not exercised in this pass

- Class: GAP. Severity: high (coverage). State: open.
- Scope: two or three contexts, presence, viewer read-only, token refresh after 60 s, reconnect after server restart. Features: [realtime-collaboration](../../.agents/skills/verify/features/realtime-collaboration.md), [documents-editor](../../.agents/skills/verify/features/documents-editor.md).
- Existing evidence: prior `collaboration.spec.ts` (not re-run).

### LIP-V010 Documents, trash, search and uploads not exercised live

- Class: GAP. Severity: medium (coverage). State: open.
- Scope: page tree, editor persistence, trash/restore/permanent delete, ⌘K search with permissions, URL-based cover/logo; UploadThing binary delivery needs `UPLOADTHING_TOKEN` and stays out of scope. Features: [documents-editor](../../.agents/skills/verify/features/documents-editor.md), [trash-search](../../.agents/skills/verify/features/trash-search.md), [uploads](../../.agents/skills/verify/features/uploads.md).

### LIP-V011 Billing and quotas not exercised live

- Class: GAP. Severity: medium (coverage). State: open.
- Scope: `Go Pro` with billing unconfigured, portal, webhook signature failures, Free-plan quota messages (1 workspace, 2 collaborators, 500 blocks). Live Stripe stays out of scope per [requirements](../requirements.md). Feature: [billing-pricing](../../.agents/skills/verify/features/billing-pricing.md).

### LIP-V012 The verify skill itself has never been run

- Class: GAP. Severity: high (process). State: open.
- Scope: Launch, Doctor, Drive, Evidence and Cleanup in SKILL.md are unexecuted text. In particular the ports 3161/1261/5561, the `drizzle-kit push` schema step, the production-build start and the doctor curl expectations (`/dashboard` redirect, token route 403) are derived from source and from `tests/e2e/`, not observed. Only the `postgres:18` container start and a `db:migrate` attempt (LIP-V001) were observed.
- Follow-up: Stage B run by one worker with the chosen browser skill; update `Last live proof` in each feature file.

### LIP-V013 UI quality not assessed

- Class: GAP. Severity: medium (coverage). State: open.
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

- Class: CONFIRMED. Severity: low. State: open.
- Evidence: `grep -cE "UPLOADTHING|REALTIME" .env.example` prints `0`, while `lib/env.ts:85-87` declares `UPLOADTHING_TOKEN`, `UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID` and the realtime server requires `LIPI_REALTIME_PORT`/`LIPI_REALTIME_ALLOWED_ORIGINS` (`realtime/server.ts`) and the app reads `NEXT_PUBLIC_LIPI_REALTIME_URL`.
- Expected: the example env lists everything needed to run editor and uploads. Actual: someone following the README gets no hint about the realtime process or its variables.
- Follow-up: docs/config ship.

## Remaining browser proof

Everything in the GAP entries above. Next step after the browser skill arrives: one worker follows SKILL.md end to end, files CONFIRMED issues with reproduction, and updates each feature file's `Last live proof:`.
