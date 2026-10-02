# Trash and search

Status: DRAFT, not live-verified. Last live proof: none.
Ledger: [verification-issues.md](../../../../docs/checks/verification-issues.md) (this file lists IDs only).
Related ledger IDs: LIP-V010

Soft-delete and restore (`components/trash.tsx`, `lib/db/document-operations.ts`) and the ⌘K workspace search (`components/search-command.tsx`, `lib/db/queries/search.ts`).

## Sub-features

- [ ] Move a page (and descendants) to trash from the tree; it disappears from the sidebar.
- [ ] Trash panel lists it; `Restore <title>` brings it back, restoring ancestors as needed.
- [ ] `Delete <title> permanently` shows a confirmation and removes the row; viewers cannot.
- [ ] Empty trash state copy and responsive dialog.
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
