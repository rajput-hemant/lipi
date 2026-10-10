# Realtime collaboration and presence

Status: PARTIAL live proof (three-user live edit, presence list, viewer read-only, token refresh, reconnect, revoked member). Last live proof: 2026-10-10, branch `task/r4-sec` on `71b665e` (production build, `next start`; enforcing-CSP experiment build), evidence [local-session-r4-sec-2026-10-10.md](../../../../docs/verification/local-session-r4-sec-2026-10-10.md). Earlier proof: 2026-10-02, commit `815ceda`.

Hocuspocus 4.7 + Yjs server (`realtime/server.ts`, `realtime/bootstrap.mjs`, `lib/realtime/*`) with signed 60 s room tokens from `/api/realtime/token`, presence (`Page collaborators`), viewer read-only enforcement. See [docs/guides/realtime.md](../../../../docs/guides/realtime.md).

## Sub-features

- [x] Two or three users in different contexts on the same page see edits appear live. - live (2026-10-02): two isolated sessions, both persisted in `lipi_documents`. live (2026-10-10): three bridge sessions (owner A, editor B, viewer C) on one page; B's text appeared in A and C, A's text appeared in B and C, and the owner's text is in `lipi_documents.content`.
- [x] Presence list `Page collaborators` shows 2+ items; awareness cursor/name is server-rewritten. - live (2026-10-10): with three users connected each one saw the other two (titles `r4-b`/`r4-c` for A, `r4-c`/`r4-a` for B, `r4-b`/`r4-a` for C); cursor labels with the user name appeared in the editor. Server-side rewriting of a forged awareness name was NOT exercised.
- [x] Viewer gets `View only` and cannot type; typed text does not appear for others. - live (2026-10-02): after A set B to Viewer, B saw `View only`; typing `SHOULD NOT SAVE` neither reached A nor the database. live (2026-10-10): invited viewer C saw `View only`; typing in C reached neither A, B nor `lipi_documents.content`.
- [x] Token refresh keeps the session alive past 60 s. - live (2026-10-10): a `fetch` wrapper in B logged `/api/realtime/token` calls for both rooms every 30 s (`components/realtime/workspace-realtime-provider.tsx` interval); B kept editing more than 3 minutes after load and its edit synced to A and C with no reload.
- [x] Revoked member or deleted page disconnects/denies. - live (2026-10-10, revoked member only): owner A used Settings, `Change role for r4-b`, `Remove`; within 5 s B's open page became `You no longer have access to this workspace`, `/api/realtime/token` returned 403 for B on both the document and workspace rooms (200 for C), and A's collaborator count dropped from 2 to 1. Deleted page NOT exercised; how long an already-open idle socket survives was not measured.
- [x] Reconnect after the realtime server restarts (`Reconnecting to collaborators...` then recovery). - live (2026-10-10): killed the realtime process; A and B showed `Reconnecting to collaborators...` within 6 s; after restart the banner cleared on its own, presence showed 2 again and B's next edit reached A and C without a reload. Text typed while the server was down was not kept in B (editor not editable), so offline queueing is NOT proven.
- [ ] Workspace-room stateless events refresh the sidebar.

## How to get to it (user POV)

Any shared page opened by two members at once.

## Driving it with the browser skill (pending)

1. Three separate browser contexts: owner, editor, viewer (invite flow above).
2. Owner opens `Shared Doc`, types a unique phrase; expect it in the editor and viewer contexts within a few seconds.
3. Viewer clicks `.bn-editor`, types; expect no change anywhere.
4. Check `Page collaborators` count in the owner context.
5. Evidence: `lipi_realtime_documents` state size changes, `documents.content` snapshot after debounce, `realtime.log` lines for connect/auth/store, console clean in all contexts.
6. Negative: call the token route for a room of another workspace with user B's cookie and `Origin: http://127.0.0.1:3161`; expect 403.

## Gotchas

- Prior browser proof: `tests/e2e/collaboration.spec.ts` (not re-run; browser hold).
- The production endpoint arrangement is an open decision (LIP-V016); local proof says nothing about it.
- `127.0.0.1` vs `localhost` produce different cookie hosts.

## Recipe notes (2026-10-10)

- Start `next start` and `node realtime/bootstrap.mjs` as separately backgrounded harness tasks. A plain `cmd &` inside one shell call is killed when that call returns, and the app then fails with `ERR_CONNECTION_REFUSED` on `/api/auth/*`.
- The `chrome-devtools-axi network` list did not show the 30 s token calls; install a `window.fetch` wrapper through `eval` and read its log to count them.
- Reconnect check: `kill $(lsof -tiTCP:<port> -sTCP:LISTEN)` for the realtime port, wait about 6 s, read `document.body.innerText` for `Reconnecting to collaborators...`, restart the process, wait about 25 s.
- Revoke check: owner opens `Settings`, clicks `Change role for <name>`, menu item `Remove`; then POST `/api/realtime/token` from the removed user's page with `{"roomName":"document:<id>"}` and `workspace:<id>`.
- Invite tokens come from `lipi_workspace_invites` (read only); open `/invite/<token>` in the invitee's session, then open the document URL.
