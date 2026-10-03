# Lipi to-do

Canonical task index. Checked items cite implementation, test, or documentation files present on `feat/complete-lipi`; the tests were not re-run when this index was written.

## Open work summary (as of 2026-10-03)

Open checklist lines by kind and priority (P0 blocks use, P1 needed before production, P2 should fix or prove soon, P3 polish or low risk). Counts come from a read-only audit of `docs/`, the verify skill and feature maps, the verification ledger, and TODO comments in source; nothing was run. Umbrella lines marked "(umbrella)" are not counted because the granular lines below them carry the work.

| Kind             |  P0 |  P1 |  P2 |  P3 | Total |
| :--------------- | --: | --: | --: | --: | ----: |
| Confirmed bug    |   0 |   0 |   1 |   3 |     4 |
| UI regression    |   0 |   0 |   0 |   0 |     0 |
| Fix              |   0 |   1 |   2 |   4 |     7 |
| Verification gap |   0 |   0 |  14 |  10 |    24 |
| Improvement      |   0 |   0 |   0 |   6 |     6 |
| Decision needed  |   0 |   1 |   0 |   1 |     2 |
| **Total open**   |   0 |   2 |  17 |  24 |    43 |

Confirmed bugs live in the single ledger, [verification/verification-issues.md](./verification/verification-issues.md); lines here link to the entry instead of repeating it. Hypotheses and unverified gaps are kept apart in "Hypotheses and unverified gaps" below. No UI regression is confirmed open: every earlier one (LIP-V021, V022, V024, V025) is fixed in the ledger and its fix was re-read in the current code.

## Done

- [x] Better Auth email and password sign-in - `lib/auth/create-auth.ts`, `lib/auth/*.test.ts`, `tests/e2e/auth-workspace.spec.ts`
- [x] Workspaces with owner/editor/viewer roles and email invites - `lib/workspace/permissions.ts`, `lib/workspace/workspace-invites.test.ts`, migration `0009_workspace_roles_invites.sql`
- [x] Block-based document pages in a tree sidebar - `components/document-editor/`, `lib/db/documents-tree.ts`, `tests/e2e/documents-editor.spec.ts`
- [x] Real-time collaboration (Hocuspocus + Yjs, signed room tokens, presence) - `realtime/server.ts`, `app/api/realtime/token/route.ts`, `tests/e2e/collaboration.spec.ts`; see [realtime](./guides/realtime.md)
- [x] Free/Pro quotas and Stripe checkout/portal/webhook - `lib/billing/plan-quotas.ts`, `app/api/stripe/`, `tests/e2e/stripe-checkout.spec.ts`
- [x] Product requirements and portfolio showcase scope - [requirements](./requirements/requirements.md)
- [x] Trash controls and empty-state polish - `components/trash.tsx`, `components/trash.test.tsx`
- [x] Collapsible sidebar (2026-10-03): two states only (full 16rem, icon rail 3.5rem), toggle in the navbar (`aria-expanded`, tooltip, keyboard), no resize handle or pixel width; state in the `lipi_sidebar_collapsed` cookie read server-side. Evidence: `components/sidebar/sidebar-state.tsx`, `app/dashboard/(workspaces)/components/workspace-shell.test.tsx`, live run in Chrome via `chrome-devtools-axi` (expand, collapse, tooltip, Enter/Space, reload persistence, light, dark, 390 px sheet unchanged, 1023/1024 px boundary); not exercised: width animation (none), long page titles, Safari/Firefox
- [x] Docs link fixes (2026-10-03): the ledger's LIP-V016 pointed at `docs/shared-database-auth.md`, which does not exist (`git ls-files docs` lists no such file); the `workspaces-roles-invites` feature map cited `app/invite/[token]/page.tsx`, which is now `route.ts` (`app/invite/[token]/route.ts`)

## Open

- [ ] Backfill credential accounts for legacy users on the production database so they can sign in ([requirements](./requirements/requirements.md)). Kind: fix (operational). Priority: P1. Evidence: [requirements](./requirements/requirements.md) §3.1 and §4, ledger LIP-V016. Status: open; cannot be answered locally
- [ ] Choose the production realtime endpoint arrangement (same cookie-owning host vs separate host with `wss://` and the signed token) ([research](./research/realtime-collaboration.md)). Kind: decision needed. Priority: P1. Evidence: [realtime](./guides/realtime.md) ("not a Vercel function"), ledger LIP-V016. Status: open

