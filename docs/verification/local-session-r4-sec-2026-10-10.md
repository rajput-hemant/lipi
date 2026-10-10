# Local verification session R4-SEC, 2026-10-10

Branch `task/r4-sec`, base `feat/complete-lipi` at `71b665e`. Next.js 16.3.6 production build (`bun run build`, `next start`), realtime `node realtime/bootstrap.mjs` (the Node on `PATH` was 24.x here, not 22), browser `chrome-devtools-axi` with named sessions `r4-sec-a`, `r4-sec-b`, `r4-sec-c`, `r4-sec-anon`. Every Next, realtime and db process was started with `env -i` and an explicit `DATABASE_URL`.

## Environment

- Private Postgres container `lipi-r4sec-pg` (`postgres:18.6-alpine`, tmpfs) on `127.0.0.1:55453`; `bun run db:setup` applied the auth schema, the Lipi migrations and the seed.
- App on `127.0.0.1:3113` with `NEXT_PUBLIC_LIPI_REALTIME_URL=ws://127.0.0.1:1253`, realtime on `1253`. Stripe, UploadThing, OAuth and Resend credentials were not set.
- Users were created through the real sign-up form (`r4-a`, `r4-b`, `r4-c` at `example.com`). Two test setup writes went straight to the disposable database: `user.image` for `r4-a` (GitHub avatar URL) and `r4-c` (Google avatar URL), because OAuth is not available. Invite tokens were read from `lipi_workspace_invites` (the documented out-of-band channel).
- Build 1 had the committed report-only header. Build 2 was an experiment: the same policy with the header name switched to `Content-Security-Policy` in `next.config.ts`; that edit was reverted with `git checkout` and is not committed. Part B ran on build 2.

## Part A: CSP sweep (F-SEC-2)

`curl -I http://127.0.0.1:3113/` on build 1 returned `Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://va.vercel-scripts.com; ... connect-src 'self' ... ws://127.0.0.1:1253; ...` (the realtime origin is baked from the build env). On build 2 the same text came back under `Content-Security-Policy`.

### Violations on build 1 (report-only), one fresh page load per row

| Route                                               | Session   | Violated directive | Blocked URI / source                                                                        |
| :-------------------------------------------------- | :-------- | :----------------- | :------------------------------------------------------------------------------------------ |
| `/`                                                 | anon      | none               | -                                                                                           |
| `/pricing`, `/terms`, `/privacy`, `/reset-password` | anon      | none               | -                                                                                           |
| `/login`                                            | anon      | `script-src`       | `eval` (`Function("")` capability probe in the Zod client chunk, `chunks/0ecgdhii0i161.js`) |
| `/signup`, `/forgot-password`                       | anon      | `script-src`       | same `eval` probe                                                                           |
| `/dashboard`, `/dashboard/<ws>`                     | signed in | `script-src`       | same `eval` probe                                                                           |
| `/dashboard/<ws>/<doc>` (editor, realtime `ws://`)  | signed in | `script-src`       | same `eval` probe; no `connect-src` violation, editor synced                                |
| `/dashboard/change-password`                        | signed in | `script-src`       | same `eval` probe                                                                           |
| Settings dialog (the billing page is `/pricing`)    | signed in | none new           | -                                                                                           |
| Settings, `Choose emoji` (emoji picker)             | signed in | `img-src`          | `https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f60a.png`, 130 images    |
| Avatar image (GitHub URL), sidebar                  | signed in | none               | rendered, `naturalWidth` 460                                                                |

Notes: the Zod probe is wrapped in `try`, Zod falls back to non-JIT parsing, and `z.config({ jitless: true })` would silence it (earlier finding in `docs/TODO.md`, F-SEC-2). No Stripe, Vercel analytics or UploadThing host was requested by any page. `Upload logo` in Settings was clicked and produced no violation, but no file was sent.

### Fix and enforcing run

- Legitimate source found: the emoji picker loads its images from `cdn.jsdelivr.net`. Added the narrowest `img-src` source, the path prefix `https://cdn.jsdelivr.net/npm/emoji-datasource-apple/`, in `lib/security/csp.ts` with a test line in `lib/security/csp.test.ts`.
- Build 2 (enforcing header, emoji source added), full pass again:
  - Editor page: only the Zod `eval` probe, now blocked (`Content-Security-Policy ... blocks the use of eval (count: 1)`); the editor loaded, typing synced over `ws://127.0.0.1:1253`, and the text was still there after a reload.
  - Emoji picker: 65 of 65 jsdelivr images complete with `naturalWidth` > 0, no violation message.
  - Sign-up of two more users succeeded and landed on `/dashboard/new-workspace`, so the blocked Zod probe does not break form validation.
  - Google avatar (`lh3.googleusercontent.com`) rendered (`naturalWidth` 96); GitHub avatar rendered.
  - Signed-in `Go Pro`: `POST /api/stripe/checkout` returned 503 (no credentials), page stayed on `/pricing`.
  - The Part B checks below all ran under the enforcing header.
