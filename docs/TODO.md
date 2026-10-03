# Lipi to-do

Canonical task index, last restructured 2026-10-03 on `feat/complete-lipi`. Confirmed bugs live in the verification ledger, [verification/verification-issues.md](./verification/verification-issues.md); lines here link to it instead of repeating it. The ledger was not edited in the 2026-10-03 cloud session (completion notes live only here), so where an entry below says "fixed" for a ledger ID (LIP-V005, V018, V027, and the LIP-V003 part), the ledger still reads open until the next local pass updates it. Likewise `.agents/skills/verify/features/uploads.md` still lists the `.env.example` gap (LIP-V018), now fixed.

How to read an item: **Kind** (bug, fix, improvement, verification gap, decision), **Priority** (P0 blocks use, P1 needed before production, P2 should fix or prove soon, P3 polish or low risk), **Evidence** (file:line, command or test), **Status** (`open`, `needs local environment: <reason>`, `decision needed`, `fixed (commit)`, `partial`).

Cloud-session gate evidence (2026-10-03, after all merges including the owner decisions): `bun run type-check` exit 0; `bun run lint` exit 0; `bun run test` 92 files, 386 tests passed (baseline before the session: 62 files, 233 tests per run, 225 in the ledger). `bun run fmt:check` reports two files that were already unformatted before this session (`fixtures/local-dev-credentials.json`, `tsconfig.json`; see F-DX-1). No browser, database, Redis or Docker service was available, so nothing below marked "needs local environment" was run live.

## Contents