- [ ] Production keeps the default Drizzle history table (`drizzle.__drizzle_migrations`); only loopback `DATABASE_URL` uses `drizzle.__lipi_migrations`. If production shares that default table with another app, confirm its newer timestamps do not make Drizzle skip Lipi migrations before the next production migration. Priority: medium. Evidence: `drizzle.config.ts`. Status: open, unexercised. Kind: verification gap. Audit priority: P2
- [ ] Browser-verify the email-only login page (light/dark, keyboard focus) after username removal; only HTTP sign-in and page markup were checked. Priority: medium. Evidence: `app/(auth)/components/login-form.tsx`. Status: open. Kind: verification gap. Audit priority: P2
- [ ] Hocuspocus 4.7 does not start under Bun (`crossws` Node adapter), so `realtime:*` still needs Node 22. Revisit when Hocuspocus supports Bun. Priority: low. Evidence: `bun realtime/server.ts` fails at startup. Status: open. Kind: improvement. Audit priority: P3
- [ ] Decide for the showcase whether to remove the footer newsletter form or implement a real subscription (see the bug line below). Kind: decision needed. Priority: P3. Evidence: ledger LIP-V006, `components/site-footer/newsletter-subscription-form.tsx:32`. Status: open
- [ ] README one-click Vercel deploy button lists only `AUTH_SECRET`, OAuth ids, `DATABASE_URL` and Upstash variables; the realtime host (`NEXT_PUBLIC_LIPI_REALTIME_URL`, not deployable as a Vercel function) and Stripe/UploadThing variables are absent, so a button deploy has no working editor. Kind: improvement. Priority: P3. Evidence: `README.md` deploy link versus [realtime](./guides/realtime.md) and `lib/env.ts`. Status: open. Uncertainty: whether the button deploy is a supported path is part of the realtime hosting decision above

- [ ] Credential logger (commit bf8f5d4): `lib/dev-credentials-logger.ts` is more verbose than needed. Simplify to a small `register()`-called function; remove unnecessary async function, top-level side-effect call, and `import.meta.url` resolution that may break once bundled. Evidence: `lib/dev-credentials-logger.ts`, `instrumentation.ts`. Priority: P2. Kind: fix. Status: open.
- [ ] Collapsible sidebar (commit 4d2199c) not verified: long page titles, other browsers (Safari/Firefox). Decision needed for cloud agents: keep existing custom sidebar (resize wiring removed) vs adopt shadcn Sidebar. Evidence: `components/sidebar/sidebar-state.tsx`, `components/sidebar/sidebar-panel.tsx`, `components.json`. Priority: P2. Kind: decision needed. Status: open. Uncertainty: shadcn Sidebar is not installed.
- [ ] Credential logging not verified against a production build. Evidence: `lib/dev-credentials-logger.ts`, `instrumentation.ts`. Priority: P2. Kind: verification gap. Status: open.

- [ ] Design improvement pass over every page and component: visual quality, consistency with the design system (theme tokens, shadcn by composition), spacing, typography, motion (`prefers-reduced-motion`), accessibility, light and dark themes, clean at every breakpoint from 320 px phones to 1920 px+ desktops. Kind: improvement. Priority: P2. Evidence: ledger LIP-V013. Status: in progress (added 2026-10-03; split into public/auth, dashboard shell and editor). Dashboard and editor pages need a database, so they can only be reviewed by source and unit tests in the cloud; live checks are marked "needs local environment"

## Confirmed bugs (details in the ledger)

