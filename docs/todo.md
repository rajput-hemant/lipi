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

## Verification (PStack, partial)

- [x] Source-grounded DRAFT verification skill and feature map - [.agents/skills/verify](../.agents/skills/verify/SKILL.md), symlinked at `.claude/skills/verify`
- [x] Single issue ledger with confirmed issues, hypotheses and gaps - [checks/verification-issues.md](./checks/verification-issues.md)
- [x] Non-browser gates re-run on 2026-10-02: `bun run type-check`, `bun run lint`, `bun run test` (62 files, 225 tests)
- [ ] Run the skill live (launch, doctor, drive, evidence, cleanup) once the user-selected browser skill is available; update each feature's `Last live proof`
- [ ] Re-prove sign-up/login/reset, role and anonymous access, workspaces and invites, editor, trash, search, realtime with two sessions, and UI quality in a browser (LIP-V007 to V013)
- [ ] Triage the confirmed items for later ships: `db:migrate` on an empty database (LIP-V001), newsletter stub (LIP-V006), `.env.example` gaps (LIP-V018)
