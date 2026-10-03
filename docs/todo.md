# Lipi to-do

Canonical task index. Checked items cite implementation, test, or documentation files present on `feat/complete-lipi`; the tests were not re-run when this index was written.

## Done

- [x] Better Auth email and password sign-in - `lib/auth/create-auth.ts`, `lib/auth/*.test.ts`, `tests/e2e/auth-workspace.spec.ts`
- [x] Workspaces with owner/editor/viewer roles and email invites - `lib/workspace/permissions.ts`, `lib/workspace/workspace-invites.test.ts`, migration `0009_workspace_roles_invites.sql`
- [x] Block-based document pages in a tree sidebar - `components/document-editor/`, `lib/db/documents-tree.ts`, `tests/e2e/documents-editor.spec.ts`
- [x] Real-time collaboration (Hocuspocus + Yjs, signed room tokens, presence) - `realtime/server.ts`, `app/api/realtime/token/route.ts`, `tests/e2e/collaboration.spec.ts`; see [realtime](./realtime.md)
- [x] Free/Pro quotas and Stripe checkout/portal/webhook - `lib/billing/plan-quotas.ts`, `app/api/stripe/`, `tests/e2e/stripe-checkout.spec.ts`
- [x] Product requirements and portfolio showcase scope - [requirements](./requirements.md)
- [x] Trash controls and empty-state polish - `components/trash.tsx`, `components/trash.test.tsx`

## Open

- [ ] Backfill credential accounts for legacy users on the production database so they can sign in ([requirements](./requirements.md))
- [ ] Choose the production realtime endpoint arrangement (same cookie-owning host vs separate host with `wss://` and the signed token) ([research](./research/realtime-collaboration.md))

- [ ] Production keeps the default Drizzle history table (`drizzle.__drizzle_migrations`); only loopback `DATABASE_URL` uses `drizzle.__lipi_migrations`. If production shares that default table with another app, confirm its newer timestamps do not make Drizzle skip Lipi migrations before the next production migration. Priority: medium. Evidence: `drizzle.config.ts`. Status: open, unexercised
- [ ] Browser-verify the email-only login page (light/dark, keyboard focus) after username removal; only HTTP sign-in and page markup were checked. Priority: medium. Evidence: `app/(auth)/components/login-form.tsx`. Status: open
- [ ] Hocuspocus 4.7 does not start under Bun (`crossws` Node adapter), so `realtime:*` still needs Node 22. Revisit when Hocuspocus supports Bun. Priority: low. Evidence: `bun realtime/server.ts` fails at startup. Status: open

## Verification (PStack, partial)

- [x] Source-grounded DRAFT verification skill and feature map - [.agents/skills/verify](../.agents/skills/verify/SKILL.md), symlinked at `.claude/skills/verify`
- [x] Single issue ledger with confirmed issues, hypotheses and gaps - [checks/verification-issues.md](./checks/verification-issues.md)
- [x] Non-browser gates re-run on 2026-10-02: `bun run type-check`, `bun run lint`, `bun run test` (62 files, 225 tests)
- [ ] Run the skill live (launch, doctor, drive, evidence, cleanup) once the user-selected browser skill is available; update each feature's `Last live proof`
- [ ] Re-prove sign-up/login/reset, role and anonymous access, workspaces and invites, editor, trash, search, realtime with two sessions, and UI quality in a browser (LIP-V007 to V013)
- [ ] Triage the confirmed items for later ships: `db:migrate` on an empty database (LIP-V001), newsletter stub (LIP-V006), `.env.example` gaps (LIP-V018)

## UI follow-ups (found during UI polish round two)

- [ ] Handoff (non-design): return a typed code from `MutationAuthError` (for example `FORBIDDEN`) in server-action results so the client can show "You do not have permission" instead of a generic failure; production strips thrown messages. Files: `lib/db/queries/mutation-auth.ts`, `lib/db/queries/document.ts`, `components/sidebar/document-tree.tsx`. Desired: viewer-triggered mutations show a permission toast and the optimistic state rolls back (already done client-side).
- [ ] Workspace home lists subpages flat, oldest first, and formats dates on the server locale; add parent context, recency order and client-side date formatting (`app/dashboard/(workspaces)/[workspaceId]/page.tsx`)
- [ ] Sidebar nav dialog descriptions ("Restore or delete trashed pages") are not role-aware for viewers (`components/sidebar/sidebar-panel.tsx`)
- [ ] Context menu "Move to trash" uses raw `!text-red-500` instead of a semantic destructive token or `variant="destructive"` item (`components/sidebar/document-tree.tsx`); inherited, left as is
- [ ] Prove `Shift+F10` and the `ContextMenu` key on real hardware keyboards (LIP-V023 is tool-dispatched only)
- [ ] Search: add tests for Cmd+K open and select-to-navigate focus restoration; `lastFocusedElementRef` is written inside a state updater (`components/search-command.tsx`)
- [ ] Trash dialog and tree are not covered by a browser-driven viewer test in `tests/e2e`; add owner/editor/viewer role cases
- [ ] `createRootPage` has no rollback on failure (a demoted editor leaves a ghost root page until reload), same class as LIP-V025 (`components/sidebar/document-tree.tsx`)
- [ ] `moveToTrash` rollback restores the whole click-time snapshot and can overwrite concurrent realtime changes; restore only the affected ids
- [ ] `useCanEditPages` fails open when `role` is null; make the unknown-role state explicit (UI only, the server still enforces)
- [ ] Add unit tests for tree viewer gating and trash rollback (the keyboard test mocks `useCanEditPages: () => true`)
- [ ] `View only` badge is `text-[10px]`; raise it for readability
- [ ] Removed member with an open session hits the layout's `MutationAuthError`; show a friendly state (pre-existing); `pages:changed` stateless messages can be sent by any connected client (pre-existing)

## shadcn source modification check (2026-10-03)

Method: `bunx shadcn@latest add <name> --diff components/ui/<name>.tsx` (CLI 4.21.1, style `base-nova`) for each of the 30 files in `components/ui/`, plus `git log -- components/ui`. Nothing was reverted or updated.

- [x] No behavioral modification found. 17 files match upstream or differ in formatting only (CLI reports "no diff" or "formatting-only"): alert-dialog, avatar, card, hover-card, input, kbd, label, popover, resizable, scroll-area, separator, skeleton, textarea, toggle-group, tooltip, and the import-order-only ones below
- [x] Formatting-only differences in accordion, badge, button, combobox, context-menu, dialog, dropdown-menu, input-group, navigation-menu, select, sheet, sonner, tabs, toggle: import order (`@hugeicons/*` before `@/` imports), `cva`/`VariantProps` type-import split, multi-line `cn(...)` arguments, wrapped icon imports. Pre-existing: introduced by the repo-wide Prettier/import-sort pass in `91f5f4b` (2026-10-02) on top of the CLI reset in `0321a94` and the combobox add in `c2b075b`; not part of the shadcn-sync task
- [ ] `components/ui/form.tsx` has no `base-nova` registry counterpart ("No file matching"), so it cannot be diffed upstream. Pre-existing: added in `579490b` (2023-12-10), not touched by the 2026-09-26 reinstall. Verify whether it is still used and whether it is a legacy (react-hook-form era) file before relying on it. Priority: low. Status: open, unverified
- [ ] Optional: align the formatter config with shadcn output (or ignore `components/ui` in Prettier) so future `--diff` runs show real drift instead of formatting noise. Priority: low. Evidence: 14 formatting-only diffs above. Status: open
