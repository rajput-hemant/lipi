# Lipi to-do

Canonical task index. Checked items cite implementation or test files present on `feat/complete-lipi`; the tests were not re-run when this index was written.

## Done

- [x] Better Auth sign-in on the shared database - `lib/auth/create-auth.ts`, `lib/auth/*.test.ts`, `tests/e2e/auth-workspace.spec.ts`; see [shared-database-auth](./shared-database-auth.md)
- [x] Workspaces with owner/editor/viewer roles and email invites - `lib/workspace/permissions.ts`, `lib/workspace/workspace-invites.test.ts`, migration `0009_workspace_roles_invites.sql`
- [x] Block-based document pages in a tree sidebar - `components/document-editor/`, `lib/db/documents-tree.ts`, `tests/e2e/documents-editor.spec.ts`
- [x] Real-time collaboration (Hocuspocus + Yjs, signed room tokens, presence) - `realtime/server.ts`, `app/api/realtime/token/route.ts`, `tests/e2e/collaboration.spec.ts`; see [realtime](./realtime.md)
- [x] Free/Pro quotas and Stripe checkout/portal/webhook - `lib/billing/plan-quotas.ts`, `app/api/stripe/`, `tests/e2e/stripe-checkout.spec.ts`

## Open

- [ ] Run Infinitunes' shared-table migrations and `BACKFILL_ALL` against the shared database so legacy users can sign in ([shared-database-auth](./shared-database-auth.md))
- [ ] Choose the production realtime endpoint arrangement (same cookie-owning host vs separate host with `wss://` and the signed token) ([research](./research/realtime-collaboration.md))
- [ ] Trash controls and empty-state polish - tracked on the separate `lipi-trash-ui-polish` task, not part of this branch
- [ ] Write product requirements (target users, scope versus Notion, pricing intent); none exist beyond the README tagline, which is still marked `[WIP]`