- [ ] Footer newsletter form reports success without subscribing. Kind: confirmed bug. Priority: P3. Evidence: ledger [LIP-V006](./verification/verification-issues.md#lip-v006-newsletter-form-reports-success-without-subscribing); the `// TODO` is still in `components/site-footer/newsletter-subscription-form.tsx:32`. Status: open
- [ ] `.env.example` omits `UPLOADTHING_*`, `LIPI_REALTIME_*` and `NEXT_PUBLIC_LIPI_REALTIME_URL`. Kind: confirmed bug (docs/config). Priority: P3. Evidence: ledger [LIP-V018](./verification/verification-issues.md#lip-v018-envexample-omits-realtime-and-uploadthing-variables); re-read on 2026-10-03, the file still has none of them. Status: open
- [ ] `?invite=invalid` is never displayed: the invite route redirects there and `app/dashboard/page.tsx` ignores search params. Kind: confirmed bug (deterministic source). Priority: P3. Evidence: ledger [LIP-V005](./verification/verification-issues.md#lip-v005-inviteinvalid-is-never-displayed). Status: open. Uncertainty: the visible result was not re-driven after the LIP-V019 route-handler fix
- [ ] `createRootPage` has no rollback on failure (a demoted editor leaves a ghost root page until reload), same class as LIP-V025 (`components/sidebar/document-tree.tsx`). Kind: confirmed bug (deterministic source). Priority: P2. Evidence: ledger [LIP-V027](./verification/verification-issues.md#lip-v027-failed-root-page-creation-is-not-rolled-back); the `toast.promise` error branch only returns text. Status: open (this is the UI follow-up line of the same name, listed once)

## Hypotheses and unverified gaps

Not confirmed defects. Each stays here until a run proves or retracts it.

- [ ] Reset-password server action is unauthenticated, enumerates users and is not covered by the auth rate limiter (HYPOTHESIS). Kind: verification gap. Priority: P2. Evidence: ledger [LIP-V003](./verification/verification-issues.md#lip-v003-reset-password-server-action-unauthenticated-enumerating-unthrottled); `lib/actions.ts` `resetPassword` re-read 2026-10-03, still throws distinct messages and has no session check. Status: open, unexercised. Uncertainty: real throttling depends on deployment config
- [ ] Signed-out `/invite/<token>` then login returns to the invite via `?from=`. Kind: verification gap. Priority: P3. Evidence: ledger [LIP-V004](./verification/verification-issues.md#lip-v004-invite-page-sends-callbackurl-login-reads-from). Status: open, not driven
- [ ] Auth flows not yet exercised in a browser: reset password, `?from=` return after login, password-rule messages, session expiry, unknown-user message. Kind: verification gap. Priority: P2. Evidence: ledger LIP-V007, [auth-session](../.agents/skills/verify/features/auth-session.md). Status: open
- [ ] Authorization matrix: signed-in `curl` for the 403/400/401/503 branches of `/api/realtime/token` and `/api/stripe/checkout` (the proxy redirects anonymous calls first), webhook signature failures, UploadThing permissions, owner-only controls for editors. Kind: verification gap. Priority: P2. Evidence: ledger LIP-V008, [access-control-anonymous](../.agents/skills/verify/features/access-control-anonymous.md). Status: open
- [ ] Realtime: three users, presence list, token refresh after 60 s, reconnect after realtime restart, revoked member, sidebar stateless events. Kind: verification gap. Priority: P2. Evidence: ledger LIP-V009, [realtime-collaboration](../.agents/skills/verify/features/realtime-collaboration.md). Status: open
- [ ] Documents, trash and tree: subpages, rename/duplicate, icons/covers, block quota, restoring a page with trashed ancestors, trash descendants, viewer denial of permanent delete. Kind: verification gap. Priority: P2. Evidence: ledger LIP-V010, [documents-editor](../.agents/skills/verify/features/documents-editor.md), [trash-search](../.agents/skills/verify/features/trash-search.md). Status: open
- [ ] Billing and quotas live: `/pricing` for anonymous and signed-in users, `Go Pro` with billing unconfigured, portal, webhook signature failures, Free-plan quota messages (1 workspace, 2 collaborators, 500 blocks). Live Stripe stays out of scope. Kind: verification gap. Priority: P2. Evidence: ledger LIP-V011, [billing-pricing](../.agents/skills/verify/features/billing-pricing.md) (status DRAFT, no live proof). Status: open
- [ ] UI quality: light/dark on dialogs and auth pages, loading/error/long-content states, keyboard focus order, reduced motion, tablet width, more than four collaborators in the header, other roles at 768 px. Kind: verification gap. Priority: P2. Evidence: ledger LIP-V013, V021, V025, [ui-quality](../.agents/skills/verify/features/ui-quality.md). Status: open
- [ ] Re-run the Playwright suite (`bun run test:e2e`: auth-workspace, documents-editor, collaboration, stripe-checkout); its results are prior proofs only. Kind: verification gap. Priority: P2. Evidence: ledger LIP-V015, `package.json` `test:e2e`. Status: open (browser automation, not run in this audit)
- [ ] Workspaces and invites: settings dialog (rename, logo, members), collaborator quota shown when inviting, token reuse and invalid/expired token, transfer ownership, delete workspace with confirmation. Kind: verification gap. Priority: P2. Evidence: ledger LIP-V008, V011, [workspaces-roles-invites](../.agents/skills/verify/features/workspaces-roles-invites.md). Status: open
- [ ] Confirm the LIP-V001 `0004` fix on a database that really applied the old `0004` text-to-boolean step (production-like), alongside the history-table item above. Kind: verification gap. Priority: P2. Evidence: ledger LIP-V001 ("Not proven: a database that really applied the old 0004"). Status: open
- [ ] Lobby and legal pages: home sections, theme toggle, `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, 404 and error boundaries, mobile navigation. Kind: verification gap. Priority: P3. Evidence: ledger LIP-V013, [lobby-legal-public](../.agents/skills/verify/features/lobby-legal-public.md). Status: open
- [ ] Uploads without credentials: unauthenticated rejection, viewer/editor/owner permission paths, URL-based cover and logo; binary delivery to UploadThing needs `UPLOADTHING_TOKEN` and is not provable locally. Kind: verification gap. Priority: P3. Evidence: ledger LIP-V010, [uploads](../.agents/skills/verify/features/uploads.md) (status DRAFT), [requirements](./requirements/requirements.md) §3.5. Status: open
- [ ] Search in a production build and by keyboard selection (the LIP-V020 fix was driven on a dev build only); cross-workspace content exposure beyond the non-member denial. Kind: verification gap. Priority: P3. Evidence: ledger LIP-V020. Status: open
- [ ] Removing a member while that user has the workspace open (LIP-V026 notifies but the removed session was not driven). Kind: verification gap. Priority: P3. Evidence: ledger LIP-V026. Status: open
- [ ] A trashed page opened by direct URL: is it still editable? `realtime.md` says the realtime server rejects trashed rooms, but the UI result was not tested. Kind: verification gap. Priority: P3. Evidence: ledger LIP-V022. Status: open
- [ ] OAuth (Google/GitHub) round trip cannot be proved locally; no passkey flow exists. Kind: verification gap. Priority: P3. Evidence: ledger LIP-V014. Status: open, not provable without real credentials
- [ ] Verify skill still says `Shift+F10` "did not open" the tree context menu (`.agents/skills/verify/SKILL.md` Drive section); LIP-V023 is now fixed, so the sentence is stale. Kind: fix (docs drift, not edited by this audit). Priority: P3. Evidence: `.agents/skills/verify/SKILL.md` versus ledger LIP-V023. Status: open

## Verification (PStack, partial)

- [x] Source-grounded DRAFT verification skill and feature map - [.agents/skills/verify](../.agents/skills/verify/SKILL.md), symlinked at `.claude/skills/verify`
- [x] Single issue ledger with confirmed issues, hypotheses and gaps - [verification/verification-issues.md](./verification/verification-issues.md)
- [x] Non-browser gates re-run on 2026-10-02: `bun run type-check`, `bun run lint`, `bun run test` (62 files, 225 tests)
- [ ] Run the skill live (launch, doctor, drive, evidence, cleanup) once the user-selected browser skill is available; update each feature's `Last live proof`. Kind: verification gap. Priority: P2. Evidence: ledger LIP-V012 (launch ran once; dev-server path not run). Status: open
- [ ] Re-prove sign-up/login/reset, role and anonymous access, workspaces and invites, editor, trash, search, realtime with two sessions, and UI quality in a browser (LIP-V007 to V013) (umbrella: the granular lines under "Hypotheses and unverified gaps" carry the work)
- [ ] Triage the confirmed items for later ships: `db:migrate` on an empty database (LIP-V001), newsletter stub (LIP-V006), `.env.example` gaps (LIP-V018) (umbrella: LIP-V001 is fixed per the ledger; LIP-V006 and V018 are listed under "Confirmed bugs")

## UI follow-ups (found during UI polish round two)

Each line below was re-read against the current code on 2026-10-03 and is still open. Kind and priority are in brackets.

- [ ] Handoff (non-design): return a typed code from `MutationAuthError` (for example `FORBIDDEN`) in server-action results so the client can show "You do not have permission" instead of a generic failure; production strips thrown messages. Files: `lib/db/queries/mutation-auth.ts`, `lib/db/queries/document.ts`, `components/sidebar/document-tree.tsx`. Desired: viewer-triggered mutations show a permission toast and the optimistic state rolls back (already done client-side). [fix, P2; the client compares `error.message === "Forbidden"` in `moveToTrash`, which production sanitizing defeats]
- [ ] Workspace home lists subpages flat, oldest first, and formats dates on the server locale; add parent context, recency order and client-side date formatting (`app/dashboard/(workspaces)/[workspaceId]/page.tsx`) [improvement, P3; the page still uses `toLocaleDateString` in a server component]
- [ ] Sidebar nav dialog descriptions ("Restore or delete trashed pages") are not role-aware for viewers (`components/sidebar/sidebar-panel.tsx`) [fix, P3; string still at `sidebar-panel.tsx:51`]
- [ ] Context menu "Move to trash" uses raw `!text-red-500` instead of a semantic destructive token or `variant="destructive"` item (`components/sidebar/document-tree.tsx`); inherited, left as is [fix, P3; still at `document-tree.tsx:363`]
- [ ] Prove `Shift+F10` and the `ContextMenu` key on real hardware keyboards (LIP-V023 is tool-dispatched only) [verification gap, P3]
- [ ] Search: add tests for Cmd+K open and select-to-navigate focus restoration; `lastFocusedElementRef` is written inside a state updater (`components/search-command.tsx`) [verification gap, P3; the write is still inside `setOpen((prev) => ...)`]
- [ ] Trash dialog and tree are not covered by a browser-driven viewer test in `tests/e2e`; add owner/editor/viewer role cases [verification gap, P2; `collaboration.spec.ts` covers viewer typing only]
- [ ] `createRootPage` has no rollback on failure (a demoted editor leaves a ghost root page until reload), same class as LIP-V025 (`components/sidebar/document-tree.tsx`) [confirmed bug, P2; ledger LIP-V027, counted once, see "Confirmed bugs"]
- [ ] `moveToTrash` rollback restores the whole click-time snapshot and can overwrite concurrent realtime changes; restore only the affected ids [fix, P3; `replaceDocuments(previous)` in `document-tree.tsx`; the overwrite was not reproduced]
- [ ] `useCanEditPages` fails open when `role` is null; make the unknown-role state explicit (UI only, the server still enforces) [improvement, P3; `hooks/use-app-state.ts:128-131`]
- [ ] Add unit tests for tree viewer gating and trash rollback (the keyboard test mocks `useCanEditPages: () => true`) [verification gap, P3]
- [ ] `View only` badge is `text-[10px]`; raise it for readability [improvement, P3; still at `document-tree.tsx:593`]
- [ ] Removed member with an open session hits the layout's `MutationAuthError`; show a friendly state (pre-existing); `pages:changed` stateless messages can be sent by any connected client (pre-existing) [fix, P2; one line, two pre-existing items; the second was not reproduced]
- [ ] `components/ui/resizable.tsx` and the `react-resizable-panels` dependency are now unused after the sidebar rewrite; remove both in a dependency task (the file is protected shadcn source, so it was left untouched) [cleanup, P3; `grep -rn "ui/resizable"` finds no importer]
- [ ] Collapsed rail: the `Open pages` trigger floats mid-height (`document-tree-collapsed.tsx` inside the `flex-1` tree container); anchor it under the nav separator [improvement, P3; seen in the live collapsed screenshot]
- [ ] Sidebar width change is instant (no transition); add one that respects `prefers-reduced-motion` without clipping the expanded content [improvement, P3]

## shadcn source modification check (2026-10-03)

Method: `bunx shadcn@latest add <name> --diff components/ui/<name>.tsx` (CLI 4.21.1, style `base-nova`) for each of the 30 files in `components/ui/`, plus `git log -- components/ui`. Nothing was reverted or updated.

- [x] No behavioral modification found. 17 files match upstream or differ in formatting only (CLI reports "no diff" or "formatting-only"): alert-dialog, avatar, card, hover-card, input, kbd, label, popover, resizable, scroll-area, separator, skeleton, textarea, toggle-group, tooltip, and the import-order-only ones below
- [x] Formatting-only differences in accordion, badge, button, combobox, context-menu, dialog, dropdown-menu, input-group, navigation-menu, select, sheet, sonner, tabs, toggle: import order (`@hugeicons/*` before `@/` imports), `cva`/`VariantProps` type-import split, multi-line `cn(...)` arguments, wrapped icon imports. Pre-existing: introduced by the repo-wide Prettier/import-sort pass in `91f5f4b` (2026-10-02) on top of the CLI reset in `0321a94` and the combobox add in `c2b075b`; not part of the shadcn-sync task
- [x] `components/ui/form.tsx` has no `base-nova` registry counterpart ("No file matching"), so it cannot be diffed upstream. Pre-existing: added in `579490b` (2023-12-10), not touched by the 2026-09-26 reinstall. Verify whether it is still used and whether it is a legacy (react-hook-form era) file before relying on it. Priority: low. Status: open, unverified. Resolved 2026-10-03 as to usage: it is imported by `app/dashboard/new-workspace/workspace-form.tsx`, `app/(auth)/components/{login,signup,reset-password}-form.tsx` and `components/settings.tsx`, and `react-hook-form` ^7.89.0 is a current dependency, so it is live code. It remains a non-upstream, protected file; no change needed
- [ ] Optional: align the formatter config with shadcn output (or ignore `components/ui` in Prettier) so future `--diff` runs show real drift instead of formatting noise. Priority: low. Evidence: 14 formatting-only diffs above. Status: open. Kind: improvement. Audit priority: P3
