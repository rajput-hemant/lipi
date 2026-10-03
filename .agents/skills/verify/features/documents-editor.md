# Documents, page tree and editor

Status: PARTIAL live proof (create page, edit, persistence, not-found page). Last live proof: 2026-10-02, commit `815ceda`, evidence `lipi-browser-verification/evidence/documents-editor/` (private task data dir, not in the repo).
Ledger: [verification-issues.md](../../../../docs/verification/verification-issues.md) (this file lists IDs only).
Related ledger IDs: LIP-V009, LIP-V010, LIP-V013

Nested pages in the sidebar tree and the BlockNote editor (`components/sidebar/`, `components/document-editor/`, `lib/db/documents-tree.ts`, route `app/dashboard/(workspaces)/[workspaceId]/[fileId]/page.tsx`).

## Sub-features

- [ ] New root page (`New page`, type a title, Enter, toast `Page created.`), subpage via context menu `New subpage`.
- [x] Open page; editor loads (`.bn-editor`) after `Syncing page...` clears; type text; reload and confirm persistence. - live: typed text appears in `.bn-editor`, is stored in `lipi_documents.content`, and is still there after a full reload.
- [ ] Breadcrumb, page icon (`Choose page icon`), cover presets, title editing.
- [ ] Rename, reorder/move, expand/collapse tree items.
- [ ] Alert/callout, checklist, code and list blocks.
- [ ] Block quota (Free: 500 blocks).
- [x] Not-found document page (`Document not found`). - live: after permanent delete, the page URL shows `Document not found` with a `Dashboard` link.
- [ ] Mobile sidebar (`Open navigation menu`).

## How to get to it (user POV)

Workspace dashboard, sidebar `Workspace pages` tree.

## Driving it with the browser skill (pending)

1. Signed-in owner in a workspace: click `New page`, fill the inline input in the `tree`, Enter.
2. Right-click the page link, `New subpage`, name it, Enter.
3. Open the child link, click `.bn-editor`, type a unique phrase; reload and expect it still present.
4. Evidence: `lipi_documents` rows (parent id, in_trash false) and `lipi_realtime_documents.state` non-empty; `realtime.log` has no errors; browser console clean.
5. Bad id: open `/dashboard/<ws>/00000000-0000-0000-0000-000000000000`; expect the not-found view.

## Gotchas

- Editing needs the realtime server running; otherwise the editor never becomes ready.
- The sidebar link href is the stable way to open a page (the e2e helper reads it).
- Prior e2e proof exists in `tests/e2e/documents-editor.spec.ts` (not re-run here).
