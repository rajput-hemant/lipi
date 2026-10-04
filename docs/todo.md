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
- [x] Remove unsupported newsletter subscription and success claims - `components/site-footer/footer.tsx`; deleted `components/site-footer/newsletter-subscription-form.tsx` on 2026-10-04, source-only (LIP-V006)
- [x] Add realtime and UploadThing examples and correct the validation flag example - `.env.example`, `lib/env.ts`, `realtime/server.ts`, `lib/realtime/client.ts`; completed on 2026-10-04, source-only (LIP-V018)

## Open

- [ ] Run Infinitunes' shared-table migrations and `BACKFILL_ALL` against the shared database so legacy users can sign in ([shared-database-auth](./shared-database-auth.md))
- [ ] Choose the production realtime endpoint arrangement (same cookie-owning host vs separate host with `wss://` and the signed token) ([research](./research/realtime-collaboration.md))

## Verification (PStack, partial)

- [x] Source-grounded DRAFT verification skill and feature map - [.agents/skills/verify](../.agents/skills/verify/SKILL.md), symlinked at `.claude/skills/verify`
- [x] Single issue ledger with confirmed issues, hypotheses and gaps - [checks/verification-issues.md](./checks/verification-issues.md)
- [x] Non-browser gates re-run on 2026-10-02: `bun run type-check`, `bun run lint`, `bun run test` (62 files, 225 tests)
- [x] Partial live skill run on 2026-10-02 - `fe10171` records launch, doctor, browser evidence, cleanup, and harness corrections; remaining coverage stays open in [checks/verification-issues.md](./checks/verification-issues.md)
- [ ] Complete the live skill coverage and update each feature's `Last live proof`, including billing and uploads with no live proof (LIP-V012)
- [ ] Re-prove sign-up/login/reset, role and anonymous access, workspaces and invites, editor, trash, search, realtime with two sessions, and UI quality in a browser (LIP-V007 to V013)
- [x] Triage the confirmed fixes - `c081bfe` fixes the empty-database migration (LIP-V001), invite acceptance, search UI, mobile header, and trash navigation; the 2026-10-04 source edits remove the newsletter stub (LIP-V006) and fill `.env.example` gaps (LIP-V018). These latest edits have no new live proof.
