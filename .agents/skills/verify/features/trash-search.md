# Trash and search

Status: PARTIAL live proof (trash, restore, permanent delete with cancel, empty state; search with keyboard selection, cross-workspace isolation and trashed-page exclusion). Last live proof: 2026-10-10 @ 37e892b, production build, evidence [local-session-r4-vskill-2026-10-10.md](../../../../docs/verification/local-session-r4-vskill-2026-10-10.md) (trash move/restore and search exclusion); search dialog and keyboard selection also in [local-session-r4-ui-2026-10-10.md](../../../../docs/verification/local-session-r4-ui-2026-10-10.md); earlier 2026-10-02 commit `815ceda`, evidence `lipi-browser-verification/evidence/trash-search/` (private task data dir, not in the repo). The earlier empty search list was an accessibility-snapshot artifact (LIP-V020, fixed): results render, but `snapshot` does not list them.

Soft-delete and restore (`components/trash.tsx`, `lib/db/document-operations.ts`) and the ⌘K workspace search (`components/search-command.tsx`, `lib/db/actions/search.ts`).

## Sub-features

- [x] Move a page (and descendants) to trash from the tree; it disappears from the sidebar. - live: context menu `Move to trash`, toast `Moved to trash.`, sidebar shows `No pages yet.`; descendants NOT exercised.
- [x] Trash panel lists it; `Restore <title>` brings it back, restoring ancestors as needed. - live: `Restore <title>` clears the trash and `lipi_documents.in_trash` goes true to false; ancestors case NOT exercised.
- [x] `Delete <title> permanently` shows a confirmation and removes the row; viewers cannot. - live: `Delete permanently?` alertdialog; `Cancel` keeps the row, confirm removes it (row count 1 to 0), toast `Page deleted permanently.`; viewer denial NOT exercised.
- [x] Empty trash state copy and responsive dialog. - live: `Nothing in the trash` plus `Pages you delete will appear here.`; responsive layout NOT exercised.
- [x] ⌘K / Ctrl+K opens search (`Search documents`, `title="Search (⌘K)"`), placeholder `Type to search pages or body text...`, debounced results, keyboard select. - live (r4-ui doc): typing filters, ArrowDown highlights, Enter navigates to `/dashboard/<ws>/<doc>`; here `Meta+k` opened the dialog and `fill` on the combobox returned both matching pages (read from the dialog DOM text).
- [x] Search excludes trashed pages and pages of workspaces the user cannot read. - live: after `Move to trash` on `Alpha` (toast `Moved to trash.`, `in_trash` true), searching the shared body text listed only `Beta`; `Restore Alpha` set `in_trash` back to false; another workspace's token returned `No pages match “...”.` (r4-ui doc). Viewer search NOT exercised.

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
- Zero-result copy is `No pages match “<query>”.`; search failure copy is `Failed to search documents. Please try again.`.
- The search results are not in the accessibility snapshot; read `[role=dialog]` `innerText`.
- Unit tests: `components/trash.test.tsx`, `components/search-command.test.tsx`.
