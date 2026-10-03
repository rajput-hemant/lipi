# Realtime collaboration and presence

Status: PARTIAL live proof (two-user live edit, presence label, viewer read-only). Last live proof: 2026-10-02, commit `815ceda`, evidence `lipi-browser-verification/evidence/realtime-collaboration/` (private task data dir, not in the repo).
Ledger: [verification-issues.md](../../../../docs/verification/verification-issues.md) (this file lists IDs only).
Related ledger IDs: LIP-V009, LIP-V016

Hocuspocus 4.7 + Yjs server (`realtime/server.ts`, `realtime/bootstrap.mjs`, `lib/realtime/*`) with signed 60 s room tokens from `/api/realtime/token`, presence (`Page collaborators`), viewer read-only enforcement. See [docs/guides/realtime.md](../../../../docs/guides/realtime.md).

## Sub-features

- [x] Two or three users in different contexts on the same page see edits appear live. - live: two isolated sessions; A's text appeared for B and B's for A; both persisted in `lipi_documents`. Third user NOT exercised.
- [ ] Presence list `Page collaborators` shows 2+ items; awareness cursor/name is server-rewritten.
- [x] Viewer gets `View only` and cannot type; typed text does not appear for others. - live: after A set B to Viewer, B saw `View only`; typing `SHOULD NOT SAVE` neither reached A nor the database.
- [ ] Token refresh keeps the session alive past 60 s.
- [ ] Revoked member or deleted page disconnects/denies.
- [ ] Reconnect after the realtime server restarts (`Reconnecting to collaborators...` then recovery).
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
