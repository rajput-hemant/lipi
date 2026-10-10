# Local verification session R4-Final, 2026-10-10

Branch `task/r4-final`, base `feat/complete-lipi` at `b00e227`.
Evidence-only verification for round 4 final gates, database integration tests, Playwright e2e suite, and production CSP media verification.

## Environment

- Private ports: Postgres on `55460`, Next.js app on `3120`, realtime WebSocket on `1260`.
- Private Postgres container `lipi-r4-final-pg` (`postgres:18`) with `pg_trgm` extension and tmpfs storage.
- Next.js 16.3.6 (Turbopack production build `next start`), Bun 1.4.3, Node 24.21.0.
- Browser automation: `chrome-devtools-axi` named session `task-r4-final`.
- Playwright headless runner with `chromium_headless_shell-1243` installed in throwaway `/tmp/pw-browsers` directory.
- Hard safety compliance: main checkout `/Users/rajput-hemant/Projects/NextJS/lipi` remained untouched and read-only. Shared ports (5432, 3100, 6379) and shared containers (`local-platforms-postgres`, `local-platforms-redis`, etc.) were not touched. Every server and test process ran with an explicit `env -i` prefix isolating `DATABASE_URL` to the private container.

## 1. Full gates in worktree

Executed sequentially in `/Users/rajput-hemant/.treehouse/lipi-19aefc/1/lipi`:

| Gate             | Command                          | Result | Details                                                               |
| :--------------- | :------------------------------- | :----- | :-------------------------------------------------------------------- |
| Format           | `bun run fmt:check`              | Pass   | Exit 0, 0 style violations across all matched repository files        |
| Lint             | `bun run lint`                   | Pass   | Exit 0, eslint completed with 0 errors and 0 warnings                 |
| Type check       | `bun run type-check`             | Pass   | Exit 0, `tsc --noEmit` completed with 0 diagnostic errors             |
| Unit tests       | `bunx vitest run --maxWorkers=1` | Pass   | 118 passed, 5 skipped (123 files); 573 passed, 28 skipped (601 tests) |
| Production build | `bun run build`                  | Pass   | Exit 0, 23/23 routes generated (prerender / partial prerender)        |

Note on unit tests: the 5 skipped files (`enforce-quotas.db.test.ts`, `request-cache.db.test.ts`, `document.db.test.ts`, `search.db.test.ts`, `workspace-member-quota.db.test.ts`) are database-backed integration suites that automatically self-skip when `TEST_DATABASE_URL` is unset.

## 2. Database-enabled vitest run

Started private Postgres container `lipi-r4-final-pg` on port 55460, created `pg_trgm` extension, applied auth migrations, 15 Lipi application migrations, and seed data via `bun run db:setup`.

Command:

```bash
env -i PATH="$PATH" HOME="$HOME" \
  TEST_DATABASE_URL="postgresql://postgres:test@127.0.0.1:55460/postgres" \
  DATABASE_URL="postgresql://postgres:test@127.0.0.1:55460/postgres" \
  bunx vitest run --maxWorkers=1
```

Outcome:

- Test files: 123 passed of 123 (0 skipped, 0 failed).
- Total tests: 601 passed of 601 (0 skipped, 0 failed, duration 40.41s).
- All 5 database integration test suites executed against the live Postgres instance:
  - `lib/billing/enforce-quotas.db.test.ts`: 8 passed (282ms)
  - `lib/db/request-cache.db.test.ts`: 4 passed (333ms)
  - `lib/db/actions/document.db.test.ts`: 9 passed (372ms)
  - `lib/db/actions/search.db.test.ts`: 4 passed (249ms)
  - `lib/db/data/workspace-member-quota.db.test.ts`: 3 passed (271ms)

The two quota expectation adjustments from `385afc4` (`document.db.test.ts` expecting `QUOTA_EXCEEDED` result and `workspace-member-quota.db.test.ts` expecting `PlanQuotaError`) executed green with zero failures.

## 3. Playwright e2e suite on private ports

Environment:

- `PLAYWRIGHT_BROWSERS_PATH="/tmp/pw-browsers"`
- `E2E_PG_CONTAINER="lipi-r4-final-pg"`
- `E2E_PG_PORT="55460"`
- `E2E_APP_PORT="3120"`
- `E2E_REALTIME_PORT="1260"`
- `DATABASE_URL="postgresql://postgres:test@127.0.0.1:55460/postgres"`
- `NODE_OPTIONS="--max-old-space-size=3072"`

Command:

```bash
bun run test:e2e
```

### Run 1: full suite (5 passed, 1.7m)

| Spec                       | Result | Duration | Notes                                                 |
| :------------------------- | :----- | :------- | :---------------------------------------------------- |
| `auth-workspace.spec.ts`   | Pass   | 2.8s     | Sign up, log out, log in, create workspace            |
| `collaboration.spec.ts`    | Pass   | 32.3s    | Sync edits, presence awareness, viewer read-only      |
| `documents-editor.spec.ts` | Pass   | 11.7s    | Nested pages, BlockNote typing and sync               |
| `roles.spec.ts`            | Pass   | 31.7s    | Owner, editor, viewer permissions, anonymous redirect |
| `stripe-checkout.spec.ts`  | Pass   | 10.3s    | Mocked billing API redirect attempt                   |

