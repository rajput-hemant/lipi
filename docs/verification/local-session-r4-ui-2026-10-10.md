# Local verification session R4-UI, 2026-10-10

Branch `task/r4-ui`, base `feat/complete-lipi` at `71b665e`. Next.js 16.3.6 (Turbopack dev and production `next start`), Bun 1.4.3, Node 22. Every Next and test process ran with an explicit private environment prefix isolating `DATABASE_URL` to the task container.

## Environment

- Private Postgres container `lipi-r4ui-pg` (`postgres:18.6-alpine`) on `127.0.0.1:55452`; `bun run db:setup` ran auth migrations, 15 Lipi migrations and initial seed.
- Seed extended to 31 active pages (including a 130-char title document and nested pages) plus 2 trashed pages.
- Ports: private DB on 55452, dev server on 3112, realtime server on 1252, production `next start` on 3112.
- Browser: `chrome-devtools-axi` named session `task-r4-ui`.
- Shared ports (5432, 3100, 6379) and containers (`sv-pg-20261007`, `local-platforms-redis`, etc.) were not touched.

## 1. F-UI-10 live design checks on DB-backed pages: verified-pass

Tested in `next dev` on port 3112:

- **Desktop (1200px)**: Evaluated document dimensions; `innerWidth === scrollWidth === clientWidth === 1200px`. Zero horizontal overflow. Document page rendered with title textarea, icons, content block, cover popover, and exactly one `h1` heading (`<h1>Welcome</h1>`).
- **Mobile (375px emulated)**: Viewport emulated as `375x667x2,mobile,touch`. `innerWidth === scrollWidth === clientWidth === 375px`. Desktop sidebar is hidden; clicking `Toggle Sidebar` opens the mobile drawer dialog with the full 30-page tree without horizontal overflow (`scrollWidth === 375px`).
- **Dark and Light themes**: Toggled through the header theme menu. Dark mode activated `html.dark` class and `color-scheme: dark`. Both themes rendered with proper contrast and styling.
- **Sidebar tree with 30 pages**: All 31 active pages displayed in the hierarchical tree with expand/collapse arrows and icons. No duplicate key warnings in the console or dev overlay.
- **Trash dialog**: Opened from sidebar nav item. Lists both seeded trashed pages ("Old Archived Notes (In Trash)", "Deprecated Proposal (In Trash)") with "Restore" and "Delete ... permanently" action buttons.
- **Settings dialog**: Opened from sidebar nav item. Displayed General (Name, Logo URL, Upload button), Members (collaborators list, invite form with role select), and Danger Zone. Saved Logo URL `https://example.com/logo.png`, verified "Workspace updated" toast, and persisted logo in the workspace.

## 2. Collapsed-sidebar checks: verified-pass

Tested in Chromium (`chrome-devtools-axi`):

- **Width transition**: Triggered collapse from desktop expanded state. Measured `sidebar-gap` and `sidebar-container` width every 20 ms. CSS `transitionDuration` is `0.2s` (`ease-linear`). Recorded smooth frame widths: 239px -> 223px -> 206px -> 189px -> 156px -> 139px -> 123px -> 106px -> 89px -> 56px (settled at 56px).
- **Collapsed-rail anchor**: `SidebarRail` button (`[data-sidebar="rail"]`) has width 16px anchored over the 56px boundary (x=47, right=63, container width 56px). Cursor computes to `e-resize` in collapsed state.
- **Long page titles**: Opened the "Open pages" popover from the collapsed rail (`[aria-label="Open pages"]`). The 130-character page title ("Engineering Architecture Deep Dive: A Comprehensive Study of Distributed Realtime Collaboration and Scaling Limits Long Title 130") rendered with ellipsis truncation, width 272px inside the 288px (`w-72`) popover container. Popover `scrollWidth === 288px` with zero horizontal overflow.

## 3. Search in a production build: verified-pass

Tested against a production build (`bun run build` + `bunx next start --port 3112`):

- **Build**: `bun run build` completed exit 0 with all routes prerendered / partial prerendered.
- **Query**: Opened search dialog (`Cmd+K` / search button). Input filtered document results live as queries were typed.
- **Keyboard selection**: ArrowDown navigated down the result list, updating item highlight (`data-highlighted=""` and accent styling). Pressing Enter selected the highlighted document, closed the dialog, and routed directly to `/dashboard/<workspaceId>/<documentId>`, correctly updating the selected tree item and document header.
- **Cross-workspace isolation**: Created a second workspace (`d0000000-0000-4000-8000-000000000002`) containing a confidential document with the unique token `XenonSecretWord99`. Searching `XenonSecretWord99` from the first workspace returned `No pages match “XenonSecretWord99”.` and 0 results. No cross-workspace exposure.

## 4. Uploads without credentials: verified-pass

Tested against `/api/uploadthing`:

- **Unauthenticated rejection**: `POST /api/uploadthing?actionType=upload&slug=documentImage` without a session cookie returned `HTTP/1.1 403 Forbidden` with body `{"message":"Unauthorized"}`.
- **Viewer role rejection**: `POST /api/uploadthing?actionType=upload&slug=documentImage` and `slug=workspaceLogo` with a signed session for a user with `viewer` role returned `HTTP/1.1 403 Forbidden` with body `{"message":"Forbidden: insufficient workspace permissions"}`. Non-member session also returned `403 Forbidden`.
- **URL-based cover and logo**: Workspace logo URL successfully saved and persisted via Settings dialog. Document cover popover provides preset gradients and "None"; the document UI does not provide a custom URL cover input.
- **Binary upload**: Unverifiable without UploadThing credentials (`UPLOADTHING_TOKEN`). Owner upload passes middleware authentication and permission checks, reaching the missing-token stage: `500` with `{"message":"Missing token. Please set the UPLOADTHING_TOKEN environment variable or provide a token manually through config."}`.

## Screenshots

The following screenshots were captured during the verification session (all under 200 KB):

- `docs/verification/img/desktop-light-doc.png` (148 KB) - Desktop light theme document view with 30-page tree.
- `docs/verification/img/desktop-dark-doc.png` (149 KB) - Desktop dark theme document view.
- `docs/verification/img/mobile-375-dark-doc.png` (66 KB) - Mobile 375px viewport view.
- `docs/verification/img/collapsed-rail-popover.png` (76 KB) - Collapsed rail "Open pages" popover with truncated 130-char title.
- `docs/verification/img/prod-search-selected.png` (110 KB) - Production build document navigated via keyboard search.

## Not verified

- Binary upload delivery to UploadThing storage (no `UPLOADTHING_TOKEN` available).
- Live Stripe billing and Resend email delivery (no external service credentials).
- Safari and Firefox browser rendering (Chromium only, Safari/Firefox out of scope per brief).

## Cleanup

The dev server, production `next start`, realtime process, and `chrome-devtools-axi` browser session were all stopped. Private Postgres container `lipi-r4ui-pg` was stopped and removed. Ports 55452, 3112, 1252 and 9224 are free.
