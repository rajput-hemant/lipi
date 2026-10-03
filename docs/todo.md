# Lipi to-do

Canonical task index. Checked items cite implementation, test, or documentation files present on `feat/complete-lipi`; the tests were not re-run when this index was written.

## Done

- [x] Better Auth sign-in on the shared database - `lib/auth/create-auth.ts`, `lib/auth/*.test.ts`, `tests/e2e/auth-workspace.spec.ts`; see [shared-database-auth](./shared-database-auth.md)
- [x] Workspaces with owner/editor/viewer roles and email invites - `lib/workspace/permissions.ts`, `lib/workspace/workspace-invites.test.ts`, migration `0009_workspace_roles_invites.sql`
- [x] Block-based document pages in a tree sidebar - `components/document-editor/`, `lib/db/documents-tree.ts`, `tests/e2e/documents-editor.spec.ts`
- [x] Real-time collaboration (Hocuspocus + Yjs, signed room tokens, presence) - `realtime/server.ts`, `app/api/realtime/token/route.ts`, `tests/e2e/collaboration.spec.ts`; see [realtime](./realtime.md)
- [x] Free/Pro quotas and Stripe checkout/portal/webhook - `lib/billing/plan-quotas.ts`, `app/api/stripe/`, `tests/e2e/stripe-checkout.spec.ts`
- [x] Product requirements and portfolio showcase scope - [requirements](./requirements.md)
- [x] Trash controls and empty-state polish - `components/trash.tsx`, `components/trash.test.tsx`

## Open

- [ ] Run Infinitunes' shared-table migrations and `BACKFILL_ALL` against the shared database so legacy users can sign in ([shared-database-auth](./shared-database-auth.md))
- [ ] Choose the production realtime endpoint arrangement (same cookie-owning host vs separate host with `wss://` and the signed token) ([research](./research/realtime-collaboration.md))

- [ ] Production adoption of Lipi's separate migration history is unproven: local mode uses `drizzle.__lipi_migrations`, production still shares `drizzle.__drizzle_migrations` with Infinitunes, whose newer timestamps make Drizzle skip Lipi migrations and whose migrator rejects foreign rows. Agree one history strategy before the next production migration. Priority: high. Evidence: `lib/db/migration-history.ts`, local runs on a disposable PostgreSQL 18.6 database. Status: open
- [ ] Hocuspocus 4.7 does not start under Bun (`crossws` Node adapter), so `realtime:*` still needs Node 22. Revisit when Hocuspocus supports Bun. Priority: low. Evidence: `bun realtime/server.ts` fails at startup. Status: open
- [ ] Infinitunes docs list a `lipi_passkey` table that Lipi does not have; confirm intent with the Infinitunes owner. Priority: low. Status: open

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
