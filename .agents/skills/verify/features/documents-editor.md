# Documents, page tree and editor

Status: DRAFT, not live-verified. Last live proof: none.
Ledger: [verification-issues.md](../../../../docs/checks/verification-issues.md) (this file lists IDs only).
Related ledger IDs: LIP-V009, LIP-V010, LIP-V013

Nested pages in the sidebar tree and the BlockNote editor (`components/sidebar/`, `components/document-editor/`, `lib/db/documents-tree.ts`, route `app/dashboard/(workspaces)/[workspaceId]/[fileId]/page.tsx`).

## Sub-features

- [ ] New root page (`New page`, type a title, Enter, toast `Page created.`), subpage via context menu `New subpage`.
- [ ] Open page; editor loads (`.bn-editor`) after `Syncing page...` clears; type text; reload and confirm persistence.
- [ ] Breadcrumb, page icon (`Choose page icon`), cover presets, title editing.
- [ ] Rename, reorder/move, expand/collapse tree items.
- [ ] Alert/callout, checklist, code and list blocks.
- [ ] Block quota (Free: 500 blocks).
- [ ] Not-found document page (`Document not found`).
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
