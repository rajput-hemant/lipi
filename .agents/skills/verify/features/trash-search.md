# Trash and search

Status: PARTIAL live proof (trash, restore, permanent delete with cancel, empty state). Search returned no results or empty-state copy in the browser, LIP-V020. Last live proof: 2026-10-02, commit `815ceda`, evidence `lipi-browser-verification/evidence/trash-search/` (private task data dir, not in the repo).
Ledger: [verification-issues.md](../../../../docs/verification/verification-issues.md) (this file lists IDs only).
Related ledger IDs: LIP-V010

Soft-delete and restore (`components/trash.tsx`, `lib/db/document-operations.ts`) and the ⌘K workspace search (`components/search-command.tsx`, `lib/db/queries/search.ts`).

## Sub-features

- [x] Move a page (and descendants) to trash from the tree; it disappears from the sidebar. - live: context menu `Move to trash`, toast `Moved to trash.`, sidebar shows `No pages yet.`; descendants NOT exercised.
- [x] Trash panel lists it; `Restore <title>` brings it back, restoring ancestors as needed. - live: `Restore <title>` clears the trash and `lipi_documents.in_trash` goes true to false; ancestors case NOT exercised.
- [x] `Delete <title> permanently` shows a confirmation and removes the row; viewers cannot. - live: `Delete permanently?` alertdialog; `Cancel` keeps the row, confirm removes it (row count 1 to 0), toast `Page deleted permanently.`; viewer denial NOT exercised.
- [x] Empty trash state copy and responsive dialog. - live: `Nothing in the trash` plus `Pages you delete will appear here.`; responsive layout NOT exercised.
- [ ] ⌘K / Ctrl+K opens search (`Search documents`, `title="Search (⌘K)"`), placeholder `Type to search pages or body text...`, debounced results, keyboard select.
- [ ] Search excludes trashed pages and pages of workspaces the user cannot read.

## How to get to it (user POV)

Sidebar `Trash` section; header search button or keyboard shortcut.

## Driving it with the browser skill (pending)

1. Create pages `Alpha`, `Beta` with body text `needle-<ts>`.
2. Trash `Alpha`; confirm `lipi_documents.in_trash = true` and sidebar link gone.
3. Open trash; click `Restore Alpha`; sidebar link back; delete `Beta` then `Delete Beta permanently` and confirm the dialog; row gone.
4. Press Ctrl/Cmd+K, type `needle`; expect only non-trashed matches.
5. As a viewer, try the destructive actions; expect denial.

## Gotchas

- Search matches body text, so content must have been persisted first.
- Unit-tested only (`components/trash.test.tsx`, `components/search-command.test.tsx`); no UI proof in this task.
