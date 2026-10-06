# Local Playwright e2e session (S4), 2026-10-06

Worktree branch `task/s4-e2e`, base `feat/complete-lipi`. Command: `NODE_OPTIONS=--max-old-space-size=3072 bun run test:e2e` (Playwright workers=1, Playwright-managed Chromium already installed, Docker container `lipi-p9-e2e-pg` created and removed by the suite's own setup and teardown).

## Ports

Defaults (app 3100, realtime 1235, Postgres 5544) were free at start (`lsof` and `docker ps` checked); no override needed. Only the unrelated `local-platforms-redis` container was running and was not touched.

## Run 1 (baseline, before fixes): 1 passed, 3 failed (51.5s)

| Spec             | Result | Cause                                                                                                                   | Class    |
| :--------------- | :----- | :---------------------------------------------------------------------------------------------------------------------- | :------- |
| auth-workspace   | fail   | `getByRole("paragraph")` for "Pages": the sidebar label is now a `div`                                                  | test bug |
| collaboration    | fail   | `getByRole("link", { name: "Shared Doc" })` matched the sidebar link and the dashboard page card ("Shared Doc Oct ...") | test bug |
| documents-editor | fail   | same strict-mode collision on "Parent Page"                                                                             | test bug |
| stripe-checkout  | pass   | mocked billing API                                                                                                      | -        |

## Fixes (each its own commit, test-only)

1. `0fd4266` auth-workspace: match the label as text.
2. `46384a2` helpers/workspace.ts: `exact: true` on sidebar page link lookups.
3. `8bffd74` auth-workspace: run 2 showed text "Pages" also matches the page heading (`<h2>`), so assert `getByRole("heading", { name: "Pages", exact: true })`.

## Run 3 (after fixes): 4 passed (1.1m)

auth-workspace 2.9s, collaboration 32.3s, documents-editor 11.2s, stripe-checkout 9.4s.

## F-TST-5: new `tests/e2e/roles.spec.ts` (100 lines)

One test with owner, editor, viewer and anonymous contexts:

- owner: settings show "Invite by email" and "Danger zone".
- editor: "New page" button visible, context menu offers "Move to trash"; settings have Members but no invite form, no "Danger zone", no "Transfer ownership".
- viewer: "View only" badge, no "New page" button, no context menu items on a page link, and the same owner-only controls absent.
- anonymous: workspace URL redirects to `/login`.

Stability: first attempt failed on a strict-mode "View only" match (two elements; fixed with `.first()`), then passed twice in a row (34.6s and 32.3s wall, 23.5s test) and once more in the full suite.

Not covered: trash dialog actions (restore/delete) per role, and direct server-action calls by a viewer; the dialog tree and server-side permission checks have unit coverage only.

## Final full suite: 5 passed (1.7m)

auth-workspace 2.4s, collaboration 32.7s, documents-editor 11.8s, roles 31.6s, stripe-checkout 10.3s.

## Memory

Sampled `ps` RSS during runs: no process other than the OrbStack helper (~0.9 GB) exceeded 1 GB at 20-25s sampling; the `next build`/`next start`/realtime processes were not caught above 1 GB. Sampling was coarse, so a short peak is not ruled out.

## Cleanup

`docker ps` after the final run shows only `local-platforms-redis`; no servers or browsers left running.