- Decision: the committed header stays report-only. The brief allows enforcing only with zero violations, and one remains (the Zod probe). It is harmless and the app works under enforcement, but silencing it needs either `z.config({ jitless: true })` in a client module (outside this task's file set) or `'unsafe-eval'` in `script-src` (not acceptable for an enforcing policy). Owner decision: add `jitless`, then switch `next.config.ts` to `Content-Security-Policy`.
- The committed change (emoji source) was not re-built under the report-only header; the policy text is identical to build 2 apart from the header name.

### Not exercised

UploadThing delivery (`utfs.io`, `*.ufs.sh`), Stripe redirect and portal, Vercel analytics, Safari and Firefox, a real OAuth sign-in, wss behind TLS (only `ws://127.0.0.1`).

## Part B: realtime, three users

Users: A owner, B editor, C viewer, all on the page `Shared Doc` (workspace `R4 Workspace`), one browser session each. B and C were invited through the settings form and accepted at `/invite/<token>`.

| Check                            | Result | Evidence                                                                                                                                                                                                                                                                                                                                   |
| :------------------------------- | :----- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Presence list                    | pass   | `[aria-label="Page collaborators"]` had 2 children in every session; titles `r4-b`, `r4-c` for A; `r4-c`, `r4-a` for B; `r4-b`, `r4-a` for C                                                                                                                                                                                               |
| Edit sync (three users)          | pass   | B typed `[B-wrote]`: visible in A and C within 3 s. A typed `[A-wrote]`: visible in B and C. The owner's first text is in `lipi_documents.content`                                                                                                                                                                                         |
| Viewer cannot write              | pass   | C saw `View only`; typing ` [C-viewer-attempt]` appeared nowhere and `lipi_documents.content like '%C-viewer%'` was `f`                                                                                                                                                                                                                    |
| Token refresh after 60 s         | pass   | A `fetch` wrapper in B logged `/api/realtime/token` at page time 270, 270, 300, 300, 330, 330 s (two rooms, every 30 s); B's edit made more than 3 minutes after load (`[B-after-70s]`) reached A and C. `chrome-devtools-axi network` did not list these calls, so the wrapper was used                                                   |
| Reconnect after realtime restart | pass   | Killed the process on 1253: A and B showed `Reconnecting to collaborators...` within 6 s. After restart the banner cleared on its own, presence was 2 again, and B's next edit (`[B-after-restart]`) reached A and C with no reload. Text typed in B while down did not appear anywhere (editor not editable): offline queueing not proven |
| Revoked member loses access      | pass   | A removed B in Settings. Within 5 s B's open page showed `You no longer have access to this workspace`. `POST /api/realtime/token` from B returned `[403, 403]` for the document and workspace rooms, from C `[200, 200]`. A's collaborator count fell from 2 to 1; `lipi_collaborators` has only C                                        |

Could not verify: a deleted page disconnecting readers, how long an idle socket of a removed editor stays open (the UI unmounted at once), a forged awareness name being rewritten by the server, workspace-room stateless sidebar refresh.

## Findings

1. Starting `next start` or the realtime process with a plain trailing `&` inside a single harness shell call kills it when the call returns; the browser then shows `ERR_CONNECTION_REFUSED` on `/api/auth/sign-up/email` and the form silently does nothing. Run each server as its own backgrounded task.
2. The realtime process ran on Node 24 here (the repo documents Node 22) and worked.

## Cleanup

All four browser sessions stopped, `next start` and realtime killed by port owner, container `lipi-r4sec-pg` removed; ports 3113, 1253 and 55453 are free. Containers `sv-pg-20261007`, `local-platforms-redis` and the repo's own stack were not touched. The `next.config.ts` experiment was reverted.

## Enforcing CSP follow-up (branch `task/r4-csp2`)

- Zod's `Function("")` probe: `z.config({ jitless: true })` (Zod 4.6.5 skips the probe when `jitless` is set) now runs at module load in `components/providers.tsx`, the client module the root layout renders on every route, with a unit test (`components/providers.test.tsx`).
- The header is now the enforcing `Content-Security-Policy` (`CSP_HEADER` in `lib/security/csp.ts`, used by `next.config.ts`). `curl -I` on the production build returned the same policy text under that name.
- Production build (`bun run build`, `next start` on `127.0.0.1:3118`, realtime `node realtime/bootstrap.mjs` on `1258`, private Postgres on `55458`, browser session `r4-csp2`). Zero CSP console messages per route on fresh page loads: `/`, `/login`, `/signup`, `/pricing` (the billing surface), `/dashboard/new-workspace`, `/dashboard/<ws>`, `/dashboard/<ws>/<doc>`, `/dashboard/change-password`, and the Settings dialog. Only unrelated Chrome issue notes appeared (lazy image dimensions, label/autocomplete hints).
- Emoji picker (new-workspace form and Settings dialog): 65 of 65 jsdelivr images loaded, no violation. GitHub avatar rendered (`naturalWidth` 460). Sign-up through the form succeeded with the eval probe gone, so validation still works jitless.
- Editor: typed text into the document, reload showed it persisted, four established connections to the realtime port, no `connect-src` violation.
- Not covered: Stripe, UploadThing, OAuth, Resend and Vercel analytics hosts (no credentials, nothing requested); Google avatar host was not re-run.