### Stability check on recently edited specs

Consecutive runs were conducted on `roles.spec.ts` and `collaboration.spec.ts`:

- `roles.spec.ts`: passed run 1 (31.7s) and run 2 (23.5s) consecutively with zero errors.
- `collaboration.spec.ts`:
  - Run 1: Pass (32.3s)
  - Run 2: Fail (strict mode violation at `tests/e2e/helpers/workspace.ts:74`). Locator `getByText('View only')` resolved to 2 elements: `<span data-slot="badge">View only</span>` and `<p role="status">View only</p>`.
  - Run 3: Pass (24.4s).
  - Flake analysis: `waitForViewOnlyEditor` in `tests/e2e/helpers/workspace.ts` uses `getByText("View only")` without scoping to `.first()` or `getByRole("status")`, unlike `roles.spec.ts` which uses `locator("p").filter({ hasText: "View only" })`. Depending on whether both the header badge and the editor status paragraph are in DOM at evaluation, Playwright strict mode trips.

## 4. Production build under enforcing CSP

Production build started with enforcing `Content-Security-Policy`:

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://js.stripe.com https://va.vercel-scripts.com;
style-src 'self' 'unsafe-inline';
img-src 'self' https: blob: data:;
media-src 'self' https: blob: data:;
font-src 'self' data:;
connect-src 'self' https://api.stripe.com https://hooks.stripe.com https://utfs.io https://*.ufs.sh https://uploadthing.com https://*.uploadthing.com https://vitals.vercel-insights.com ws://127.0.0.1:1260;
frame-src https://js.stripe.com https://hooks.stripe.com;
worker-src 'self' blob:;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none'
```

### Steps executed via `chrome-devtools-axi`

1. User sign up:
   - Visited `http://127.0.0.1:3120/signup`.
   - Created user `test-r4@example.test` with password `TestPassword123!`.
   - Toast "Account created successfully" confirmed; redirected to `/dashboard/new-workspace`.
2. Workspace creation:
   - Created workspace "R4 Workspace" (`72711c9b-60c9-4cf9-8f15-c027f125e374`).
   - Landed on dashboard.
3. Workspace logo:
   - Opened Settings dialog.
   - Set logo URL to external HTTPS image `https://placehold.co/64.png`.
   - Logo rendered immediately in Settings dialog preview (`image "Workspace logo"`).
   - Saved changes; toast "Workspace updated" observed.
   - Database confirmed `logo = 'https://placehold.co/64.png'` in `lipi_workspaces`.
4. Document creation and media embeds:
   - Created new document "CSP Test Document" (`3b8000ab-b5a4-4750-80e7-e0e6e5cc1acf`).
   - Opened document in BlockNote editor.
   - Inserted Image block via `/image` -> Embed tab with external HTTPS URL `https://placehold.co/128.png`.
   - Confirmed image loaded and rendered (`naturalWidth: 128`, `complete: true`).
   - Inserted Audio block via `/audio` -> Embed tab with external HTTPS MP3 URL `https://cdn.freesound.org/previews/612/612087_5674468-lq.mp3`.
   - Confirmed audio block rendered with HTML5 `<audio>` element (`currentSrc` matching the external MP3 URL).
   - Screenshot saved to `docs/verification/img/prod-csp-doc-media.png` (84 KB).

### Console and CSP audit per route

| Route                   | State     | Console Errors | CSP Violations | Observed Console Issues                                           |
| :---------------------- | :-------- | :------------- | :------------- | :---------------------------------------------------------------- |
| `/`                     | Anonymous | 0              | 0              | Lazy image explicit dimensions suggestion                         |
| `/login`                | Anonymous | 0              | 0              | Form label for attribute suggestion                               |
| `/dashboard`            | Signed in | 0              | 0              | Zod JIT eval probe issue in settings chunk; 0 error-level entries |
| `/dashboard/<ws>/<doc>` | Signed in | 0              | 0              | Both HTTPS image and HTTPS audio loaded with zero CSP violations  |

## Screenshots

- `docs/verification/img/prod-csp-doc-media.png` (84 KB) - Document editor in production build with embedded external HTTPS image block (`https://placehold.co/128.png`) and external HTTPS audio block (`https://cdn.freesound.org/...mp3`).

## Cleanup

- `next start` server on port 3120 stopped.
- Realtime WebSocket process on port 1260 stopped.
- `chrome-devtools-axi` named sessions (`task-r4-final`, `r4-final-fresh`) stopped.
- Docker container `lipi-r4-final-pg` stopped and removed.
- Temporary Playwright browser directory `/tmp/pw-browsers` deleted.
- Ports 55460, 3120, and 1260 verified free.

## Not verified

- Live external third-party API integrations requiring secret keys: Stripe checkout redirect, Stripe customer portal, Resend email delivery, UploadThing storage uploads (`utfs.io`), live OAuth flows (Google, GitHub), Vercel analytics endpoint.
- Web browser rendering engines other than Chromium (WebKit / Safari and Gecko / Firefox).
