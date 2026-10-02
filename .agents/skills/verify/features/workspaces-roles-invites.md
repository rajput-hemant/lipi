# Workspaces, roles and invites

Status: DRAFT, not live-verified. Last live proof: none.
Ledger: [verification-issues.md](../../../../docs/checks/verification-issues.md) (this file lists IDs only).
Related ledger IDs: LIP-V005, LIP-V008, LIP-V011

Workspace creation, the owner/editor/viewer model (`lib/workspace/permissions.ts`), email-token invites (`lib/workspace/workspace-invites.ts`, `app/invite/[token]/page.tsx`), settings dialog (`components/settings.tsx`), ownership transfer and workspace deletion.

## Sub-features

- [ ] Create workspace (`/dashboard/new-workspace`, `Workspace name`, `Create workspace`). Free plan allows 1 owned workspace (`lib/billing/plan-quotas.ts`).
- [ ] Settings dialog: rename, logo, members list with `Owner` badge.
- [ ] Invite by email as `editor` or `viewer`; toast `Invite created`; duplicate active invite rejected.
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
