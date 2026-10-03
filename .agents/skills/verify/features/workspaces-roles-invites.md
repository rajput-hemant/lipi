# Workspaces, roles and invites

Status: PARTIAL live proof (create, invite, accept, viewer role). Invite acceptance has a confirmed bug, LIP-V019. Last live proof: 2026-10-02, commit `815ceda`, evidence `lipi-browser-verification/evidence/workspaces-roles-invites/` (private task data dir, not in the repo).
Ledger: [verification-issues.md](../../../../docs/verification/verification-issues.md) (this file lists IDs only).
Related ledger IDs: LIP-V005, LIP-V008, LIP-V011

Workspace creation, the owner/editor/viewer model (`lib/workspace/permissions.ts`), email-token invites (`lib/workspace/workspace-invites.ts`, `app/invite/[token]/route.ts`), settings dialog (`components/settings.tsx`), ownership transfer and workspace deletion.

## Sub-features

- [x] Create workspace (`/dashboard/new-workspace`, `Workspace name`, `Create workspace`). Free plan allows 1 owned workspace (`lib/billing/plan-quotas.ts`). - live: `Alpha Space` created; toast `Your workspace "Alpha Space" was created successfully.`; second-workspace limit NOT exercised.
- [ ] Settings dialog: rename, logo, members list with `Owner` badge.
- [x] Invite by email as `editor` or `viewer`; toast `Invite created`; duplicate active invite rejected. - live: editor invite for user B; toast `Invite created`, `PENDING INVITES` shown; duplicate-invite rejection NOT exercised.
- [ ] Accept invite at `/invite/<token>` as a signed-in user; lands on `/dashboard/<workspaceId>`.
- [ ] Role effects: editor edits; viewer sees `View only` and cannot edit; only owner sees invite form, `Transfer ownership`, `Delete workspace`.
- [ ] Collaborator quota (Free: 2) shown or enforced when inviting.
- [ ] Transfer ownership and delete workspace with confirmation dialog.
- [ ] Invalid/expired token behavior.

## How to get to it (user POV)

Signed-in user with no workspace is sent to `/dashboard/new-workspace`; settings from the sidebar (`Settings` button).

## Driving it with the browser skill (pending)

1. Owner: sign up, create `Verify WS`.
2. Settings, `Invite by email` = editor email, role select `editor`, `Invite`; same for a viewer.
3. Read tokens from `lipi_workspace_invites` (read-only, see SKILL.md), open `/invite/<token>` in each invitee's own context after sign-up.
4. Expect redirect to the workspace; `lipi_workspace_members` has the rows with the right roles (columns: `lib/db/schema/app.ts`).
5. Negative: reuse a token, invite the same email twice, third collaborator on Free plan, viewer opening Settings, outsider opening the workspace URL.
6. Evidence: members/invites table rows before and after, plus screenshots once the browser skill exists.

## Gotchas

- No mailer locally; the token comes from the DB.
- Free plan limits one owned workspace: create a second one only to prove the quota message, using the same owner.
- Invalid tokens redirect to `/dashboard?invite=invalid`, which no component reads (LIP-V005).
