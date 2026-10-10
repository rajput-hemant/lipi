# Workspaces, roles and invites

Status: PARTIAL live proof (create, invite, accept, viewer role). Invite acceptance has a confirmed bug, LIP-V019. Last live proof: 2026-10-10 (branch `task/r4-sec` on `71b665e` (production build, `next start`; enforcing-CSP experiment build), evidence [local-session-r4-sec-2026-10-10.md](../../../../docs/verification/local-session-r4-sec-2026-10-10.md); invite as editor and as viewer through the settings form, both accepted at `/invite/<token>`, member removal; sub-features still unticked below were not exercised). Earlier proof: 2026-10-02, commit `815ceda`, evidence `lipi-browser-verification/evidence/workspaces-roles-invites/` (private task data dir, not in the repo).

Workspace creation, the owner/editor/viewer model (`lib/workspace/permissions.ts`), email-token invites (`lib/workspace/workspace-invites.ts`, `app/invite/[token]/route.ts`), settings dialog (`components/settings.tsx`), ownership transfer and workspace deletion.

## Sub-features

- [x] Create workspace (`/dashboard/new-workspace`, `Workspace name`, `Create workspace`). Free plan allows 1 owned workspace (`lib/billing/plan-quotas.ts`). - live: `Alpha Space` created; toast `Your workspace "Alpha Space" was created successfully.`; second-workspace limit NOT exercised.
- [ ] Settings dialog: rename, logo, members list with `Owner` badge.
- [x] Invite by email as `editor` or `viewer`; toast `Invite created`; a repeated invite for the same email refreshes the token, role and expiry (`onConflictDoUpdate`); only an existing collaborator is rejected (`This user is already a collaborator`). - live: editor invite for user B; toast `Invite created`, `PENDING INVITES` shown; repeat-invite refresh NOT exercised.
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
- Invalid tokens redirect to `/dashboard?invite=invalid`; `app/dashboard/invite-notice.tsx` now reads it and shows `This invite is invalid or has expired.` (source-checked, not re-driven; LIP-V005).

## Recipe notes (2026-10-10)

- Settings dialog member rows: button `Change role for <name>` opens menu items `Editor`, `Viewer`, `Remove`. The invite role is the combobox `Role` (option `Viewer`), set before clicking `Invite`.
- Both invites were created from the UI (`lipi_workspace_invites` rows `editor` and `viewer`); acceptance used the token read from that table. Landing page after accept was not recorded, so the accept sub-feature stays unticked.