1. [Summary](#summary)
2. [Decisions needed](#decisions-needed)
3. [Open work by area](#open-work-by-area)
   - [Security](#security)
   - [Correctness and data](#correctness-and-data)
   - [Performance](#performance)
   - [Architecture and dependencies](#architecture-and-dependencies)
   - [Error handling and logging](#error-handling-and-logging)
   - [Design, accessibility and responsive](#design-accessibility-and-responsive)
   - [Tests](#tests)
   - [Operations and docs](#operations-and-docs)
4. [Needs local environment (verification)](#needs-local-environment-verification)
5. [Proposals for review](#proposals-for-review)
6. [Completed](#completed)
7. [shadcn source modification check](#shadcn-source-modification-check-2026-10-03)
8. [Deslop and ponytail review](#deslop-and-ponytail-review-2026-10-03)

## Summary

Approximate open-item counts by priority after the 2026-10-03 cloud session (counted by hand from the lists below; verification lines in section 4 are not individually prioritised here).

| Area                              |  P1 |  P2 |  P3 |
| :-------------------------------- | --: | --: | --: |
| Security                          |   0 |   3 |   5 |
| Correctness and data              |   0 |   3 |   5 |
| Performance                       |   0 |   4 |   4 |
| Architecture and dependencies     |   0 |   1 |   9 |
| Error handling and logging        |   0 |   2 |   6 |
| Design, accessibility, responsive |   0 |   0 |   6 |
| Tests                             |   0 |   0 |   5 |
| Operations and docs               |   1 |   2 |   4 |
| Verification (needs local env)    |   0 |  16 |  14 |

P1 left: backfill credential accounts on the production database (needs production access) and, with it, the realtime hosting decision (see Decisions).

## Decisions needed

- [x] **D-1 Production realtime arrangement**: decided 2026-10-03: a separate always-on Node 22 host with its own `wss://` URL and the existing signed room token (a Next route cannot host it: the Next.js docs list "WebSockets won't work because the connection closes on timeout, or after the response is generated", and Vercel functions cannot hold them). No code change; the README already says the deploy button deploys only the app. Remaining work is deployment (host, `LIPI_REALTIME_ALLOWED_ORIGINS`, `NEXT_PUBLIC_LIPI_REALTIME_URL`, TLS). Evidence: [realtime](./guides/realtime.md), ledger LIP-V016. Status: decided; deployment needs local environment: a real host
- [x] **D-2 Footer newsletter form**: decided 2026-10-03: remove it (ledger LIP-V006). Done in 6abc18c (see C-37)
- [ ] **D-3 Sidebar**: decided 2026-10-03: adopt the shadcn Sidebar instead of the custom one. Kind: improvement (large). Priority: P2. Evidence: `components/sidebar/*`, `components.json` (style `base-nova`). Status: blocked: `bunx shadcn@latest add sidebar` cannot reach `ui.shadcn.com` from the cloud environment (proxy answers 403 to CONNECT, `Request was cancelled`), so `components/ui/sidebar.tsx` cannot be generated. The agent's attempt to hand-build the file from another host was stopped, because that bypasses the registry and the network policy. Next step needs local environment: run the CLI with network access, then port the tree, rail, trigger and cookie state with the existing tests (spec in the 2026-10-03 session: SidebarProvider with server-read initial state, `collapsible="icon"`, SidebarTrigger and Rail, menu items, collapsed popover tree, mobile sheet, all current behaviours and tests preserved) Update 2026-10-03: asked how to unblock, you asked whether I can run the CLI myself: I can, but this cloud container is where the network policy blocks `ui.shadcn.com`. Options: allow `ui.shadcn.com` under Custom Allowed domains in the environment's Network access settings ([cloud environments](https://code.claude.com/docs/en/cloud-environments#network-access)), or run `bunx shadcn@latest add sidebar` locally and push `components/ui/sidebar.tsx`. Recommended: allow the host
- [x] **D-4 Whose plan applies to document and block quotas**: decided 2026-10-03: the workspace owner's plan. Done in 752ee19 (see C-38)
- [x] **D-5 Reset password**: decided 2026-10-03: require a session and use Better Auth `changePassword`. Done in 02941f2 (see C-39). Consequence: signed-out forgotten-password recovery no longer exists (F-AUTH-1)
- [x] **D-6 Touch targets in the dense desktop sidebar tree**: decided 2026-10-03: keep stock sizes (28 px icon buttons meet WCAG 2.2 AA 24 px). No change; revisit on mobile usability feedback

## Open work by area

### Security

- [x] **F-SEC-1** `resetPassword` unauthenticated old-password oracle and unthrottled (ledger LIP-V003 remainder). Fixed by removing the action and requiring a session (C-39, D-5); `changePassword` goes through Better Auth's limiter. Evidence: 02941f2, `change-password-form.test.tsx`, `proxy.auth-routes.test.ts`. Live verification in section 4
- [ ] **F-SEC-2** Content-Security-Policy is report-only, never enforcing (C-42); enforce it after live checks. Kind: improvement. Priority: P2. Evidence: `lib/security/csp.ts`, `next.config.ts`. Status: partial; needs local environment: browser against a production build (watch the console for report-only violations on lobby, auth, dashboard and editor routes, Google and GitHub avatars, an UploadThing upload and `utfs.io`/`*.ufs.sh` display, Stripe checkout and portal redirect, realtime `wss://`). Known limits: static policy with `'unsafe-inline'` (nonces would force every page dynamic with `cacheComponents`), no `report-uri` endpoint, header baked at build time from `NEXT_PUBLIC_LIPI_REALTIME_URL`, `js.stripe.com` may be unnecessary (server-side redirect checkout)
- [x] **F-SEC-3** Reset action did not revoke sessions and wrote the legacy `users.password` column. Fixed with D-5: `changePassword` uses `revokeOtherSessions: true` and the action is gone (C-39)
- [x] **F-SEC-4** Stripe webhook now logs the verification error server-side and returns a generic 400 (C-43)
- [ ] **F-SEC-5** `getClientIp` (`lib/proxy/client-ip.ts`) now prefers `x-real-ip`, else walks `x-forwarded-for` from the right skipping private hops, and the `@ts-expect-error` on `req.ip` is gone (C-43). It still trusts those headers when not behind Vercel or another trusted proxy; a trusted-proxy-count env setting would fix that. Kind: fix. Priority: P3. Status: partial, decision needed (trusted proxy configuration)
- [ ] **F-SEC-6** `pages:changed` stateless messages can be sent by any connected realtime client (pre-existing, not reproduced). Kind: fix. Priority: P2. Evidence: previous UI follow-up; `realtime/server.ts`. Status: needs local environment: realtime server plus two sessions
- [ ] **F-SEC-7** `lib/workspace/permissions.ts:61` still throws a plain `Error("Forbidden")` instead of `MutationAuthError` with a code. Kind: improvement. Priority: P3. Evidence: source. Status: open Update: `assertWorkspacePermission` has no callers and `mutation-auth.ts` already imports `permissions.ts` (a circular import if it threw `MutationAuthError`), so the clean fix is to delete the unused function; the permissions system blocked the edit. Status: decision needed (delete it?)
- [x] **F-SEC-8** `inTrash` dropped from `updateDocumentSchema` (Zod strips unknown keys); callers only pass `title`. Evidence: aa99edd, `lib/validations/document.test.ts` (C-43)

Reviewed, no issue: `/api/realtime/token` (same-origin check, 60 s HMAC token, `timingSafeEqual`), UploadThing middleware (session and permission per route), `lib/auth/redirect.ts` (blocks backslash, `//`, encoded variants), the dev invite email log and credentials logger (development only).

### Correctness and data

- [x] **F-COR-1** Quota owner inconsistency fixed with D-4 (C-38)
- [x] **F-COR-2** `restoreDocument` now enforces the root-page quota against the owner's plan and rethrows known errors, so the user sees "Root page limit reached" (752ee19, `document.test.ts` restore cases). The typed FORBIDDEN result for restore is still open (F-ERR-8)
- [ ] **F-COR-3** Pending collaborator invites are not counted against the Free limit; the check-then-insert at invite and accept time is not atomic, so concurrent accepts can pass together. Kind: bug candidate. Priority: P3. Evidence: `lib/db/queries/workspace-members.ts` `createWorkspaceCollaboratorInvite`, `lib/billing/enforce-quotas.ts` `countCollaboratorsForOwner`. Status: needs local environment: concurrency repro needs a database Update: invites now count other unexpired pending invites against the Free limit (a re-issue for the same workspace and email is excluded); the accept path and the concurrency race are unchanged (C-43). New: `countPendingInvitesForOwner` counts per email across all of the owner's workspaces, so one email invited to two workspaces counts twice (same as collaborator rows)
- [ ] **F-COR-4** `transferWorkspaceOwnership` does not recheck the new owner's collaborator quota (the previous owner becomes an editor). Kind: bug candidate. Priority: P3. Evidence: `lib/db/queries/workspace-settings.ts:63-105`. Status: open Update: skipped on purpose: the new owner inherits the remaining collaborators plus the old owner as editor, so the right check is not a simple add-one; needs a product decision on whether Free owners may receive a transfer. Status: decision needed
- [ ] **F-COR-5** `moveToTrash` and root-page creation flows now roll back client-side, but a removed member's open session is only informed on the next navigation (not pushed live), and the layout and child page render in parallel, so a child page's own `MutationAuthError("Forbidden")` may still reach the error boundary. Kind: bug candidate. Priority: P2. Evidence: `app/dashboard/(workspaces)/[workspaceId]/layout.tsx`, `components/workspace-access-revoked.tsx`. Status: needs local environment: real app, two sessions
- [ ] **F-COR-6** `components/sidebar/document-tree.tsx` empty state says "Only editors and the owner can add pages" whenever `canEdit` is false, including the unknown-role state. Kind: fix. Priority: P3. Evidence: source. Status: open
- [x] **F-COR-7** `OAuthAccountNotLinked` toast moved into an effect keyed on the error param (0b97d68, `login-form.test.tsx`) (C-43)
- [ ] **F-COR-8** `/nope` returned HTTP 200 in the dev server (probably dev streaming; not investigated). Kind: verification gap. Priority: P3. Evidence: Playwright status output during the responsive review. Status: needs local environment: production build check (`bun run build` crashed on Bun 1.3.14 here, see F-OPS-3)
- [ ] **F-COR-9** Unfixed correctness gaps from the ledger: `LIP-V004` `?from=` round trip is consistent by source (proxy, invite route, `getSafeRedirectPath`, covered by `proxy.auth-routes.test.ts` and `lib/auth/redirect.test.ts`) but the browser login was not driven. Kind: verification gap. Priority: P3. Status: needs local environment: database plus browser

### Performance

- [x] **F-PERF-1** `getDocuments` and every mutation reload now select `DocumentSummary` columns only (no `content`); the client store and layout payload are typed `DocumentSummary` (C-44)
- [x] **F-PERF-2** `loadWorkspaceDocuments` selects summary columns; `duplicateDocument` fetches `content` itself for the duplicated subtree (C-44)
- [ ] **F-PERF-3** Search uses `ilike '%q%'` on the `content` text column with no trigram index, and user `%` and `_` are not escaped. Kind: improvement. Priority: P2. Evidence: `lib/db/queries/search.ts:84`. Status: open (index needs a Postgres extension; see proposals)
- [ ] **F-PERF-4** `deleteDocumentPermanently` deletes one row per query in a loop (N round trips). Kind: improvement. Priority: P3. Evidence: `lib/db/queries/document.ts` (~line 270). Status: needs local environment: database (FK and cascade order)
- [ ] **F-PERF-5** Layout and page each call `getWorkspaceMembershipRole` (2 queries each) and the workspace home page calls `getDocuments` after the layout does; wrapping the lookup in React `cache()` would dedupe it. Kind: improvement. Priority: P3. Evidence: `app/dashboard/(workspaces)/[workspaceId]/layout.tsx`, `page.tsx`. Status: open
- [ ] **F-PERF-6** Workspace-list tags are invalidated globally (`revalidateTag("get_private_workspaces", "max")` and the two siblings) on any workspace or member change, so one user's change invalidates every user's cache. Kind: improvement. Priority: P3. Evidence: `lib/db/queries/workspace.ts`, `workspace-settings.ts:32-35`, `workspace-members.ts:46-49`. Status: open (per-user tags; see proposals)
- [ ] **F-PERF-7** `document-tree.tsx` and `trash.tsx` subscribe to the whole `useAppState()` snapshot; no measurable problem shown (valtio tracks property access; React compiler is on). Kind: improvement. Priority: P3. Evidence: `components/sidebar/document-tree.tsx:93`, `components/trash.tsx:46`. Status: open, unmeasured
- [ ] **F-PERF-8** `getDocuments` has no `updatedAt` ordering (orders by `createdAt`); consumers wanting recency sort themselves. Kind: improvement. Priority: P3. Evidence: `lib/db/queries/document.ts` `getDocuments`. Status: open Update: skipped on purpose: `buildDocumentTree` keeps input order, so ordering by `updatedAt` would reorder the sidebar on every edit. `getDocuments` stays in `createdAt` order; the workspace home sorts by recency client side (C-18). Status: wontfix unless the tree gets explicit ordering
- [ ] **F-PERF-9** Bundle sizes and Core Web Vitals were not measured (no working production build here). Kind: verification gap. Priority: P2. Status: needs local environment: production build (see F-OPS-3)

### Architecture and dependencies

- [x] **F-ARCH-1** Non-function const aliases removed from the `"use server"` module (`getDocumentsFromDb` unused and deleted; `updateDocumentInDb` callers now use `updateDocument`; barrel updated) (C-43)
- [ ] **F-ARCH-2** Mutating server actions and read helpers share `"use server"` modules behind a barrel (`lib/db/queries/index.ts`), so a read helper can become an endpoint again; client components import through the barrel (`components/settings.tsx:55`, `components/sidebar/document-tree.tsx:49`, `components/trash.tsx:25`). Kind: improvement. Priority: P2. Status: open (see proposals)
- [x] **F-ARCH-3** `resetPassword` outside `lib/auth/`: moot, the action was removed (C-39)
- [ ] **F-DEP-1** `@uploadthing/react` 7.3.3 and `uploadthing` 7.7.4 are version-mismatched exact pins. Kind: fix. Priority: P3. Evidence: `package.json`. Status: open (no blanket upgrades; align deliberately)
- [ ] **F-DEP-2** Pinning is inconsistent (exact: hocuspocus 4.7.0, uploadthing, postgres 3.4.9 (intentional, `renovate.json` ignoreDeps), y-* and yjs, next, react; caret elsewhere). Kind: improvement. Priority: P3. Status: open
- [ ] **F-DEP-3** `bun audit` went from 33 (19 high, 11 moderate, 3 low) to 18 (10 high, 6 moderate, 2 low) with a flat `overrides` block in `package.json` (@babel/core, @babel/helpers 7.29.7, @humanfs/node 0.16.8, browserslist 4.29.3, cross-spawn 7.0.6, effect 3.22.2, flatted 3.4.4, js-yaml 4.3.2, micromatch 4.0.8) (C-45). Remaining 18 are transitive packages needing two majors at once (Bun 1.3.14 ignores nested and range-scoped overrides): `minimatch` 3.1.2 (under eslint-plugin-react, jsx-a11y, import), `brace-expansion` 1.1.11, `picomatch` 2.3.1, `esbuild` 0.18.20 (drizzle-kit via @esbuild-kit), `braces` 3.0.3 (no fix published), `@eslint/plugin-kit` 0.2.3 (stale lockfile entry for eslint 9.16.0), plus `ajv`; some rows look like audit false positives (`tsx > esbuild`), so treat 18 as an upper bound. Clearing them needs bumping `shadcn`, `eslint-plugin-react`, `drizzle-kit` and `@commitlint`, or pruning the lockfile. Kind: improvement. Priority: P2. Status: partial, decision needed (bump those tools)
- [ ] **F-DEP-4** `pg` devDependency has no import (likely drizzle-kit via `kirimase.config.json`); `sharp` has no import (Next image optimization, Docker only). Neither removed without a drizzle-kit or Docker run. Kind: verification gap. Priority: P3. Status: needs local environment: drizzle-kit and Docker build
- [ ] **F-DEP-5** `cn` (0.4.0) is a little-known drop-in used by shadcn source (`components/ui/*.tsx` import `"cn"`), so it cannot be swapped without editing shadcn files. Kind: improvement. Priority: P3. Status: open (see proposals)
- [ ] **F-DEP-6** Hocuspocus 4.7 does not start under Bun (`crossws` Node adapter), so `realtime:*` needs Node 22. Revisit when Hocuspocus supports Bun. Kind: improvement. Priority: P3. Evidence: `bun realtime/server.ts` fails at startup. Status: open
- [ ] **F-DEP-7** License checks and bundle weight were not run. Kind: verification gap. Priority: P3. Status: needs local environment: production build
- [ ] **F-DEP-8** Informational, no action: `@types/node` 22.20.4 matches `engines`; `@types/react*` 19.3.0 match react; `@hugeicons/react` and `@hugeicons/core-free-icons` are both used with no overlapping icon library; `react-resizable-panels` is gone. Status: open (informational)

### Error handling and logging

- [x] **F-ERR-1** `createWorkspace` returns a typed result so quota and permission messages survive production; `workspace-form.tsx` shows them (C-41)
- [ ] **F-ERR-2** Settings member, role, transfer, delete and save actions return typed results and the toasts show the server message (C-41). Still open: `listWorkspaceMembers` load failures (`components/settings.tsx` `refresh` and the load effect) use `error instanceof Error ? error.message : ...`, which production sanitizes; needs a typed result for that read. Kind: fix. Priority: P3. Status: partial
- [x] **F-ERR-3** `SKIP_ENV_VALIDATION` parsed through `isEnvValidationSkipped()` (`lib/env-flags.ts`, exact string `"true"`) in `env.ts`, `auth.ts`, `resolve-auth-base-url.ts`, `database-url.ts` (f378bb4, `env-flags.test.ts`) (C-43)
- [ ] **F-ERR-4** About 20 modules read `process.env` directly (`lib/db/index.ts:9`, `lib/stripe/billing-env.ts`, `lib/realtime/token.ts:20`, `lib/realtime/client.ts:9`, `realtime/server.ts:9`); `NEXT_PUBLIC_LIPI_REALTIME_URL`, `LIPI_REALTIME_ALLOWED_ORIGINS` and `NEXT_PUBLIC_VERCEL_*` are not in the schema. Kind: improvement. Priority: P3. Status: open
- [ ] **F-ERR-5** Server logging is unstructured (`console.error((e as Error).message)` drops stack, cause and digest). Kind: improvement. Priority: P3. Evidence: `lib/db/queries/document.ts:123,150,193,225,250,276,326`, `lib/db/queries/workspace.ts:73,106,130,154`. Status: open
- [ ] **F-ERR-6** `app/(lobby)/error.tsx` omits `error.digest`, unlike the root and dashboard boundaries. Kind: fix. Priority: P3. Status: open
- [ ] **F-ERR-7** `app/dashboard/loading.tsx` shows an editor-shaped skeleton for non-editor pages (new-workspace included); no dedicated loading or error state for `/dashboard/new-workspace`. Kind: improvement. Priority: P3. Status: open
- [ ] **F-ERR-8** Typed results now also cover `restoreDocument`, `deleteDocumentPermanently`, workspace and settings actions (C-41). Still throwing: `updateDocument` (callers do not distinguish a denial) and `acceptWorkspaceInvite` (only caller is `app/invite/[token]/route.ts`, which redirects). Kind: improvement. Priority: P3. Status: partial
- [ ] **F-AUTH-1** Signed-out forgotten-password recovery does not exist (the unauthenticated reset flow was removed with D-5, no email-link flow exists). A real recovery needs an email provider (Better Auth `sendResetPassword` plus an email service); the repo has no email sending. Kind: product gap. Priority: P2. Status: open, decision needed (email provider) Free provider options (limits from memory, check current pricing): Resend (about 3,000 emails per month, 100 per day; simplest API; verified domain needed to send to anyone), Brevo (about 300 per day; free plan adds a Brevo footer), MailerSend (about 3,000 per month; one domain), Gmail or Workspace SMTP (about 500 per day; app password; not for production), Amazon SES (pay-per-use, a few cents per 1,000; sandbox first), Postmark (tiny free tier). Recommendation: Resend with a domain, otherwise Brevo. Awaiting your provider choice
- [ ] **F-AUTH-2** Better Auth `changePassword` needs a credential account row, so a legacy user with only `users.password` or an OAuth-only user gets Better Auth's error toast. Whether the legacy backfill (F-OPS-1) covers every such user is unchecked. Kind: verification gap. Priority: P2. Status: needs local environment: real database. Also informational: `sensitiveSessionMiddleware` needs a session not served from cookie cache; `cookieCache` is disabled in `lib/auth/create-auth.ts:75-77`, so fine today

### Design, accessibility and responsive

The design pass (completed items C-22 to C-24 and C-31 to C-32) kept stock shadcn/ui components, variants and the existing theme tokens; no restyle. What remains:

- [ ] **F-UI-1** Contrast was not measured anywhere. Collaboration cursor colour `#7c3aed` (`components/document-editor/document-block-editor.tsx`) and `text-white` on presence colours (`document-collaborators.tsx`) are unchecked; the logo text-shadow hardcodes `#e1e1e1` (`app/(lobby)/components/lobby-navbar.tsx`, `components/site-footer/footer.tsx`). Kind: verification gap. Priority: P3. Status: needs local environment: browser plus axe or manual contrast
- [ ] **F-UI-2** Footer content is template leftover: every footer link (including Privacy and Terms) points to a GitHub placeholder although `/privacy` and `/terms` exist; the newsletter copy ("exclusive travel offers") was removed with the form (C-37). Kind: fix. Priority: P3. Evidence: `components/site-footer/footer.tsx` (`footerLinks`). Status: open
- [ ] **F-UI-3** Tech-stack copy has a typo ("Subabase") and says "React 18" while the app is on React 19. Kind: fix. Priority: P3. Evidence: `app/(lobby)/components/tech-stack.tsx`. Status: open
- [ ] **F-UI-4** `app/(auth)/components/oauth-buttons.tsx` wrapper has a stray `text-white`. Kind: fix. Priority: P3. Status: open
- [ ] **F-UI-5** Sidebar footer hardcodes "Free plan" under the user name regardless of plan (expanded and collapsed). Kind: bug. Priority: P3. Evidence: `components/sidebar/sidebar-panel.tsx`. Status: open
- [ ] **F-UI-6** Touch targets below 44 px: lobby Login and Sign Up buttons (`h-8`) and footer theme-toggle items (`size-8`); dense tree buttons see D-6. Kind: improvement. Priority: P3. Status: open (stock shadcn sizes kept deliberately)
- [ ] **F-UI-7** Workspace home and other full-height shells use `h-screen` or `min-h-screen`; `dvh` avoids mobile URL-bar clipping (about 6 class swaps in `sidebar.tsx`, `workspace-shell.tsx`, `app/dashboard/loading.tsx`). Kind: improvement. Priority: P3. Status: open
- [ ] **F-UI-8** Collapsed-rail tree popover (`document-tree-collapsed.tsx`) is `w-72` with `max-h-96 overflow-hidden` and may clip long trees. Kind: verification gap. Priority: P3. Status: needs local environment: live render
- [ ] **F-UI-9** After client navigation focus stays on the clicked link (no programmatic focus move to `#main-content`). Kind: improvement. Priority: P3. Status: open (see proposals for a small client component)
- [ ] **F-UI-10** Live design checks on DB-backed pages: dialogs at 320 px, sidebar width animation, collapsed popovers during animation, emoji picker at 320 px, Stripe button busy state, reduced-motion behaviour, dark mode, header with more than four collaborators, tablet 768-1023 px (sidebar hidden below `lg`, sheet menu). Kind: verification gap. Priority: P2. Status: needs local environment: database, seeded data, browser

### Tests

- [ ] **F-TST-1** Direct `process.env` writes with no cleanup in `lib/smoke.test.ts:60`, `lib/auth/*.test.ts`, `proxy.auth-routes.test.ts`, `lib/proxy/proxy-rate-limit.test.ts`. Low impact (vitest isolates per file). Kind: fix. Priority: P3. Status: open
- [ ] **F-TST-2** Sleep-based waits can flake under load: `components/search-command.test.tsx:233` (250 ms debounce), `lib/realtime/server-factory.test.ts:174` (100 ms before a negative assertion), `components/sidebar/document-tree.test.tsx:90`. Kind: fix. Priority: P3. Status: open
- [ ] **F-TST-3** About 25 weak `toBeTruthy()` existence assertions in `components/search-command.test.tsx`, `trash.test.tsx`, `sidebar/*.test.tsx`. Kind: improvement. Priority: P3. Status: open
- [ ] **F-TST-4** The quota DB mock in `lib/billing/enforce-quotas.test.ts` is a chainable stub: it checks plan logic, not SQL; `getDocuments`, quota and move-to-root tests mock `db` and `next/cache`, so they prove ordering and branches, not cache behaviour in a real Next runtime. Kind: verification gap. Priority: P3. Status: needs local environment: database
- [ ] **F-TST-5** `tests/e2e/*.spec.ts` were not read in depth (no `waitForTimeout`, `.only` or `.skip` found; `retries: 0`, `forbidOnly` on CI) and not run. Add owner/editor/viewer cases for the trash dialog and tree (`collaboration.spec.ts` covers viewer typing only). Kind: verification gap. Priority: P2. Status: needs local environment: Docker Postgres, realtime, browser (ledger LIP-V015)
- [ ] **F-TST-6** No automated test for the hardware `Shift+F10` and `ContextMenu` keys (LIP-V023 is tool-dispatched only). Kind: verification gap. Priority: P3. Status: needs local environment: real keyboard

### Operations and docs

- [ ] **F-OPS-1** Backfill credential accounts for legacy users on the production database so they can sign in. Kind: fix (operational). Priority: P1. Evidence: [requirements](./requirements/requirements.md) §3.1 and §4, ledger LIP-V016. Status: needs local environment: production database access
- [ ] **F-OPS-2** Production keeps the default Drizzle history table (`drizzle.__drizzle_migrations`); only loopback `DATABASE_URL` uses `drizzle.__lipi_migrations`. If production shares the default table with another app, confirm its newer timestamps do not make Drizzle skip Lipi migrations. Also confirm the LIP-V001 `0004` fix on a database that really applied the old `0004`. Kind: verification gap. Priority: P2. Evidence: `drizzle.config.ts`, ledger LIP-V001. Status: needs local environment: production-like database
- [ ] **F-OPS-3** `bun run build` segfaults at the end of `next build` (Bun 1.3.14, SIGILL after ~93 s; compile and route table complete). It looks environment-specific. Credential logging against a production build is therefore only partly verified: `.next` contained no `LocalDev123` or "Local development credentials" strings, and credentials are read from `fixtures/local-dev-credentials.json` at runtime only after the development and nodejs gates. Kind: verification gap. Priority: P2. Status: needs local environment: production build and server
- [ ] **F-OPS-4** The lint-staged config (`package.json`, `lint-staged` block) passes `**/*.{ts,tsx,mdx}` to prettier instead of the staged files, so each commit reformats the whole tree and is slow. Kind: fix. Priority: P3. Status: open
- [ ] **F-OPS-5** ESLint and Vitest sweep any worktree under `.claude/worktrees` (hundreds of false errors while agent worktrees exist). Add `.claude/worktrees` to the eslint ignores and vitest `exclude`. Kind: fix. Priority: P3. Evidence: `bun run lint` and `bun run test` reported 312 lint errors and 220 failed tests while worktrees were present, clean after removal. Status: open
- [ ] **F-DX-1** `bun run fmt:check` fails on two files that were already unformatted before the session: `fixtures/local-dev-credentials.json`, `tsconfig.json`. Kind: fix. Priority: P3. Status: open
- [ ] **F-OPS-6** `bun run fmt` with Prettier on `components/ui` is now ignored (`.prettierignore`), so `shadcn --diff` shows real drift; re-run the shadcn diff check when next updating shadcn. Kind: improvement. Priority: P3. Status: open (informational follow-up)
- [ ] **F-OPS-7** README Vercel deploy button lists only core variables; realtime host, Stripe and UploadThing are optional or separate (documented 2026-10-03). Whether button deploy is a supported path is part of D-1. Kind: improvement. Priority: P3. Status: open
- [ ] **F-OPS-8** Stale feature-map text: `.agents/skills/verify/features/uploads.md:29` still lists the `.env.example` gap (LIP-V018) fixed on 2026-10-03; ledger entries LIP-V003 (partly), V005, V018 and V027 need their state updated. Kind: fix (docs drift). Priority: P3. Status: open (not edited: completion notes live only in this file)

## Needs local environment (verification)

Everything here needs a database, Docker, Redis, a realtime server, seeded data or a browser against the real app; none could be run in the cloud. Each stays open until a local run proves it (ledger IDs link to the evidence and scope).

- [ ] Run the verify skill live (launch, doctor, drive, evidence, cleanup) and update each feature's `Last live proof`. Priority: P2. Evidence: ledger LIP-V012, [verify skill](../.agents/skills/verify/SKILL.md)
- [ ] Re-run the Playwright suite (`bun run test:e2e`: auth-workspace, documents-editor, collaboration, stripe-checkout); results are prior proofs only. Priority: P2. Evidence: ledger LIP-V015
- [ ] Browser-verify the email-only login page (light/dark, keyboard focus). Priority: P2. Evidence: `app/(auth)/components/login-form.tsx`
- [ ] Auth flows: reset password (now with the generic-error change), `?from=` return after login, password-rule messages, session expiry, unknown-user message. Priority: P2. Evidence: ledger LIP-V007, V004, [auth-session](../.agents/skills/verify/features/auth-session.md)
- [ ] Authorization matrix: signed-in `curl` for the 403/400/401/503 branches of `/api/realtime/token` and `/api/stripe/checkout`, webhook signature failures (the proxy now lets `/api/stripe/webhook` and UploadThing callbacks through, see C-28), UploadThing permissions, owner-only controls for editors. Priority: P2. Evidence: ledger LIP-V008, [access-control-anonymous](../.agents/skills/verify/features/access-control-anonymous.md)
- [ ] Realtime: three users, presence list, token refresh after 60 s, reconnect after restart, revoked member, sidebar stateless events. Priority: P2. Evidence: ledger LIP-V009, [realtime-collaboration](../.agents/skills/verify/features/realtime-collaboration.md)
- [ ] Documents, trash and tree: subpages, rename/duplicate, icons/covers, block quota, restoring a page with trashed ancestors, trash descendants, viewer denial of permanent delete; typed FORBIDDEN toasts and rollback live. Priority: P2. Evidence: ledger LIP-V010, [documents-editor](../.agents/skills/verify/features/documents-editor.md), [trash-search](../.agents/skills/verify/features/trash-search.md)
- [ ] Billing and quotas live: `/pricing` anonymous and signed in, `Go Pro` with billing unconfigured, portal, webhook signature failures, Free-plan quota messages (1 workspace, 2 collaborators, 500 blocks); live Stripe stays out of scope. Priority: P2. Evidence: ledger LIP-V011, [billing-pricing](../.agents/skills/verify/features/billing-pricing.md)
- [ ] Workspaces and invites: settings dialog, collaborator quota on invite, token reuse and invalid/expired token (the new `?invite=invalid` notice, C-17, was unit-tested but not driven), transfer ownership, delete workspace. Priority: P2. Evidence: ledger LIP-V005, V008, V011, [workspaces-roles-invites](../.agents/skills/verify/features/workspaces-roles-invites.md)
- [ ] UI quality live (see F-UI-10) plus the collapsed-rail anchor fix and sidebar width transition. Priority: P2. Evidence: ledger LIP-V013, [ui-quality](../.agents/skills/verify/features/ui-quality.md)
- [ ] Removing a member while that user has the workspace open (see F-COR-5). Priority: P2. Evidence: ledger LIP-V026
- [ ] Workspace home: confirm recency ordering, parent context and client-side dates at 320-1920 px with real data. Priority: P3. Evidence: C-18
- [ ] Lobby and legal pages in a production build: `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, 404 and error boundaries, the new mobile menu opened state and focus order, skip link. Priority: P3. Evidence: ledger LIP-V013, [lobby-legal-public](../.agents/skills/verify/features/lobby-legal-public.md); development build screenshots only
- [ ] Uploads without credentials: unauthenticated rejection, role paths, URL-based cover and logo; binary delivery needs `UPLOADTHING_TOKEN`. Priority: P3. Evidence: ledger LIP-V010, [uploads](../.agents/skills/verify/features/uploads.md)
- [ ] Search in a production build and by keyboard selection; cross-workspace content exposure beyond the non-member denial. Priority: P3. Evidence: ledger LIP-V020
- [ ] A trashed page opened by direct URL: is it still editable? Priority: P3. Evidence: ledger LIP-V022, [realtime](./guides/realtime.md)
- [ ] OAuth (Google/GitHub) round trip; no passkey flow exists. Priority: P3. Evidence: ledger LIP-V014
- [ ] Collapsed-sidebar checks: long page titles, Safari and Firefox. Priority: P3. Evidence: C-8
- [ ] Prove `Shift+F10` and the `ContextMenu` key on real hardware keyboards (see F-TST-6). Priority: P3. Evidence: ledger LIP-V023
- [ ] Greenfield `bun run db:migrate` end to end after all fixes. Priority: P2. Evidence: ledger LIP-V001

## Proposals for review

Not adopted. Each needs your decision.

- **P-1 (adopted 2026-10-03, C-41) Typed server-action results everywhere** (extend `lib/db/mutation-result.ts` to workspace, settings, restore, permanent delete). Rationale: production strips thrown messages, so toasts lose quota and permission text (F-ERR-1, F-ERR-2, F-COR-2). Trade-offs: a consistent client contract versus touching about 15 actions and every call site. Migration cost: medium. Risks: contract drift if the type is not shared; do it per area behind tests.
- **P-2 Split `lib/db/queries` into `actions/` (with `"use server"`, each action authenticating) and `data/` (plain reads)**. Rationale: makes the endpoint boundary visible from the path and prevents read helpers re-becoming endpoints (the issue fixed in C-25). Trade-offs: clearer security boundary versus many import and test-mock path changes. Migration cost: medium. Risks: merge conflicts, barrel star-export problems.
- **P-3 Add the `server-only` package to DAL and billing modules**. Rationale: build-time guard against client bundling; Next documents it. Trade-offs: new dependency; the `lib/realtime/*` modules also run under plain Node (`realtime/server.ts`), where the import can throw, so they must stay out. Migration cost: low. Risks: breaking the realtime server.
- **P-4 (adopted 2026-10-03, C-44) `DocumentSummary` type without `content` for the tree, trash and client state**. Rationale: cuts RSC payload and DB transfer for large workspaces (F-PERF-1, F-PERF-2); the realtime server already holds content. Trade-offs: leaner payloads versus type changes across tree, trash and `client-document-state`, and the duplicate and optimistic flows must not rely on `content`. Migration cost: medium. Risks: low.
- **P-5 `pg_trgm` GIN index on `documents.title` and `documents.content`** (or a stored plain-text column) for search (F-PERF-3). Trade-offs: index-assisted `ilike` versus index size, write cost and a Postgres extension required on the production host. Migration cost: one migration. Risks: extension availability.
- **P-6 Per-user cache tags for workspace lists** (F-PERF-6). Trade-offs: no global invalidation versus more tag bookkeeping. Migration cost: small. Risks: low.
- **P-7 Wrap multi-row document mutations in a transaction** (`deleteDocumentPermanently`, `softDeleteDocumentTree`, `restoreDocument`). Rationale: prevents partial deletes and stale-snapshot races. Trade-offs: longer transaction scope. Migration cost: small, no schema change. Risks: low.
- **P-8 (adopted 2026-10-03 as D-4, C-38) Single "workspace owner plan" helper for document, block and collaborator quotas** (D-4, F-COR-1). Trade-offs: removes the actor-versus-owner inconsistency but changes behaviour for editors on Free. Migration cost: small. Risks: product decision required.
- **P-9 (adopted as report-only 2026-10-03, C-42) Content-Security-Policy via `headers()` or the proxy with nonces, report-only first** (F-SEC-2). Rationale: limits XSS escalation. Trade-offs: Next inline scripts, Stripe, UploadThing and the realtime host need allowlisting. Migration cost: medium. Risks: a broken editor or uploads if too strict.
- **P-10 Return 401 JSON instead of a login redirect for unauthenticated `/api/*` calls**. Rationale: clearer client and API behaviour. Migration cost: small. Risks: low.
- **P-11 (adopted 2026-10-03 as D-5, C-39) Throttle `resetPassword` or move to Better Auth `changePassword` behind a session** (D-5, F-SEC-1). Trade-offs: closes the remaining oracle versus changing the unauthenticated reset UX. Migration cost: medium. Risks: product decision.
- **P-12 Central structured `logger` wrapper** (F-ERR-5). Rationale: keeps stack, cause and digest and gives one place for Sentry later. Migration cost: small module plus many call-site edits. Risks: low; needs a log format decision.
- **P-13 Route all runtime env reads through `lib/env.ts`** (F-ERR-4). Trade-offs: one validated source versus `NEXT_PUBLIC_*` needing a `client`/`runtimeEnv` mapping, and the standalone realtime server cannot import t3-env-nextjs as is. Migration cost: medium. Risks: realtime host breakage.
- **P-14 Playwright axe-core accessibility check** in e2e. Trade-offs: catches contrast, label and landmark regressions automatically versus a new dev dependency and e2e runtime. Migration cost: low. Risks: most routes need a database.
- **P-15 Programmatic focus move to `#main-content` after client navigation** (F-UI-9). Small client component; needs live verification.
- **P-16 `dvh` instead of `h-screen` in the dashboard shell** (F-UI-7). Trade-offs: fixes mobile URL-bar clipping versus older-browser fallback. Migration cost: low (about 6 class swaps). Risks: layout shift while the bar collapses.
- **P-17 `knip` in CI** for unused dependencies and exports. Trade-offs: automated detection versus config and noise on shadcn files. Migration cost: low. Risks: false positives on config-only deps (`sharp`, `babel-plugin-react-compiler`).
- **P-18 (partly adopted 2026-10-03, C-45) `overrides` or `resolutions` for the vulnerable transitive packages** (F-DEP-3). Trade-offs: clears most `bun audit` output without major bumps versus peer expectations. Migration cost: low. Risks: needs full test and e2e runs.
- **P-19 Replace `cn` with `clsx` + `tailwind-merge`** (F-DEP-5). Trade-offs: standard shadcn default and a stronger bus factor, but shadcn files import `"cn"` and cannot be edited, so it needs a re-export in `lib/utils.ts` or regenerated shadcn. Migration cost: medium. Risks: class-merge behaviour differences.
- **P-20 Shared env-stubbing helper or vitest `unstubEnvs: true`** (F-TST-1). Trade-offs: removes manual restores versus a global behaviour change. Migration cost: low. Risks: tests relying on env set in `beforeAll`.

## Completed

Evidence for the 2026-10-03 cloud session is the merged gate result at the top (type-check, lint, 306 unit tests) plus the cited tests; nothing was run in a browser unless stated. Older items cite implementation, test or documentation files present on `feat/complete-lipi`; their tests were not re-run when first indexed.

### Product (earlier)

- [x] C-1 Better Auth email and password sign-in - `lib/auth/create-auth.ts`, `lib/auth/*.test.ts`, `tests/e2e/auth-workspace.spec.ts`
- [x] C-2 Workspaces with owner/editor/viewer roles and email invites - `lib/workspace/permissions.ts`, `lib/workspace/workspace-invites.test.ts`, migration `0009_workspace_roles_invites.sql`
- [x] C-3 Block-based document pages in a tree sidebar - `components/document-editor/`, `lib/db/documents-tree.ts`, `tests/e2e/documents-editor.spec.ts`
- [x] C-4 Real-time collaboration (Hocuspocus + Yjs, signed room tokens, presence) - `realtime/server.ts`, `app/api/realtime/token/route.ts`, `tests/e2e/collaboration.spec.ts`; see [realtime](./guides/realtime.md)
- [x] C-5 Free/Pro quotas and Stripe checkout/portal/webhook - `lib/billing/plan-quotas.ts`, `app/api/stripe/`, `tests/e2e/stripe-checkout.spec.ts`
- [x] C-6 Product requirements and portfolio showcase scope - [requirements](./requirements/requirements.md)
- [x] C-7 Trash controls and empty-state polish - `components/trash.tsx`, `components/trash.test.tsx`
- [x] C-8 Collapsible sidebar (2026-10-03, earlier): two states only (full 16rem, icon rail 3.5rem), toggle in the navbar (`aria-expanded`, tooltip, keyboard), state in the `lipi_sidebar_collapsed` cookie read server-side. Evidence: `components/sidebar/sidebar-state.tsx`, `app/dashboard/(workspaces)/components/workspace-shell.test.tsx`, live run in Chrome (expand, collapse, tooltip, Enter/Space, reload persistence, light, dark, 390 px sheet, 1023/1024 px boundary)
- [x] C-9 Docs link fixes (2026-10-03, earlier): ledger LIP-V016 link and the `workspaces-roles-invites` feature map now point to existing files
- [x] C-10 Verification skill and feature map ([.agents/skills/verify](../.agents/skills/verify/SKILL.md), symlinked at `.claude/skills/verify`), single issue ledger, non-browser gates re-run 2026-10-02 (62 files, 225 tests)
- [x] C-11 shadcn source modification check (details below)

### Cloud session 2026-10-03: phase 1 (to-do items)

- [x] C-12 Credential logger simplified (was "bf8f5d4 more verbose than needed"): sync `logLocalDevCredentials()` with no top-level call, no `import.meta.url`, fixture read from `fixtures/local-dev-credentials.json` via `process.cwd()`; `instrumentation.ts` keeps development and nodejs gates. Evidence: commit c229fef, `lib/dev-credentials-logger.test.ts` (3 cases). Caveat: production-build gate only partly verified, see F-OPS-3
- [x] C-13 `.env.example` now lists `UPLOADTHING_*`, `NEXT_PUBLIC_LIPI_REALTIME_URL`, `LIPI_REALTIME_*` (defaults from `lib/env.ts`, `realtime/server.ts`, realtime guide). Ledger LIP-V018 fixed; evidence c229fef
- [x] C-14 README deploy section made accurate about realtime host, Stripe and UploadThing (decision D-1 untouched). Evidence: c229fef
- [x] C-15 Stale `Shift+F10` sentence in the verify skill replaced (hardware keyboards unproven). Evidence: c229fef
- [x] C-16 Unused `components/ui/resizable.tsx` and `react-resizable-panels` removed (grep found no importer); `components/ui` added to `.prettierignore`. Evidence: c229fef, type-check, lint, tests
- [x] C-17 Ledger LIP-V005: `?invite=invalid` is now displayed (dashboard page forwards the flag, `app/dashboard/invite-notice.tsx` shows a `role="alert"`; also on new-workspace). Evidence: commit 0b24f44, `app/dashboard/page.test.ts` (4 cases), `invite-notice.test.tsx`; not driven in a browser
- [x] C-18 Workspace home lists pages by most recent update, shows parent context and formats dates client-side (hydration-safe `useSyncExternalStore`), padding fits 320 px. Evidence: 0b24f44, `workspace-pages.test.ts`
- [x] C-19 LIP-V004 reviewed by source: proxy, invite route and login form are consistent (`from`); covered by `proxy.auth-routes.test.ts`, `lib/auth/redirect.test.ts`, `app/invite/[token]/route.test.ts`. Live round trip stays in section 4
- [x] C-20 Sidebar and search follow-ups (commit 9cab940): `createRootPage` rolls back on failure (ledger LIP-V027); `moveToTrash` rollback restores only the affected ids; destructive menu item uses `variant="destructive"`; `View only` badge is `text-xs`; nav-dialog descriptions are role-aware for viewers; `usePageAccess()` makes unknown role explicit and `useCanEditPages` fails closed; collapsed-rail trigger anchored (`flex-none`); Cmd+K handler no longer writes a ref inside a state updater; tests for tree viewer gating, create/trash rollback and Cmd+K focus restoration (`components/sidebar/document-tree.test.tsx`, `components/search-command.test.tsx`, `sidebar.test.tsx`). Collapsed-rail anchor not verified visually
- [x] C-21 Typed permission results (commit e1cf55e): `lib/db/mutation-result.ts` (`MutationResult`, `unwrapMutation`), `MutationAuthError` carries a code; `createDocument`, `duplicateDocument`, `softDeleteDocumentTree` return `FORBIDDEN` instead of relying on sanitized messages; the client shows "You do not have permission" and keeps the rollback; `softDeleteDocumentTree` now rethrows known errors. Removed-member state: layout renders `components/workspace-access-revoked.tsx`. Evidence: `mutation-result.test.ts`, `document.forbidden.test.ts`, `layout.test.tsx`, `document-tree.test.tsx`. Follow-ups F-ERR-8, F-COR-5
- [x] C-22 Sidebar width transition added (`transition-[width] duration-200 motion-reduce:transition-none`, fixed `w-64` inner panel so content clips instead of wrapping). Evidence: 39fd687, `sidebar.test.tsx` (classes only); not driven live
- [x] C-23 Design pass, authenticated surface (39fd687), stock shadcn only, source review plus unit tests: nav-dialog sizing (`sm:max-w-4xl`, scrollable on short phones); new-workspace page `min-h-screen`; loading skeleton breakpoint `lg` and reduced motion; emoji picker named and width-bounded; workspaces list focus ring and `aria-current`; collaborator overflow label; Stripe button keeps label with spinner and `aria-busy`; trash and search title truncation; document header (cover height, title size and name, cover preset `aria-pressed`); settings load-failure alert, wrapped logo row, labelled role menus, focus rings. Live verification in section 4
- [x] C-24 Design pass, public surface (951af8e): fixed horizontal overflow at 320 and 390 px on `/` (nested containers and `-mx-10`) and 320 px on `/pricing`; added a stock `DropdownMenu` mobile menu (`lobby-mobile-menu.tsx`, `lobby-links.ts`) and `aria-label="Main"`; `motion-reduce` on hero and marquees; landmark and heading fixes (nested `main`, auth `main`, `h2` to `p`, footer `h3` to `h2`); auth layout `min-h-dvh`; Terms and Privacy focus rings; footer social hit area. Evidence: dev-server Playwright runs of `/`, `/pricing`, `/terms`, `/privacy`, `/login`, `/signup`, `/reset-password`, `/nope` at 320/390/768/1024/1440/1920 in light and dark: no horizontal overflow and no console errors (screenshots not committed). Not inspected: opened dropdown, motion-enabled rendering, contrast

### Cloud session 2026-10-03: phase 2 (review fixes)

- [x] C-25 Server-action exposure: `"use server"` removed from `lib/billing/*` helpers and `lib/db/queries/subscription.ts` taking a caller-supplied `userId`; unused `getUserSubscription` deleted; `userId`-keyed workspace readers moved to `lib/db/queries/workspace-lists.ts` without the directive. Priority was P1. Evidence: d98c5fc, type-check, lint, tests. Which functions Next registered as endpoints was not observed (no production build)
- [x] C-26 `getDocuments` authorized after the shared cache (cache key lacked the user, so a hit skipped the access check; exported server action): authorization now runs before the cache on every call; duplicate check in `getDocumentBreadcrumbs` removed. Priority was P1. Evidence: 0084151, cff33f9, `lib/db/queries/document.get-documents.test.ts`, `document.test.ts` (mocked db, proves ordering only)
- [x] C-27 Moving a subpage to root now enforces the Free root-page limit (`assertRootPageQuota` in `updateDocument`). Priority P2. Evidence: 0084151, test in `document.test.ts`
- [x] C-28 Proxy let the Stripe webhook and UploadThing callbacks through instead of redirecting to `/login`; `/api/stripe/checkout` still redirects. Priority was P1. Evidence: 2592816, 4 new tests in `proxy.auth-routes.test.ts`
- [x] C-29 `resetPassword`: one generic error, a constant-time-ish dummy-hash bcrypt compare on every failure path and server-side `resetPasswordSchema.safeParse` (ledger LIP-V003 enumeration and timing part). Evidence: 1fe9c47, `lib/actions.test.ts` (3 tests). Remainder F-SEC-1
- [x] C-30 Baseline security headers in `next.config.ts`: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`. Evidence: 1d8afed; not observed in a running server
- [x] C-31 Accessibility (150a052): keyboard-reachable password toggles (5 buttons), skip link (`components/skip-link.tsx`, `#main-content`), global reduced-motion rule in `app/globals.css`, `global-error` dark styling via `prefers-color-scheme`, single `h1` in lobby, `h1` in lobby error, tree expand `aria-expanded` and focus ring, accessible names on inline rename and submit buttons. Evidence: `components/skip-link.test.tsx`, gates; not checked in a browser
- [x] C-32 Responsive (5fb993a): marquee cards `w-[min(28rem,80vw)]`, `min-w-0` and `break-words` on workspace title and document title row. Evidence: Playwright overflow run on public pages (48 combinations), source review for DB pages
- [x] C-33 Performance (392cb3f, a33deb6): realtime collaborator roster skips no-op updates (`hooks/use-app-state.test.ts`); empty-query search no longer selects `content`
- [x] C-34 Tests (454cf2f): new tests for quota enforcement (`enforce-quotas`, `block-quota`: free limits, 500-block boundary, pro, trialing, canceled, unset price), broader proxy routing (public routes, query string kept, 429 headers, first forwarded IP), env restores via `vi.stubEnv`
- [x] C-35 Billing client shows a friendly error instead of a JSON `SyntaxError` on non-JSON responses (fec0036, `lib/billing/checkout-client.test.ts`)
- [x] C-36 Dependencies (be55fd3, 755ef5a): removed unused `tsx`, deprecated `@types/bcryptjs` and `@types/uuid`, unused `@typescript-eslint/*` packages; `jiti` moved to runtime `dependencies` because `realtime/bootstrap.mjs` imports it and a production install skipping devDependencies would fail (not exercised with a production install)

### Cloud session 2026-10-03: owner decisions

- [x] C-37 D-2: footer newsletter form removed (`newsletter-subscription-form.tsx` deleted, footer heading and copy removed, layout unchanged: brand row plus four link columns). Evidence: 6abc18c, gates; not viewed in a browser. Ledger LIP-V006 resolved by removal
- [x] C-38 D-4: document and block quotas follow the workspace owner's plan via `workspaceOwnerHasProPlanEntitlement` (`lib/billing/quota-entitlement.ts`); `assertWorkspaceCanCreateBlock(workspaceId, n)` replaces the user-keyed block check; `createDocument`, move-to-root and `restoreDocument` use it. Evidence: 752ee19, `quota-entitlement.test.ts` (Free editor in Pro workspace gets Pro limits; Pro editor in Free workspace is limited; unknown workspace false), `block-quota.test.ts`, `document.test.ts`. Caveat: one extra owner lookup per check; the realtime guard in `lib/realtime/block-quota.ts` has no unit test of its own
- [x] C-39 D-5: unauthenticated `resetPassword` removed (`lib/actions.ts`, its tests, `/reset-password` page and form, `resetPasswordSchema`); new signed-in `app/dashboard/change-password` using Better Auth `changePassword` with `revokeOtherSessions: true`, `changePasswordSchema`, link in the sidebar account popover, `/reset-password` no longer public (proxy redirects signed-out visitors to login), "Forgot password?" link removed from the login form. Supersedes C-29. Evidence: 02941f2, `change-password-form.test.tsx` (3), `proxy.auth-routes.test.ts` (2 new); post-merge gates: 81 files, 313 tests. Not rendered in a browser. Follow-ups F-AUTH-1, F-AUTH-2. Stale references: `.agents/skills/verify/features/auth-session.md` (lines 7, 17, 23, 33, 39) and `access-control-anonymous.md` (line 7) still describe `/reset-password`; `lobby-legal-public.md` (lines 7, 13, 25) still lists the newsletter form (F-OPS-8)

### Cloud session 2026-10-03: proposals adopted and hardening

- [x] C-41 P-1 typed results (b5dcc91): `MutationResult` failure is `{ ok: false, code, message }` with codes `FORBIDDEN`, `UNAUTHORIZED`, `INVALID`, `QUOTA_EXCEEDED` and a message that is always safe to show; `unwrapMutation` throws `MutationFailureError` so existing `toast.promise` flows and rollbacks still work; `runMutation` (`lib/db/queries/mutation-failure.ts`) maps `PlanQuotaError`, `DocumentOperationError` and `MutationAuthError`. Converted: `createWorkspace`, `restoreDocument`, `deleteDocumentPermanently`, `createWorkspaceCollaboratorInvite`, `updateCollaboratorRole`, `removeWorkspaceMember`, `updateWorkspaceSettings`, `transferWorkspaceOwnership`, `deleteWorkspace`; call sites in `workspace-form.tsx`, `settings.tsx`, `trash.tsx`. Evidence: tests for each action and call site (`mutation-result.test.ts`, `mutation-failure.test.ts`, `workspace.test.ts`, `workspace-settings.test.ts`, `trash.test.tsx`, `settings.test.tsx`, `workspace-form.test.tsx`). Production behaviour inferred from unit tests, not observed
- [x] C-42 P-9 report-only CSP (bd2a8d8): `lib/security/csp.ts` (`buildCsp`, `realtimeConnectSource`), applied in `next.config.ts` as `Content-Security-Policy-Report-Only`; `proxy.ts` untouched. Evidence: `lib/security/csp.test.ts`. Verification list in F-SEC-2
- [x] C-43 Hardening: F-SEC-4, F-SEC-5 (partial), F-SEC-8, F-ARCH-1, F-COR-3 (invite part), F-COR-7, F-ERR-3, see those lines. Evidence: commits aa99edd to 129fe29, new tests `validations/document.test.ts`, `stripe/webhook/route.test.ts`, `proxy/client-ip.test.ts`, `login-form.test.tsx`, `env-flags.test.ts`, `enforce-quotas.test.ts`
- [x] C-44 P-4 `DocumentSummary` (6db1296): `DocumentSummary = Omit<Document, "content">` (`types/db.ts`), `documentSummaryColumns` (`lib/db/document-summary.ts`); `getDocuments`, `loadWorkspaceDocuments`, `createDocument`, `updateDocument` and `duplicateDocument` return or select summaries; `duplicateDocument` fetches `content` for the duplicated subtree as the fallback for authoritative Yjs content; client store, tree, trash and optimistic flows typed accordingly (no client code reads `content`; the editor takes the full `Document` from `assertDocumentAccess`). Evidence: `document.test.ts` (no `content` in selects, duplicate copies body), `client-document-state.test.ts`. Caveat: an old `unstable_cache` entry may briefly carry `content` after deploy (harmless). Search still `ilike`s `content` (F-PERF-3)
- [x] C-45 P-18 overrides (aec8fee): see F-DEP-3 for before and after counts; type-check, lint and tests unchanged; `next build`, e2e and drizzle-kit/uploadthing runtime paths not run

## shadcn source modification check (2026-10-03)

Method: `bunx shadcn@latest add <name> --diff components/ui/<name>.tsx` (CLI 4.21.1, style `base-nova`) for each of the 30 files in `components/ui/`, plus `git log -- components/ui`. Nothing was reverted or updated. `components/ui/resizable.tsx` was removed later the same day as unused (C-16); the 2026-10-03 design passes did not edit `components/ui`.

- [x] No behavioral modification found. 17 files match upstream or differ in formatting only (CLI reports "no diff" or "formatting-only"): alert-dialog, avatar, card, hover-card, input, kbd, label, popover, resizable (since removed), scroll-area, separator, skeleton, textarea, toggle-group, tooltip, and the import-order-only ones below
- [x] Formatting-only differences in accordion, badge, button, combobox, context-menu, dialog, dropdown-menu, input-group, navigation-menu, select, sheet, sonner, tabs, toggle: import order (`@hugeicons/*` before `@/` imports), `cva`/`VariantProps` type-import split, multi-line `cn(...)` arguments, wrapped icon imports. Pre-existing: introduced by the repo-wide Prettier/import-sort pass in `91f5f4b` (2026-10-02) on top of the CLI reset in `0321a94` and the combobox add in `c2b075b`
- [x] `components/ui/form.tsx` has no `base-nova` registry counterpart ("No file matching"), so it cannot be diffed upstream. Added in `579490b` (2023-12-10). Resolved 2026-10-03: it is imported by `app/dashboard/new-workspace/workspace-form.tsx`, `app/(auth)/components/{login,signup,reset-password}-form.tsx` and `components/settings.tsx`, and `react-hook-form` ^7.89.0 is a current dependency, so it is live code; a non-upstream, protected file; no change needed
- [x] Formatter config aligned with shadcn output by ignoring `components/ui` in Prettier (C-16), so future `--diff` runs show real drift

## Deslop and ponytail review (2026-10-03)

Static review of every tracked file (463) with the `deslop` and `ponytail-review` skills on branch `fm/lipi-deslop-ponytail-review` (base `9472258`). Nothing was run, built or installed; no code, dependency or env value was changed. Existing sections above are unchanged. This section lists what to cut and why; each item is meant for a separate fixer.

How to read an item: **ID**, priority (P2 do first, P3 polish, P4 optional), skill tag (`ponytail:delete|shrink|yagni`, `deslop`), and **CONFIRMED** (use sites checked with `git grep` or source) or **HYPOTHESIS** (needs a check or an owner decision first). Line numbers are for base `9472258`. Default acceptance for every item: `bun run type-check`, `bun run lint` and `bun run test` pass and no importer of a removed name remains.

Caveat: D-3 (adopt the shadcn Sidebar) would rewrite `components/sidebar/*` and subsume the sidebar parts of R-17, R-18, R-26 and R-36; do those only if D-3 is deferred. Protected `components/ui/*` was read but no edit is proposed (R-13 is a removal of an unused file and needs an owner OK).

### Net line-reduction estimate

- Confirmed removals (dead code, redundant tests, deletable files): net **-1,111** lines across 13 items, plus 20 unreferenced binary files (about 330 KB, 0 lines).
- Confirmed consolidation (dedupe, helpers, table-driven data, comment and default removal): net **-1,772** lines.
- Total confirmed: net **-2,883** lines possible, of roughly 46,500 tracked lines (about 6.2 %). Uncertainty: plus or minus 30 % (about -2,018 to -3,747); the dedupe items (R-15 to R-27) are the least certain because shared helpers add lines back, and the e2e items could not be run here.
- Hypotheses (H-1 to H-9 and the four HYPOTHESIS items R-13, R-14, R-40, R-43) are not counted; accepted in full they would add about -537 more lines (H-3 alone is about -200 and needs a migration).

### Findings

- [ ] **R-1** Unused sidebar navigation menu and the shadcn call-site helper that only its tests use. Priority: P2. Tag: `ponytail:delete`. Status: CONFIRMED. Net: about -190 lines.
  - Where: `components/sidebar/vertical-navigation-menu.tsx:1-29`, `components/sidebar/vertical-navigation-menu.test.tsx:1-88`, `components/sidebar/folder-accordion-trigger.test.tsx:1-66`, `lib/shadcn-call-site.ts:1-5`
  - Evidence: `git grep` finds `VerticalNavigationMenu`, `hideNavigationMenuTriggerIndicator` and `hideAccordionTriggerIndicator` only in these files and their tests. The folder test targets a `folders.tsx` call site that no longer exists and only exercises the protected shadcn accordion.
  - Cut and replace: Delete the four files. No replacement.
  - Behaviour preserved: Nothing user-visible: no production importer.
  - Check before cutting: `git grep -n "vertical-navigation-menu\|shadcn-call-site\|folder-accordion"` outside the four files; D-3 (shadcn Sidebar) does not need them.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-2** Three copied `usehooks-ts` style hooks with no importer. Priority: P2. Tag: `ponytail:delete`. Status: CONFIRMED. Net: about -112 lines.
  - Where: `hooks/use-event-listener.ts:1-87`, `hooks/use-is-mounted.ts:1-18`, `hooks/use-isomorphic-layout-effect.ts:1-7`
  - Evidence: `git grep` finds no importer of any of the three; `use-isomorphic-layout-effect` is imported only by `use-event-listener`.
  - Cut and replace: Delete the three files.
  - Behaviour preserved: Nothing: unused.
  - Check before cutting: Re-run `git grep -n "use-event-listener\|use-is-mounted\|use-isomorphic-layout-effect"`.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-3** Legacy folder/file to document migration helper with no caller. Priority: P2. Tag: `ponytail:delete`. Status: CONFIRMED. Net: about -194 lines.
  - Where: `lib/db/legacy-document-migration.ts:1-96`, `lib/db/legacy-document-migration.test.ts:1-98`
  - Evidence: No importer outside its own test. The folders/files to documents conversion shipped as SQL in migration `0006_documents_unified_tree.sql`; the function is also a pure pass-through (`legacyDocumentMigrationRows`).
  - Cut and replace: Delete both files.
  - Behaviour preserved: Migration 0006 is untouched; database state unchanged.
  - Check before cutting: Confirm `uuid` is still imported elsewhere before touching `package.json` (it is, by the document tree). Do not edit migrations.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-4** Dead helpers in `lib/utils.ts` (platform sniffing, `currentlyInDev`, Netlify branch). Priority: P2. Tag: `ponytail:delete`. Status: CONFIRMED. Net: about -75 lines.
  - Where: `lib/utils.ts:96-154` (`testPlatform`, `isMac`, `isIPhone`, `isIPad`, `isIOS`, `isAppleDevice`), `:156-160` (`currentlyInDev` and the `toast` import at `:1`), `:26-38` (Netlify branch of `absoluteUrl`)
  - Evidence: No callers (`git grep`). The project deploys with `vercel.json`; `NETLIFY` is read nowhere else.
  - Cut and replace: Delete the helpers, the `toast` import, and the Netlify branch; keep the Vercel and default branches of `absoluteUrl`.
  - Behaviour preserved: `absoluteUrl` output on Vercel and locally.
  - Check before cutting: Check `lib/utils.test.ts` (if present) for removed names before deleting. `getStars` doc-comments and `stargazers_count: string` typing at `:72` are tracked in R-45.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer. `absoluteUrl` tests still pass.
- [ ] **R-5** Unused exported server action `getDocumentBreadcrumbs`, `DBResponse` type and `isWorkspaceMember`. Priority: P2. Tag: `ponytail:delete`. Status: CONFIRMED. Net: about -55 lines.
  - Where: `lib/db/queries/document.ts:364-387`, `lib/db/queries/index.ts:1-2` and `:32` (re-export), `lib/db/queries/mutation-auth.ts:27-36`, `lib/db/queries/mutation-auth.test.ts:1-25`
  - Evidence: Breadcrumbs are built client-side in `components/site-header/document-breadcrumbs.tsx`; nothing calls the action. `DBResponse` and `isWorkspaceMember` have no use sites other than the test. Removing the action also removes a publicly callable endpoint.
  - Cut and replace: Delete the action, the re-export, the type, the helper and its test.
  - Behaviour preserved: All live behaviour.
  - Check before cutting: Check `document.test.ts` / `document.forbidden.test.ts` for cases naming `getDocumentBreadcrumbs` first.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-11** Unused sidebar trigger variant in the search command. Priority: P2. Tag: `ponytail:delete`. Status: CONFIRMED. Net: about -45 lines.
  - Where: `components/search-command.tsx:33-37` (props `triggerVariant`, `isCollapsed`, `className`), `:134-173` (sidebar trigger branches)
  - Evidence: The only caller, `components/site-header/navbar.tsx`, renders `<SearchCommand />` with no props (`git grep "<SearchCommand"`).
  - Cut and replace: Remove the props and the sidebar branches; keep the navbar trigger.
  - Behaviour preserved: Navbar trigger and dialog.
  - Check before cutting: `search-command.test.tsx` cases for the variant (if any) go with it.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-15** Three identical UploadThing endpoints. Priority: P2. Tag: `ponytail:shrink`. Status: CONFIRMED. Net: about -60 lines.
  - Where: `app/api/uploadthing/core.ts:12-129`
  - Evidence: `documentImage`, `coverBanner`, `workspaceLogo` copy the same `.input`, `.middleware` and `.onUploadComplete` bodies (about 35 lines each); only size, count and permission differ. `onUploadComplete` is `async` with no `await`.
  - Cut and replace: One `workspaceUpload({ maxFileSize, maxFileCount, permission })` builder returning the route.
  - Behaviour preserved: Auth, permission checks and returned `ufsUrl ?? url` payload.
  - Check before cutting: Keep the per-route permission strings exactly (`document:write` vs `workspace:settings`); `core.test.ts` pins them. The 4 MB precheck constant is duplicated in the client uploaders (R-18).
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-16** Near-identical error boundaries and status panels. Priority: P2. Tag: `ponytail:shrink`. Status: CONFIRMED. Net: about -90 lines.
  - Where: `app/error.tsx:10-64`, `app/(lobby)/error.tsx:10-57`, `app/dashboard/error.tsx:10-63`, `app/not-found.tsx`, `app/dashboard/(workspaces)/[workspaceId]/not-found.tsx`, `components/workspace-access-revoked.tsx:7-28`
  - Evidence: Three boundaries repeat the same icon box, heading, text and two buttons (about 55 lines each); the not-found and access-revoked panels share the layout. `global-error.tsx` is intentionally standalone and stays. F-ERR-6 (lobby boundary omits `error.digest`) falls out of the dedupe.
  - Cut and replace: One `StatusPanel`/`ErrorState({ title, message, homeHref, homeLabel })` client component; each boundary becomes an 8-line wrapper.
  - Behaviour preserved: Copy and buttons per route; `lib/launch-polish.test.tsx` asserts the titles.
  - Check before cutting: Keep `reset` and `useEffect` logging per boundary.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-17** Duplicated create-page flow and inline form in the document tree. Priority: P2. Tag: `ponytail:shrink`. Status: CONFIRMED. Net: about -70 lines.
  - Where: `components/sidebar/document-tree.tsx:127-166` vs `:548-586` (child vs root create: same `DocumentSummary` build, same `toast.promise(createDocument)` and rollback), `:400-437` vs `:639-687` (EmojiPicker + Input + Escape form), `:477-496` (three Set-copy callbacks `toggleExpanded`/`expandNode`/`collapseNode`)
  - Evidence: Two copies of both the create handler and the new-page form; three callbacks that each copy the expanded `Set`.
  - Cut and replace: `createPage(parentId)` + `<NewPageForm>` + `setExpanded(id, open)`.
  - Behaviour preserved: Optimistic insert, rollback, toasts, focus behaviour.
  - Check before cutting: If D-3 (shadcn Sidebar) proceeds this file is rewritten; do R-17 only if D-3 is deferred. Tests: `document-tree.test.tsx`, `document-tree-keyboard.test.tsx`.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-18** One mutation toast helper and one image-upload helper. Priority: P2. Tag: `ponytail:shrink`. Status: CONFIRMED. Net: about -125 lines.
  - Where: `components/settings.tsx:176-297` (6 handlers), `components/sidebar/document-tree.tsx:116-124,153-165,184-201,221-239,573-585` (5), `components/trash.tsx` (2), `app/dashboard/new-workspace/workspace-form.tsx` (1); uploads: `components/document-editor/document-header.tsx:98-127`, `components/settings.tsx:92-121`, `components/document-editor/document-block-editor.tsx:191-217`
  - Evidence: Every site writes `toast.promise(unwrapMutation(x), { loading, success, error: isMutationDenied(e) ? "You do not have permission to ..." : mutationErrorMessage(e, fallback) })`, and the settings handlers add the same `if (!workspaceId) return` and `router.refresh(); notifyPageChanges(); refresh();` tail. The three upload flows each do a size precheck, `uploadFiles(endpoint, { files, input })`, `serverData?.url ?? url`, and an error toast; the editor one toasts then rethrows twice (`:193-196`, `:209-213`).
  - Cut and replace: `runMutationToast({ loading, success, denied, failed })` next to `unwrapMutation` in `lib/db/mutation-result.ts`, an `afterMutation()` in settings, and `uploadImage(endpoint, file, workspaceId, maxMb)` in `lib/uploadthing.ts`.
  - Behaviour preserved: Messages, rollback and refresh order (tests pin the strings).
  - Check before cutting: `settings.test.tsx`, `document-tree.test.tsx`, `trash.test.tsx`, `workspace-form.test.tsx` assert the toast messages.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-19** Hand-rolled try/catch in server actions although `runMutation` exists. Priority: P2. Tag: `ponytail:shrink`. Status: CONFIRMED. Net: about -60 lines.
  - Where: `lib/db/queries/document.ts:86-132,162-210,212-362` (7 actions), `lib/db/queries/workspace.ts:24-46`; replacement at `lib/db/queries/mutation-failure.ts:34-45`
  - Evidence: Each action repeats `let workspaceIdForRevalidate; try { ... } catch { forbiddenResult / rethrowKnownErrors / console.error / throw new Error(msg) } finally { revalidate }`. `runMutation(action)` already returns a `MutationResult`. Also `document.ts:167-169` has a dead `if (!parsed.id) throw` after a `z.uuid()` schema, and `:125,153,203` cast `(e as Error).message`.
  - Cut and replace: A `runDocumentMutation(label, fn)` wrapper built on `runMutation`; drop the dead guard and casts.
  - Behaviour preserved: Returned `MutationResult` codes and messages; revalidation after the call.
  - Check before cutting: `document.test.ts` and `document.forbidden.test.ts` pin outcomes; F-ERR-5 (structured logging) stays separate.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-20** `createWorkspace` takes `workspaceOwnerId` from the client. Priority: P2. Tag: `ponytail:shrink`. Status: CONFIRMED. Net: about -20 lines.
  - Where: `lib/db/queries/workspace.ts:24-34`, `app/dashboard/new-workspace/page.tsx:68`, `app/dashboard/new-workspace/workspace-form.tsx:35,55`, `lib/db/queries/workspace.test.ts:60-65`
  - Evidence: The action accepts a full `Workspace`, then rejects with FORBIDDEN when the owner id differs from the session user. The page passes `user!` and the form `user.id!`. The server can set `workspaceOwnerId = user.id` and accept only `{ title, iconId }`.
  - Cut and replace: Change the signature, drop the equality check and its test, stop threading `user` through `WorkspaceForm`, remove the two non-null assertions.
  - Behaviour preserved: The owner is always the session user (security preserved).
  - Check before cutting: Only caller is `workspace-form.tsx` (`git grep createWorkspace`).
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-21** Five copies of the workspace authorize helper. Priority: P2. Tag: `ponytail:shrink`. Status: CONFIRMED. Net: about -45 lines.
  - Where: `lib/db/queries/mutation-auth.ts:130-202`
  - Evidence: `authorizeWorkspaceMutation`, `authorizeOwnerAction`, `authorizeMemberManagement`, `authorizeTransfer` and `authorizeDelete` each run `requireAuthenticatedUser` + a null-id check + `requireWorkspacePermission(permission)`. `assertDocumentAccess` and `authorizeDocumentMutation` each re-query the document. `lib/db/queries/workspace-members.ts:57-63,119-125,271-277` and `mutation-auth.ts:45-51` also repeat `findFirst` + `throw "Workspace not found"` four times.
  - Cut and replace: `authorizeWorkspace(workspaceId, permission)` and `getWorkspaceOrThrow(id)`.
  - Behaviour preserved: Permission strings per action; error messages.
  - Check before cutting: `mutation-auth` and `*.forbidden.test.ts` suites.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-22** Redundant `DocumentSummary` to `DocumentRecord` mapping with null guards on NOT NULL columns. Priority: P2. Tag: `ponytail:shrink`. Status: CONFIRMED. Net: about -35 lines.
  - Where: `lib/db/queries/document.ts:51-63` (`toRecords`), `components/sidebar/document-tree-utils.ts:10-24,26-38` (`toDocumentRecord`)
  - Evidence: Both map field by field with `row.id!`, `?? null`, `?? ""` and `?? new Date(0)` although the columns are NOT NULL and `DocumentSummary` is structurally assignable to `DocumentRecord`. `if (!document.id) return null` is dead for the same reason.
  - Cut and replace: Pass the rows through; keep the dedupe-by-id and `inTrash` filter in `toDocumentRecords`.
  - Behaviour preserved: Filtering and ordering.
  - Check before cutting: `tsc` proves assignability; `document-tree-utils.test.ts` pins the rest.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-6** Unused global type utilities and a `three` module declaration. Priority: P3. Tag: `ponytail:delete`. Status: CONFIRMED. Net: about -40 lines.
  - Where: `types/globals.d.ts:2-36` (`StringObject`, `NumberObject`, `UnknownObject`, `BooleanObject`, `WithId`, `Truthy`, `Falsy`, `Maybe`, `EmptyCallback`, `HttpMethod`, `UnionToIntersection`, `UnionToTuple`), `:38-43` (`declare module "three"`)
  - Evidence: No use sites; `three` is not a dependency. Keep `FCC` (used by `components/providers.tsx` and the workspace layout).
  - Cut and replace: Delete the unused declarations, keep `FCC`.
  - Behaviour preserved: Types only.
  - Check before cutting: Re-grep each name.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-7** Dead constants, exports and type aliases. Priority: P3. Tag: `ponytail:delete`. Status: CONFIRMED. Net: about -70 lines.
  - Where: `lib/constants.ts:81-90` (`MAX_FOLDERS_FREE_PLAN`, `ACCEPTED_IMAGE_TYPES`), `lib/uploadthing.ts:3-4,9-10,12` (`UploadButton`, `UploadDropzone`, `useUploadThing`), `lib/auth.ts:71-74` (`checkAuth` and its `redirect` import), `lib/auth.ts:30` (`User` alias, verify), `lib/auth/auth-client.ts:5-11,17-18` (`useSession`, `getSession`, optional `baseURL` spread), `lib/auth/create-auth.ts:186` (`Auth` type), `config/site.ts:16,21` (`links.discord`, `SiteConfig`), `lib/db/index.ts:1,7,19-24` (duplicate `createTable`; `lib/db/table-creator.ts` is the one `schema/app.ts` imports), `lib/db/schema/auth.ts:120-132` (`NewUser`, `BetterAuthAccount`, `NewBetterAuth*`, `BetterAuthSession`, `BetterAuthVerification`), `types/db.ts:13-24` (`User`, `NewDocument`, `Account`, `Customer`, `Product`, `Collaborator`, `Price`), `lib/block-editor/alert-block.tsx:45` (`AlertType`; also drop `export` on `alertTypes`), `components/sidebar/document-tree-utils.ts:63` (`export type { DocumentTreeNode }`, verify)
  - Evidence: Each name has zero imports (`git grep`); in `types/db.ts` only `Document`, `DocumentSummary`, `Subscription` and `Workspace` are imported anywhere. `FREE_WORKSPACE_ROOT_PAGE_LIMIT` already exists for the 3-page limit that `MAX_FOLDERS_FREE_PLAN` duplicates (see R-37).
  - Cut and replace: Delete each declaration and any import left unused.
  - Behaviour preserved: Runtime unchanged (type-only or unreferenced exports).
  - Check before cutting: Verify one name at a time with `git grep -n "\bName\b"`; `PRICING_PLANS.freeplan` is used only by `lib/launch-polish.test.tsx`, keep.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-8** Credential-account helpers that only their tests and each other call. Priority: P3. Tag: `ponytail:delete`. Status: CONFIRMED. Net: about -60 lines.
  - Where: `lib/auth/credential-account.ts:15-48` (`resolveStoredPasswordHash`, `findCredentialAccount`, `upsertCredentialPassword`) and their cases in `lib/auth/credential-account.test.ts`
  - Evidence: `create-auth.ts` imports only `CREDENTIAL_PROVIDER_ID` and `credentialAccountWhere`; `lib/db/seed.ts` re-builds the same `and(eq, eq)` filter by hand instead of calling `credentialAccountWhere` (see R-38). `docs/requirements/requirements.md` still cites the file as credential validation (R-52).
  - Cut and replace: Delete the three helpers and their test cases; keep the two used exports.
  - Behaviour preserved: Sign-in and backfill hooks use the kept exports.
  - Check before cutting: Check `lib/db/seed.ts` and `scripts` for importers first (none found).
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-9** Duplicate and dead billing entitlement code. Priority: P3. Tag: `ponytail:delete`. Status: CONFIRMED. Net: about -45 lines.
  - Where: `lib/billing/plan-quotas.ts:40-49` (`evaluateWorkspaceQuota`, no non-test caller), `lib/billing/plan-quotas.test.ts:48-70`, `lib/billing/enforce-quotas.ts:67-73` (`isProSubscriber` equals `hasConfiguredProEntitlement` in `entitlement.ts:16-22`) and `:78-79,98-99,120-121`, `lib/billing/current-subscription.ts:3-6` vs `lib/billing/entitlement.ts:5` (same `active`/`trialing` set twice), `lib/billing/quota-entitlement.ts:8-13`
  - Evidence: `isProSubscriber` re-implements `tryGetStripeProPriceId()` + `hasProEntitlement`; the status set exists twice; `evaluateWorkspaceQuota` is exercised only by its own test.
  - Cut and replace: Delete `evaluateWorkspaceQuota` + test case, call `hasConfiguredProEntitlement` from `enforce-quotas.ts`, export one status set from `entitlement.ts`, and let `userHasProPlanEntitlement` serve the three inlined lookups.
  - Behaviour preserved: Same Free/Pro decisions; `enforce-quotas.test.ts` pins them (unset price, canceled, trialing).
  - Check before cutting: Behaviour for unset `STRIPE_PRICE_ID_PRO` must stay Free.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-10** Unreferenced binary assets: 19 placeholder avatars and the unused Cal Sans TTF. Priority: P3. Tag: `ponytail:delete`. Status: CONFIRMED. Net: about 0 lines.
  - Where: `public/placeholders/avatar-1.png` to `avatar-19.png` (19 files, about 180 KB), `public/fonts/CalSans-SemiBold.ttf` (149 KB)
  - Evidence: `git grep` finds no reference to any `avatar-N` path; only `client-1..5` are referenced (via `lib/constants.ts`). `lib/fonts.ts:23` loads `CalSans-SemiBold.woff`; the `.ttf` sibling has no reference. `lib/launch-polish.test.tsx:74` asserts no `[src*="avatar"]` on the page, so nothing relies on them.
  - Cut and replace: Delete the 20 files. No line change in code.
  - Behaviour preserved: Nothing: unreferenced.
  - Check before cutting: Re-run `git grep -n "avatar-[0-9]"`; also see H-4 for the `client-*` images.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-12** Pass-through wrappers and single-use indirection. Priority: P3. Tag: `ponytail:delete`. Status: CONFIRMED. Net: about -60 lines.
  - Where: `lib/workspace/permissions.ts:29-33,46` (`workspaceRoleFromCollaborator` returns its argument), `lib/workspace/access.ts:1-11` (barrel with no importer), `lib/db/client-document-state.ts:22-27` (`permanentDeleteTargetIds` = `assertPermanentDeleteAllowed`), `lib/realtime/client.ts:32-35` (`fetchRealtimeToken` wraps `fetchRealtimeAccess`; caller `components/realtime/workspace-realtime-provider.tsx:7,36`), `lib/block-editor/document-content.ts:61-76` (`parseStoredDocumentContent` has only test callers), `lib/realtime/server-factory.ts:31,63` (`verifyToken` seam never injected), `lib/realtime/authorize-room.ts:14` (re-export used by `app/api/realtime/token/route.ts:5-8` and `authorize-room.test.ts:3-6`; repoint them to `./context`), `lib/auth.ts:14-28` (`getAuth()` plus a Proxy `auth` expose one lazy instance; keep one)
  - Evidence: Each indirection has one or zero real callers (greps listed per item).
  - Cut and replace: Inline or delete each; for `lib/auth.ts` pick `getAuth()` and update `app/api/auth/[...all]/route.ts`.
  - Behaviour preserved: Same values returned.
  - Check before cutting: `lib/workspace/access.ts` needs `git grep "workspace/access"` = empty. The Proxy removal touches the Better Auth route handler: keep its tests green.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-13** Unused shadcn `hover-card` component (removal only, no edit). Priority: P3. Tag: `ponytail:delete`. Status: HYPOTHESIS. Net: about -50 lines.
  - Where: `components/ui/hover-card.tsx:1-50`
  - Evidence: `git grep` finds no importer. Same situation as `resizable.tsx`, removed in C-16.
  - Cut and replace: Delete the file (a removal, not a modification of protected source). Needs the owner's OK because `components/ui` is protected.
  - Behaviour preserved: Nothing.
  - Check before cutting: Check `components.json` aliases and the shadcn diff note below; do not touch any other `components/ui` file.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-14** `kirimase.config.json` scaffold leftover. Priority: P3. Tag: `ponytail:delete`. Status: HYPOTHESIS. Net: about -13 lines.
  - Where: `kirimase.config.json:1-13`
  - Evidence: No code reads it (`git grep`); it names `supabase` as provider while the app uses plain Postgres. F-DEP-4 suspects `pg` is only there because of it.
  - Cut and replace: Delete the file; then decide F-DEP-4.
  - Behaviour preserved: Nothing at runtime.
  - Check before cutting: Run `bunx drizzle-kit` once locally to confirm it does not read this file.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-23** Password toggle copied three times; OAuth buttons and page headings repeated. Priority: P3. Tag: `ponytail:shrink`. Status: CONFIRMED. Net: about -90 lines.
  - Where: `app/(auth)/components/login-form.tsx:139-168`, `signup-form.tsx:139-168,191-224`, `app/(auth)/components/oauth-buttons.tsx:57-87`, h1 class string in `login:21`, `signup:21`, `forgot-password:11`, `reset-password:44`; `components/tooltip-delayed.tsx` (+ test) only serves these toggles
  - Evidence: Show/hide password button with tooltip and icon (about 30 lines) is pasted into three places; the two provider buttons are identical; the long h1 `className` repeats on four pages. `signup-form.tsx:109,117` also wraps `Input` in a `relative` div with no absolute child, and `app/(auth)/layout.tsx:14` puts text styles on a div that only wraps a `Logo`.
  - Cut and replace: `PasswordInput`, a provider map for OAuth, a shared `AuthHeading`; wrap the tooltip once.
  - Behaviour preserved: Accessible names (C-31) and `login-form.test.tsx`, `signup-form.test.tsx` expectations.
  - Check before cutting: Keep the keyboard-reachable toggle semantics.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-24** Privacy and terms pages are near-identical. Priority: P3. Tag: `ponytail:shrink`. Status: CONFIRMED. Net: about -40 lines.
  - Where: `app/(lobby)/(legal)/privacy/page.tsx:1-46`, `app/(lobby)/(legal)/terms/page.tsx:1-46`
  - Evidence: Same layout, differing only by title and the `LEGAL` key; list items use the index as key.
  - Cut and replace: One `LegalPage({ title, sections })`.
  - Behaviour preserved: Rendered copy and metadata.
  - Check before cutting: `app/(lobby)/(legal)/*.test.tsx` if present.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-25** Static data written out as repeated JSX/objects. Priority: P3. Tag: `ponytail:shrink`. Status: CONFIRMED. Net: about -120 lines.
  - Where: `app/sitemap.ts:5-44` (six copied entries), `components/icons.tsx:3-180` (ten `<svg>` shells; `size || height` / `size || width` make `height`/`width` props dead because `size` defaults to 24), `app/(lobby)/components/features.tsx:115-138,196-241` (5 sidebar rows and 4 checklist rows repeated), `app/(lobby)/components/testimonials.tsx` (duplicated rows)
  - Evidence: Hand-repeated structures that differ only in data.
  - Cut and replace: A `[path, changeFrequency, priority]` table for the sitemap, an `Icon` wrapper taking `viewBox` + children, data arrays plus `map` in the features mock.
  - Behaviour preserved: Same URLs, icons and DOM text (`launch-polish.test.tsx` checks `Q3 Product Roadmap`, `Acme Workspace`).
  - Check before cutting: `robots`/`sitemap` assertions in `lib/launch-polish.test.tsx:93-115`.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-26** Duplicated branches inside single components. Priority: P3. Tag: `ponytail:shrink`. Status: CONFIRMED. Net: about -140 lines.
  - Where: `components/sidebar/sidebar-panel.tsx:107-124` (two identical `<NavDialog>` differing only in `isCollapsed`), `:148-221` (account block written twice), `components/subscription-modal-provider.tsx:65-109` (two near-identical `DialogContent` branches), `components/settings.tsx:141-174` (`refresh()` and the load effect duplicate the loader), `:454-527` (owner row vs member row), `app/api/realtime/token/route.ts:31-63` (origin and referer branches duplicate parse + protocol + host match), `app/api/stripe/checkout/route.ts` + `portal/route.ts` (same 503/500 mapping), `lib/db/queries/search.ts:40-65` vs `:67-101` (empty-query and query branches), `lib/db/documents-tree.ts:20-30` vs `:69-78` (same group-by-parent map)
  - Evidence: Each pair differs only in a prop, a string or one condition.
  - Cut and replace: Pass the prop, extract `AccountSummary`/`MemberRow`, config object for the modal, one loader in settings, `sameOriginUrl(str)` helper (keep loopback normalization), shared billing route handler, one search query with an optional `or(ilike)`, `groupByParent`.
  - Behaviour preserved: Rendered output, HTTP status mapping, query results.
  - Check before cutting: The realtime-token origin check is security-relevant: keep every existing test case. D-3 may subsume the sidebar items.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-27** Repeated server-side helpers and boilerplate. Priority: P3. Tag: `ponytail:shrink`. Status: CONFIRMED. Net: about -230 lines.
  - Where: `lib/db/queries/workspace-members.ts:47-51`, `workspace-settings.ts:34-38`, `workspace.ts:43-45` (`revalidateWorkspaceLists` copied, tag strings repeated at `workspace-lists.ts:70-71,94-95,118-119`), `lib/db/queries/workspace-lists.ts:81-88` (join on `users` only to filter `users.id`) and `:46-120` (three identical try/catch rethrow wrappers), `lib/db/schema/app.ts` (`timestamp(name, { withTimezone: true, mode: "string" })` about 20 times at `:38-43,59-70,95,105,146-180,186-199,210,234-243`), `lib/db/queries/billing.ts:40-81,96-122` (`onConflictDoUpdate` set lists restate every column), `lib/auth/create-auth.ts:121-165` (`user.create/update.after` and `account.create/update` hooks repeat the same patch), `lib/auth/auth-rate-limit.ts:1-8`, `lib/stripe/catalog-sync.ts:28-33,54-69` (interval if-chain; three-branch row builder), `lib/realtime/persistence.ts:76-88` + `lib/realtime/authoritative-content.ts:11-21` (store re-inlines `serializedContentFromYjsState`), `lib/realtime/server-factory.ts:98-104,110-116` (same context literal twice with redundant `readOnly`) and `:123-131,173-178` (same catch-and-log twice, trailing bare `return`), `proxy.ts:85-88`, `lib/billing/enforce-quotas.ts` (`Number(row?.value ?? 0)` x4)
  - Evidence: Each item is a local copy of an expression the file or its neighbour already has.
  - Cut and replace: Small local helpers: `revalidateWorkspaceLists()` and tag constants, `from(collaborators).innerJoin(workspaces)`, `const tz = (n) => timestamp(n, { withTimezone: true, mode: "string" })`, `set: row`, one patch builder in the auth hooks, one-line rate-limit expression, `recurring?.interval ?? null`, call `serializedContentFromYjsState`, `buildContext(payload, access)`, `const from = nextUrl.pathname + nextUrl.search`.
  - Behaviour preserved: Behaviour; for the schema helper the generated DDL must not change.
  - Check before cutting: Run `bunx drizzle-kit check` (locally) to prove no migration diff after the timestamp helper; verify `set: row` does not update the primary key; verify Better Auth 1.6 defaults before dropping the explicit values in R-40.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-28** Happy-dom test boilerplate repeated across about 30 files. Priority: P3. Tag: `ponytail:shrink`. Status: CONFIRMED. Net: about -150 lines.
  - Where: `lib/block-editor/use-debounced-callback.test.tsx:17-52`, `lib/launch-polish.test.tsx:33-42,117-232`, `app/(auth)/components/login-form.test.tsx:22-39`, `app/(auth)/components/password-recovery-forms.test.tsx:26-61`, `app/dashboard/change-password/change-password-form.test.tsx:27-51`, `app/dashboard/new-workspace/workspace-form.test.tsx:29-46,65-69`, `app/dashboard/(workspaces)/components/workspace-shell.test.tsx:35-43`, `app/(lobby)/components/lobby-mobile-menu.test.tsx`, and others (`git grep -l IS_REACT_ACT_ENVIRONMENT`)
  - Evidence: Every file re-declares the `IS_REACT_ACT_ENVIRONMENT` stub, the `roots` array, container creation, `createRoot` + `act` render and unmount cleanup. `launch-polish.test.tsx` repeats the five-line mount six times.
  - Cut and replace: One `tests/helpers/render.tsx` (`render`, auto-cleanup) or a vitest setup file; `it.each` for the three error-boundary cases in `launch-polish.test.tsx`.
  - Behaviour preserved: Test assertions.
  - Check before cutting: Count files with `git grep -l IS_REACT_ACT_ENVIRONMENT` before and after.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-29** Document and record test factories repeated. Priority: P3. Tag: `ponytail:shrink`. Status: CONFIRMED. Net: about -80 lines.
  - Where: `lib/db/documents-tree.test.ts:11-26`, `lib/db/document-operations.test.ts:14-29`, `lib/db/client-document-state.test.ts:12-42`, `components/sidebar/document-tree-utils.test.ts:8-25`, `components/sidebar/document-tree.test.tsx:53-65`, `components/trash.test.tsx:30-42`, `lib/smoke.test.ts`
  - Evidence: `const ts = "2026-01-01T00:00:00.000Z"` plus `doc()`/`record()` factories copied per file.
  - Cut and replace: One `tests/fixtures/documents.ts`.
  - Behaviour preserved: Test data.
  - Check before cutting: Keep per-test overrides.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-30** Redundant or self-referential tests. Priority: P3. Tag: `ponytail:delete`. Status: CONFIRMED. Net: about -165 lines.
  - Where: `lib/db/queries/document.get-documents.test.ts:1-50` (only case is covered by `document.test.ts:90-99`), `lib/workspace/permissions.test.ts:34-50` (matrix repeated by `authorization-matrix.test.ts:28-37`) and `authorization-matrix.test.ts:39-42`, `lib/stripe/webhook-verify.test.ts:1-23` (tests the Stripe SDK; imports no project code), `lib/db/table-prefix.test.ts:5-9` (asserts a constant equals itself), `lib/auth/legacy-backfill-sign-in.test.ts:1-61` (hypothesis: asserts a row it builds itself; `makeFakeDb` duplicated with `create-auth.test.ts:12-24`), `lib/proxy/proxy-rate-limit.test.ts:1-28` (fold into `proxy-routing.test.ts`), `lib/proxy/rate-limiting.test.ts:10-35` (four near-identical cases to `it.each`)
  - Evidence: Each case duplicates coverage elsewhere or asserts a library/constant.
  - Cut and replace: Delete or fold as listed; if signature verification needs a test, target `app/api/stripe/webhook/route.ts`.
  - Behaviour preserved: Coverage of project behaviour is unchanged.
  - Check before cutting: The single `lib/smoke.test.ts` and `server-factory.test.ts` integration test are kept as the minimum.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-31** E2E harness duplication. Priority: P3. Tag: `ponytail:shrink`. Status: CONFIRMED. Net: about -105 lines.
  - Where: `tests/e2e/apply-auth-database.ts:1-18` + `apply-lipi-database.ts:1-27` (same `drizzle-kit push --force --config X` with identical env), `tests/e2e/drizzle-auth.config.ts:7-15` + `drizzle-lipi.config.ts:6-15` (duplicated URL literal; the `?? literal` fallback is dead because `apply-*` always injects `DATABASE_URL`), `tests/e2e/helpers/workspace.ts:5-16,36-55` (shared tail of `createRootPage`/`createSubpage`), `:18-34` vs `:57-77` (repeated hidden-waits), `tests/e2e/collaboration.spec.ts:19-98` (owner/editor/viewer triple copy of context, issues array, page, tracker, teardown) and `:50-62` (join flow twice), `tests/e2e/fixtures.ts:45-48,62-65` (same expect message twice), `tests/e2e/stripe-checkout.spec.ts:15-35,49-53` (monkeypatches `window.fetch` and `location.assign`; `page.route` does it natively)
  - Evidence: Copy-pasted setup and wait sequences.
  - Cut and replace: One `applySchema(url, root, config)`, one shared DB URL, helper functions for the shared waits, a role loop and `joinViaInvite` in the collaboration spec, reuse `assertNoConsoleIssues` in the fixture.
  - Behaviour preserved: The four specs' assertions.
  - Check before cutting: These need a local Docker run to prove (F-TST-5); static review only here.
  - Accept when: `bun run type-check` and `bun run lint` pass; specs unchanged in assertions.
- [ ] **R-32** Narration comments and template leftovers. Priority: P3. Tag: `deslop`. Status: CONFIRMED. Net: about -40 lines.
  - Where: `lib/fonts.ts:4-6,18-20,32` (banner and trailing `// ...` placeholder), `lib/db/schema/app.ts:119` (template comment about `mode: bigint`), JSX section comments such as `{/* Workspace Header */}` in `app/dashboard/(workspaces)/[workspaceId]/page.tsx:82-83,121-125`, `features.tsx`, `loading.tsx`; JSDoc blocks restating the signature in `lib/utils.ts:8-12,44-47,81-86`, `lib/db/queries/workspace.ts:19-23`, `workspace-lists.ts:42-45,74-77,98-101`
  - Evidence: Comments that describe the next line rather than a non-obvious why (AGENTS.md rule).
  - Cut and replace: Delete the comments; leave genuine why-comments.
  - Behaviour preserved: Nothing.
  - Check before cutting: Do not touch comments in `components/ui`.
  - Accept when: No functional diff.
- [ ] **R-33** Redundant props, defaults and wrappers in components. Priority: P3. Tag: `deslop`. Status: CONFIRMED. Net: about -30 lines.
  - Where: `components/alert-dialog-close-action.tsx:11-12,19` (`cn(className)` identity; `variant`/`size` defaults restate `Button`), `components/billing/stripe-checkout-button.tsx:25` (`variant="default"`), `components/subscription-modal-provider.tsx` (same), `components/emoji-picker.tsx:25-27,54` (`if (getValue) getValue(emoji)` -> `getValue?.(emoji)`; `resolvedTheme as Theme` cast), `components/site-footer/theme-toggle-group.tsx:23-25` (pass-through `handleThemeChange`), `app/(lobby)/components/hero.tsx:69-71` (`priority` + `fetchPriority="high"` + `loading="eager"`; the `animate-in` class string repeated at `:16,20,24,46,76`), `app/(lobby)/components/testimonials.tsx:39` (`cn({ "animate-[...]": true })`), `app/(lobby)/pricing/pricing-plans.tsx:1` (`"use client"` without hooks; verify), `components/providers.tsx:10-19` (`theme` prop with no caller; verify), `app/dashboard/(workspaces)/[workspaceId]/layout.tsx:19-65` (named and default export of the same component, named only for the test), `app/dashboard/invite-notice.tsx:5` (`string | string[]` widened for a value `string[]` never matches)
  - Evidence: Each restates a framework or component default or exists only for one test.
  - Cut and replace: Remove each.
  - Behaviour preserved: Rendering.
  - Check before cutting: Confirm defaults against the Base UI/shadcn Button and Next Image docs before cutting; `pricing-plans.tsx` and `providers.tsx` need a caller grep first.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-34** Type-bypassing casts and non-null assertions. Priority: P3. Tag: `deslop`. Status: CONFIRMED. Net: about -5 lines.
  - Where: `components/sidebar/document-tree.tsx:172` (`allDocuments as DocumentSummary[]`), `components/site-header/document-breadcrumbs.test.tsx:19-24` (`as any` for mock state), `lib/db/queries/document.ts:125,153,203` (`(e as Error).message`), `app/(auth)/components/login-form.tsx:90-93`, `oauth-buttons.tsx:36-39`, `signup-form.tsx:90-94` (`const err = error as Error; console.error(err.message)`), `lib/utils.ts:72` (`stargazers_count: string` then `parseInt`), `app/dashboard/new-workspace/page.tsx:68` (`user!`; see R-20)
  - Evidence: Casts that hide real types (`unknown` catch values, API number typed as string).
  - Cut and replace: Use `error instanceof Error ? error.message : String(error)` or a shared `errorMessage(e)`, type the mock state, type `stargazers_count` as `number`.
  - Behaviour preserved: Same log text.
  - Check before cutting: Prefer one `errorMessage` helper over per-site guards.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-35** Abnormal defensive code, dead guards and inconsistent patterns. Priority: P3. Tag: `deslop`. Status: CONFIRMED. Net: about -40 lines.
  - Where: `components/sidebar/document-tree.tsx:317,338` (fragment around one `<Link>`), `:254` (`e.key === "F10" || e.code === "F10"`), `:462` (workspace id parsed from `pathname.split("/")[2]` while app state has it); `components/workspaces.tsx:97-114` (`.catch(() => null).then(...)` with a `cancelled` flag; async/await is simpler); `components/trash.tsx:82-116` (try/catch around synchronous `permanentDeleteTargetIds` and a catch toast that duplicates the `toast.promise` error path); `lib/db/document-operations.ts:117-119` (`byIdIn` linear find in loops vs `Map(byId)` elsewhere); `lib/realtime/server-factory.ts:120` (silent `if (!context) return`), `lib/security/csp.ts:38-51` (hypothesis: `new URL(url).origin.replace(/^http/, "ws")`); `hooks/use-app-state.ts:128,136` (messages name `StoreProvider`; the provider is `AppStateProvider`) and `:41,103` + `components/app-state-provider.tsx:13` (same `Pick<AppState, ...> & { workspace?, role? }` three times); `app/dashboard/(workspaces)/[workspaceId]/page.tsx:33-48` and `[fileId]/page.tsx:15-31` (hypothesis: `generateMetadata` repeats the user lookup and access try/catch the page body does)
  - Evidence: Defensive or duplicated constructs that the surrounding code does not use.
  - Cut and replace: Simplify each.
  - Behaviour preserved: Behaviour unchanged.
  - Check before cutting: Keep `csp.ts` tests; keep `generateMetadata` unless caching proves it redundant (Next `cacheComponents` dedupes only `fetch`/`cache()`).
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-36** Stale test mocks and assertions on implementation details. Priority: P3. Tag: `deslop`. Status: CONFIRMED. Net: about -30 lines.
  - Where: `components/sidebar/document-tree-keyboard.test.tsx:36-68` (mocks `@/hooks/use-subscription-modal`, which does not exist, plus `useAppActions`, `countChildren`, `hasWorkspaceProPlan` that `DocumentTree` no longer uses), `components/sidebar/sidebar.test.tsx:141-163` (hypothesis: asserts Tailwind class strings), `components/sidebar/document-tree.test.tsx:198-215` vs `:241-257` (same open-menu helper twice), `components/trash.test.tsx:207-217` (re-implements the `rejection()` helper)
  - Evidence: Mocks of modules the component does not import; tests that pin classes instead of behaviour.
  - Cut and replace: Remove stale mocks, share the helpers.
  - Behaviour preserved: Test intent.
  - Check before cutting: D-3 will rewrite the sidebar tests anyway.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-37** Hard-coded Free root-page limit duplicates a constant. Priority: P3. Tag: `deslop`. Status: CONFIRMED. Net: about -2 lines.
  - Where: `components/sidebar/document-tree.tsx:538` (literal `3`), `lib/db/document-operations.ts:12` (`FREE_WORKSPACE_ROOT_PAGE_LIMIT`), `lib/constants.ts` (`MAX_FOLDERS_FREE_PLAN = 3`, dead, see R-7)
  - Evidence: The tree shows its own quota check with a hard-coded 3 and a generic "Something went wrong" title for a quota block.
  - Cut and replace: Import `FREE_WORKSPACE_ROOT_PAGE_LIMIT` (it is plain data, safe for the client) and use the quota message.
  - Behaviour preserved: Limit value 3.
  - Check before cutting: Server enforcement (C-27) stays authoritative.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-38** Duplicate local-dev credential loading and filter. Priority: P3. Tag: `ponytail:shrink`. Status: CONFIRMED. Net: about -20 lines.
  - Where: `lib/db/seed.ts:16-31,72-77`, `lib/dev-credentials-logger.ts:6-19`
  - Evidence: `LocalDevCredentials` interface and the fixture JSON read are duplicated; the seed rebuilds `and(eq(userId), eq(providerId))` instead of calling `credentialAccountWhere`.
  - Cut and replace: One `loadLocalDevCredentials()` and reuse `credentialAccountWhere`.
  - Behaviour preserved: Seed result.
  - Check before cutting: Never print fixture values; only the structure moves.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-39** Defaults restated in root layout and validators. Priority: P3. Tag: `deslop`. Status: CONFIRMED. Net: about -15 lines.
  - Where: `app/layout.tsx:16-27,51-61` (viewport `width`/`initialScale`/`userScalable` and robots `index`/`follow`/`googleBot` restate Next defaults; keep `themeColor`, `viewportFit`), `lib/validations.ts:11` (`passwordSchema`: `.min(1)`, whitespace regex and `.min(8)` overlap)
  - Evidence: Values equal to framework defaults or implied by a stricter neighbour rule.
  - Cut and replace: Remove the redundant members.
  - Behaviour preserved: Rendered meta tags and validation outcomes.
  - Check before cutting: Verify each default against the Next 16 docs in `node_modules/next/dist/docs/` first (AGENTS.md); keep the validation messages.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-40** Better Auth options equal to library defaults. Priority: P3. Tag: `deslop`. Status: HYPOTHESIS. Net: about -8 lines.
  - Where: `lib/auth/create-auth.ts:106-119,167-180` (`cookieCache.enabled: false`, `crossSubDomainCookies.enabled: false`, `requireEmailVerification: false`, `usePlural: false`, `httpOnly: true`)
  - Evidence: Likely defaults in better-auth 1.6; the docs note (`research/realtime-collaboration.md`) cites the disabled cookie option deliberately, so keep anything that documents a decision.
  - Cut and replace: Drop only values proven equal to defaults. Keep `accountLinking` (security, tested).
  - Behaviour preserved: Auth behaviour.
  - Check before cutting: Check the 1.6 defaults in `node_modules/better-auth` before cutting.
  - Accept when: `bun run type-check`, `bun run lint` and `bun run test` pass; no remaining importer.
- [ ] **R-41** Documentation drift: references to files and flows that no longer exist. Priority: P3. Tag: `deslop`. Status: CONFIRMED. Net: about -10 lines.
  - Where: `docs/requirements/requirements.md` section 3.7 (cites `lib/stripe/webhook-verify.ts`, absent; cites `credential-account.ts` as credential validation; section 4 keeps realtime topology open though D-1 is decided), `docs/verification/verification-issues.md` and `.agents/skills/verify/features/auth-session.md:1-40` (cite `lib/actions.ts`, `lib/db/migrate.ts`, `docs/project.md`, all absent; the whole reset-password flow, sub-feature and step 7, was replaced by D-5 and the emailed flow in `b04d298`), `.agents/skills/verify/features/uploads.md:5,29` (LIP-V018 fixed; F-OPS-8 tracks it), `lobby-legal-public.md:15-17` (newsletter removed, D-2), `access-control-anonymous.md:6` (auth route list vs `config/routes.ts`)
  - Evidence: `git ls-files` confirms the cited paths are gone. The ledger still shows V003 as open HYPOTHESIS and V018 as open.
  - Cut and replace: Rewrite the cited sentences to the current flow; do not change decisions.
  - Behaviour preserved: Nothing in code.
  - Check before cutting: Extends F-OPS-8; do it as one docs pass.
  - Accept when: Every backticked path in these docs resolves with `git ls-files`.
- [ ] **R-42** Resolved ledger entries and repeated feature-map headers. Priority: P3. Tag: `ponytail:shrink`. Status: CONFIRMED. Net: about -100 lines.
  - Where: `docs/verification/verification-issues.md:38-233` (about 12 of 27 entries already fixed or resolved: V001, V002, V019 to V025 and others), `.agents/skills/verify/features/*.md` (each of 10 files repeats a 3-line `Ledger:` header plus a `How to get to it` section; `features/README.md` already carries the same IDs)
  - Evidence: Full repro and evidence prose is kept for entries whose state is fixed.
  - Cut and replace: Collapse fixed entries to one line each with the fixing commit; drop the repeated header lines.
  - Behaviour preserved: Open entries and live-proof records.
  - Check before cutting: Keep the evidence paths for GAP items.
  - Accept when: Each fixed entry is one line with a commit ref.
- [ ] **R-43** Dated planning note superseded by the realtime guide. Priority: P3. Tag: `ponytail:delete`. Status: HYPOTHESIS. Net: about -44 lines.
  - Where: `docs/research/realtime-collaboration.md:1-44`
  - Evidence: Phase-5 research note; every decision is marked implemented and `docs/guides/realtime.md` is the living description. It references a nonexistent `data/lipi-discovery-plan/report.md`.
  - Cut and replace: Fold the one open caveat (host-only session cookie) into the guide and delete the note.
  - Behaviour preserved: Guide content.
  - Check before cutting: Needs the owner's call on keeping research history in the repo.
  - Accept when: No inbound link breaks (`git grep realtime-collaboration.md`).
- [ ] **R-44** README template leftovers. Priority: P4. Tag: `deslop`. Status: CONFIRMED. Net: about -20 lines.
  - Where: `README.md:1-35,48-60,76-95`
  - Evidence: View-counter badge, star-history chart, contrib.rocks contributors block, "[WIP]" emoji subtitle, hosted logo URLs on a third-party host; the Vercel deploy URL lists `AUTH_SECRET` while the schema reads `BETTER_AUTH_SECRET` first (see H-1).
  - Cut and replace: Trim to what a reader needs; keep the Vercel section.
  - Behaviour preserved: Instructions.
  - Check before cutting: Do not alter the deploy variable list until H-1 is decided.
  - Accept when: README renders without external badge hosts.
- [ ] **R-45** Smaller deslop items in utilities. Priority: P4. Tag: `deslop`. Status: CONFIRMED. Net: about 0 lines.
  - Where: `lib/utils.ts:8-12,44-47,81-86` (JSDoc restating signatures, see R-32), `components/sidebar/document-tree-utils.ts:49` (`toAllDocumentRecords` used only by trash; verify), `lib/auth/create-auth.ts:106-180` `runInBackground` try/catch (`void` task), `lib/db/queries/document.ts:122` (`as DocumentSummary[]`-style casts)
  - Evidence: Minor consistency items.
  - Cut and replace: Fold into the nearby larger change.
  - Behaviour preserved: Nothing.
  - Check before cutting: None.
  - Accept when: Done with its parent finding.

### Hypotheses and decisions (H-n are not counted in the estimate; so are R-13, R-14, R-40, R-43)

- [ ] **H-1** Two auth env name families (`AUTH_*` and `BETTER_AUTH_*`). Priority: P3. Tag: `ponytail:delete`. Status: HYPOTHESIS. Net if accepted: about -25 lines.
  - Where: `.env.example` (Auth block), `lib/env.ts:26-29`, `lib/auth/create-auth.ts:52`, `lib/auth/resolve-auth-base-url.ts:8-9`, `lib/realtime/token.ts:20`, `tests/e2e/env.ts:17-20`, `README.md` deploy URL, `.agents/skills/verify/SKILL.md` env block, `.github/workflows/ci.yml`
  - Evidence: `AUTH_SECRET`/`AUTH_URL` are read only as fallbacks behind `BETTER_AUTH_*` (not dead, first note corrected). Keeping both doubles the documented variables everywhere.
  - Needs: Decide whether to drop the NextAuth-era names. Do not edit env values; a migration note for existing deployments is needed.
  - Accept when: the owner decides, then the usual gate passes and no importer remains.
- [ ] **H-2** Legacy Auth.js tables and mirrored columns in the schema. Priority: P3. Tag: `ponytail:delete`. Status: HYPOTHESIS. Net if accepted: about -40 lines.
  - Where: `lib/db/schema/auth.ts:12-66` (`accounts`, `verificationTokens`, `users.password`/`emailVerified` mirrors), `lib/db/schema/app.ts:100-107` (`billingAccounts`, referenced only by the unused `types/db.ts` `Account`), `lib/db/auth-migrations/0000_local_auth_baseline.sql`, `docs/local-development.md` (legacy `account`, `verificationToken`)
  - Evidence: No app code queries them (`git grep`); they are "preserved for rollback" and tied to the legacy backfill (F-OPS-1, F-AUTH-2).
  - Needs: Needs a migration and a production decision. Do not drop before F-OPS-1 completes.
  - Accept when: the owner decides, then the usual gate passes and no importer remains.
- [ ] **H-3** Write-only Stripe catalog tables. Priority: P3. Tag: `ponytail:yagni`. Status: HYPOTHESIS. Net if accepted: about -200 lines.
  - Where: `lib/stripe/catalog-sync.ts`, `lib/db/queries/billing.ts:40-94`, `lib/stripe/webhook-handlers.ts:67-94`, schema `products`/`prices`
  - Evidence: Nothing reads `lipi_products`/`lipi_prices`; they exist because `subscriptions.priceId` has an FK to `prices.id`, while entitlement compares `priceId` with `STRIPE_PRICE_ID_PRO`.
  - Needs: Dropping the FK, tables, the `price.*`/`product.*` webhook cases and the sync code is about -200 lines but needs a migration and a production-data decision.
  - Accept when: the owner decides, then the usual gate passes and no importer remains.
- [ ] **H-4** "Our Valued Clients" placeholder marquee. Priority: P3. Tag: `ponytail:delete`. Status: HYPOTHESIS. Net if accepted: about -60 lines.
  - Where: `lib/constants.ts:3-9`, `app/(lobby)/components/clients.tsx`, `public/placeholders/client-1..5.png`
  - Evidence: Alt text `client1..5` and stock logos; the capabilities section was rewritten to avoid invented content, this one was not.
  - Needs: Product call: remove the section or replace with real content.
  - Accept when: the owner decides, then the usual gate passes and no importer remains.
- [ ] **H-5** Quota wrapper that only remaps the error code. Priority: P3. Tag: `ponytail:yagni`. Status: HYPOTHESIS. Net if accepted: about -19 lines.
  - Where: `lib/db/queries/workspace-member-quota.ts:1-19`
  - Evidence: Converts `PlanQuotaError` to `MutationAuthError` with code `INVALID`, while `mutationFailure` already maps it to `QUOTA_EXCEEDED`. Settings tests pin `INVALID`.
  - Needs: Changing it alters the client-visible code; decide first.
  - Accept when: the owner decides, then the usual gate passes and no importer remains.
- [ ] **H-6** Client-side date component and hand-rolled realtime store. Priority: P3. Tag: `ponytail:yagni`. Status: HYPOTHESIS. Net if accepted: about -45 lines.
  - Where: `app/dashboard/(workspaces)/[workspaceId]/updated-date.tsx`, `workspace-pages.ts:33-52`, `workspace-pages.test.ts:62-78`; `components/document-editor/document-block-editor.tsx:43-60,83-89`
  - Evidence: `useSyncExternalStore` + a 20-line formatter + 3 tests for a date label; a custom external store holding one provider where `useState` set in the effect may do (check the `set-state-in-effect` lint rule and React Compiler first).
  - Needs: Verify hydration safety (C-18 introduced it deliberately) before cutting.
  - Accept when: the owner decides, then the usual gate passes and no importer remains.
- [ ] **H-7** Dev-only breakpoint badge and unused CSS tokens. Priority: P3. Tag: `ponytail:delete`. Status: HYPOTHESIS. Net if accepted: about -15 lines.
  - Where: `components/tailwind-indicator.tsx`, `app/layout.tsx:113`, `app/globals.css:9-38,109-113,115-122,149-156` (`--chart-*`, `--sidebar-*`)
  - Evidence: Template leftovers. `--chart-*` are used by `lib/block-editor/alert-block.css` so those stay; `--sidebar-*` may be needed by D-3.
  - Needs: Grep each token; keep what D-3 will use.
  - Accept when: the owner decides, then the usual gate passes and no importer remains.
- [ ] **H-8** Search command focus-restore code. Priority: P4. Tag: `ponytail:shrink`. Status: HYPOTHESIS. Net if accepted: about -18 lines.
  - Where: `components/search-command.tsx:57-75`
  - Evidence: Manual `lastFocusedElementRef`/`requestAnimationFrame` focus restore; Base UI dialogs restore focus to the trigger.
  - Needs: Prove with `search-command.test.tsx` and a real browser before cutting.
  - Accept when: the owner decides, then the usual gate passes and no importer remains.
- [ ] **H-9** `createAuthClient` options and other small seams. Priority: P4. Tag: `ponytail:yagni`. Status: HYPOTHESIS. Net if accepted: about 0 lines.
  - Where: `lib/realtime/server-factory.ts:15-32` (`quotaGuard` optional), `lib/realtime/authorize-room.ts:23-48` (three sequential queries, perf not LOC), `lib/block-editor/document-content.ts:11-18,38-59` (three-variant union for one caller), `y-prosemirror` pinned in `package.json:74` with no import
  - Evidence: Possible simplifications with trade-offs (peer pin, test seams).
  - Needs: Owner review; no net estimate.
  - Accept when: the owner decides, then the usual gate passes and no importer remains.

### Out-of-scope observations (correctness, security, content; not complexity)

- **O-1** `app/(auth)/components/signup-form.tsx:60-64`: `toast.error` is called during render (F-COR-7 fixed only the login form). Correctness: move to an effect keyed on the error param.
- **O-2** `app/layout.tsx:62-64`: `alternates.canonical = siteConfig.url` in the root metadata is inherited by every route, so every page declares the home page as canonical (SEO). Verify per route.
- **O-3** `lib/constants.ts:135-171`: The privacy policy copy says no data is collected, no cookies are used and data stays local, while the app stores accounts, sets auth cookies and uses Stripe and UploadThing. Content accuracy, needs the owner.
- **O-4** `lib/workspace/send-invite.ts:1-13`: The invite sender only logs in development; no email is sent (the project now has Resend for password recovery). Product gap, not complexity.
- **O-5** `tests/e2e/fixtures.ts:56-59`: `trackConsole` calls `void stubUploadthing(page)` unawaited; the route may register after the first request. Can cause flakes.
- **O-6** `docs/TODO.md` F-AUTH-1, D-5 consequence, section 4 reset-password line: States that signed-out recovery does not exist; `b04d298` added an emailed forgotten-password flow. Existing entries were preserved as-is; the owner should reconcile them.
- **O-7** `lib/auth/credential-account.ts` consumers: R-8 removes helpers; confirm the legacy backfill (F-OPS-1) does not need `upsertCredentialPassword` as an ops script before deletion.
- **O-8** `components/ui/form.tsx`: the only file with no `base-nova` upstream; it uses the 2023 `forwardRef` style and a `{}`-defaulted context, so its `!fieldContext` guard can never be true. Protected source, no edit proposed; noted for D-3 or a shadcn refresh.

### Coverage

Private ledger `coverage.tsv` (path, blob hash, category, deslop status, ponytail status, disposition, finding IDs) covers all 463 tracked files plus 6 ignored local paths. Every tracked path has a disposition for both passes: 217 with at least one finding, 206 reviewed with no finding, and the rest are generated history, lockfile, binary assets or the secret fixture (structure and variable names only, no values read into notes). Migrations are append-only history and are not proposed for change.
