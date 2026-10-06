# Production build browser session S3 (2026-10-06)

Worker s3-production-build. Branch `task/s3-production-build` from `feat/complete-lipi`. Bun 1.4.2, Node 22.13.1, Next.js 16.3.6 (Turbopack), headless Chrome 154 through `chrome-devtools-axi` (session `s3`). Private PostgreSQL 18.6 container on 127.0.0.1:55447 with `pg_trgm`, `db:setup` applied (auth, migrations, seed). Production server on port 3103 (`bun run start -- -p 3103`), realtime server (Node) on port 1246 with `NEXT_PUBLIC_LIPI_REALTIME_URL=ws://localhost:1246` baked into the build, `NEXT_PUBLIC_APP_URL=http://localhost:3103`. Throwaway env values only; no secrets recorded here. Seeded local user signed in through the auth API with the credentials from the fixture file. Stripe, UploadThing delivery, OAuth, real email, Safari, Firefox and physical keyboards were not attempted (no credentials or hardware).

## Memory (largest RSS sampled once per second)

| Phase                                                      | PID   | Command                                                                    | Peak RSS |
| ---------------------------------------------------------- | ----- | -------------------------------------------------------------------------- | -------- |
| `bun run build` (NODE_OPTIONS `--max-old-space-size=3072`) | 51954 | `next-build (v16.3.6)`                                                     | 1.05 GB  |
| rebuild after the contrast fix                             | 77753 | `node .../typescript/bin/tsc --project ...` (TypeScript step of the build) | 0.71 GB  |
| `next start` while browsing                                | 53148 | `next-server (v16.3.6)`                                                    | 0.20 GB  |
| realtime server                                            | 53143 | `node realtime/bootstrap.mjs`                                              | 0.08 GB  |

No process grew past 1.1 GB; the 20 GB bun process was not reproduced.

## Verdicts

| Item                                                                         | Verdict                                                                     |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Production build under Bun 1.4.2 (F-OPS-3)                                   | verified-pass                                                               |
| Credentials and reset links not logged in production (F-OPS-3)               | verified-pass                                                               |
| Lobby, legal pages, robots, sitemap, manifest                                | verified-pass                                                               |
| 404 returns HTTP 404 (F-COR-8)                                               | verified-pass signed in; signed out is a 307 (see notes)                    |
| Mobile menu opened state, focus order, skip link                             | verified-pass                                                               |
| Error boundary (workspace)                                                   | verified-pass, with a P3 finding                                            |
| Production search, keyboard selection                                        | verified-pass                                                               |
| Lobby contrast (found by Lighthouse)                                         | verified-FAIL, fixed in `ea3a36f`                                           |
| CSP report-only sweep (F-SEC-2)                                              | verified-pass, findings below                                               |
| Bundle and Core Web Vitals (F-PERF-9)                                        | verified-pass, numbers below                                                |
| License check (F-DEP-7)                                                      | verified-pass, nothing non-permissive in the app's own use; notes below     |
| Cross-workspace search exposure                                              | could-not-verify (single user session)                                      |
| Root error boundary (`app/error.tsx`) and `/_not-found` for signed-out users | could-not-verify (no way to force a root render error without editing code) |

## Production build and credential logging (F-OPS-3)

1. `bun run build` with the worktree `.env.local` (dummy OAuth ids, loopback database): exit 0 in about 13 s, full route table, no SIGILL, under Bun 1.4.2.
2. `grep -rIl "LocalDev123\|Local development credentials" .next` returned nothing.
3. `next start` log after boot: no credentials banner. `POST /api/auth/request-password-reset` for the seeded email returned 200 with the generic message; the server log contains `RESEND_API_KEY is not configured` (a Better Auth background-task error) and no reset URL or token (`grep -c "reset-password\|token="` on the log: 0). Neither the seeded email nor the password appear in the server or realtime logs.
4. Note: because there is no Resend key the reset email is not sent at all in production mode, and the link is not available to the developer. That matches the intended development-only gate.

Verdict: verified-pass.

## Public routes and 404 (F-COR-8)

`curl -i` against the production server:

| Route                                                                          | Status                                                                      | Notes                                                         |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `/`, `/pricing`, `/terms`, `/privacy`, `/login`, `/signup`, `/forgot-password` | 200                                                                         | titles correct in the browser                                 |
| `/robots.txt`                                                                  | 200 `text/plain`                                                            | allows `/`, disallows `/api/` and `/dashboard/`, sitemap line |
| `/sitemap.xml`                                                                 | 200 `application/xml`                                                       | lists `/`, `/pricing`, `/privacy`, `/terms`                   |
| `/manifest.webmanifest`                                                        | 200 `application/manifest+json`                                             | name, icons 192 and 512, standalone                           |
| `/this-is-missing.png` (signed out)                                            | 404                                                                         |                                                               |
| `/nope` signed in                                                              | 404, body "Page not found" with Back to Home and Dashboard links, `noindex` |                                                               |
| `/nope` signed out                                                             | 307 to `/login?from=%2Fnope`                                                | not a 404                                                     |

Notes:

- The sitemap and robots files hard-code `https://lipi.rajputhemant.me`, not `NEXT_PUBLIC_APP_URL`; harmless for the real deployment, but a self-hosted or preview deployment advertises the wrong host.
- Signed-out users never see a 404 for an unknown path: `proxy.ts` treats everything outside `publicRoutes` as protected and redirects. This is a design consequence, not a defect; the 404 status itself is correct once a session exists. The dev-server 200 from the original report does not reproduce in production.
- A nonexistent workspace id (`/dashboard/00000000-0000-4000-8000-000000000000`, signed in) returns HTTP 200, the "Failed to load workspace" error boundary with a digest, a React error #441 in the console, and a `MutationAuthError: Workspace not found` (code INVALID) in the server log. A not-found response would be more accurate (P3, not fixed: the throw site is shared with other flows and needs a product decision). Repro: sign in, open the URL above.

## Lobby UI

- Mobile (390 px): `Open navigation menu` opens a menu; focus moves into the menu, ArrowDown focuses the first item, Escape returns focus to the trigger. The first Tab on a fresh load focuses the `Skip to content` link. Verdict: verified-pass.
- Lighthouse (desktop, lobby, before the fix): Accessibility 96, Best Practices 100, SEO 100. One failure, `color-contrast`: `text-muted-foreground` (#71717b) on the `bg-muted` panel (#f4f4f5) is 4.39:1 against the required 4.5:1 for the tech stack paragraph (`app/(lobby)/components/tech-stack.tsx:65`), the open source paragraph and its link (`open-source.tsx:17`) and the `⌘K` keyboard hint (`features.tsx:135`). verified-FAIL.
- Fix `ea3a36f`: foreground text on those three elements, with `lobby-contrast.test.tsx` (fails on the old source, passes on the new). After rebuilding, Lighthouse reports Accessibility 100 with 0 failed audits.

## Production search

On the production build with the migrated database (including trigram indexes): `Ctrl+K` opens the dialog; `welcome` returns the page by title; `safe to edit` finds the same page through body text; `zzzqqq`, `50%` and `_` return "No pages match" (wildcards are literal); ArrowDown then Enter navigated to the Scratchpad page. Observation: closing the dialog with Escape and reopening it keeps the previous query text (the input value was still the old string). Not changed. Verdict: verified-pass.

## Realtime in the production build

Editing the seeded page in the browser (realtime server on 1246) saved: `lipi_realtime_documents` has a state row and `lipi_documents.content` contains the typed text. No CSP violation for `ws://localhost:1246`.

## Content-Security-Policy-Report-Only sweep (F-SEC-2)

Header observed on `/` and on dashboard routes: `connect-src` includes `ws://localhost:1246` (the build-time value). Detector sanity check: an image from `https://example.com` produced the expected `[info] ... violates ... img-src ... report-only` console line and a `securitypolicyviolation` event, so absence of messages below is meaningful.

Pages visited, with the browser console and network checked on each: `/`, `/pricing`, `/terms`, `/privacy`, `/login`, `/signup`, `/forgot-password`, `/reset-password?token=x`, `/dashboard` (workspace home), a document page (editor, realtime connected), the 404 page, the workspace error boundary, the search dialog, and the lobby mobile menu. A GitHub avatar (`https://avatars.githubusercontent.com/u/1`) rendered in the sidebar.

| Violation                                            | Where                                                                                                                                                                   | Directive                         | Blocked URI                                                                                                             | Would break if enforced?                                                                                                                                                                                                                                                |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evaluating a string as JavaScript (`kEvalViolation`) | every page that loads the Zod client chunk: `/login`, `/signup`, `/forgot-password`, `/reset-password`, the 404 page (signed in or out), the editor and dashboard pages | `script-src` (no `'unsafe-eval'`) | `eval`                                                                                                                  | No. It is Zod 4.6.5's `allowsEval` probe (`new Function("")` inside `try/catch`, `node_modules/zod/v4/core/util.js:218`); on a throw Zod falls back to its non-JIT parsers. It can be silenced with `z.config({ jitless: true })` on the client.                        |
| Custom document banner image from an arbitrary host  | a document whose `banner_url` is `https://images.unsplash.com/...` (set in the database; presets and UploadThing urls are on the allow list)                            | `img-src`                         | `https://images.unsplash.com/s3-bg.jpg` (confirmed through a `securitypolicyviolation` event with disposition `report`) | Yes for any banner or logo URL outside `lh3.googleusercontent.com`, `avatars.githubusercontent.com`, `utfs.io`, `*.ufs.sh`, `uploadthing.com`, `*.uploadthing.com`. The page-load request itself was not reported in the console list, only the programmatic probe was. |

Other observations:

- No violation for `script-src` inline scripts (allowed by `'unsafe-inline'`), `style-src`, `font-src`, `worker-src`, `frame-ancestors`, `base-uri` or `form-action` on any visited page.
- `https://va.vercel-scripts.com`, `https://vitals.vercel-insights.com`, `js.stripe.com`, `api.stripe.com` and `hooks.stripe.com` were never requested. `@vercel/analytics` produced no request on localhost (`/_vercel/insights/script.js` is same-origin and returns 404 here); its behaviour on Vercel is not verified. `@stripe/stripe-js` is not a dependency and checkout is `window.location.assign(payload.url)` (`lib/billing/checkout-client.ts:15`), so the Stripe script, frame and connect sources look unused; navigation is not governed by these directives.
- Directives that would break first if enforced: `img-src` for user supplied image URLs outside the allow list; `connect-src` for a realtime host that differs from the build-time `NEXT_PUBLIC_LIPI_REALTIME_URL` (the app and realtime URL must be set before `bun run build`); `script-src` for the `eval` probe is harmless. Nothing else broke in the sweep. Not exercised: UploadThing upload and `utfs.io`/`*.ufs.sh` display, Stripe redirect, OAuth round trip, Google avatars (host reached no real image in this offline-style run), Safari and Firefox.
- The policy was not changed.

## Bundle and Core Web Vitals (F-PERF-9)

Lab numbers on localhost, no throttling, headless Chrome 154, one run each:

| Page                              | LCP    | LCP breakdown                                                        | CLS  | JS loaded (raw / gzip)     |
| --------------------------------- | ------ | -------------------------------------------------------------------- | ---- | -------------------------- |
| Lobby `/`                         | 635 ms | TTFB 4 ms, load delay 4 ms, load duration 12 ms, render delay 614 ms | 0.01 | 23 files, 1255 KB / 364 KB |
| Document page (editor, signed in) | 365 ms | TTFB 5 ms, render delay 360 ms                                       | 0.01 | 33 files, 2645 KB / 788 KB |

INP was not measured (no interaction in the trace); CrUX has no field data. The lobby render delay is large relative to the load time, which points at the hero entry animation or font swap rather than the network. gzip sizes are `gzip -6` over the files under `.next/static` that each page requested. Lighthouse after the fix: Accessibility 100, Best Practices 100, SEO 100.

## License check (F-DEP-7)

`bunx license-checker --start <worktree> --production --summary` (run from `/tmp`, nothing installed into the repo): MIT 476, ISC 24, Apache-2.0 16, BSD-3-Clause 8, BSD-2-Clause 7, MPL-2.0 5, Unlicense 2, BlueOak-1.0.0 2, and one each of LGPL-3.0-or-later, Python-2.0, CC-BY-4.0, MIT-0, 0BSD, (MIT OR CC0-1.0) and UNLICENSED.

Non-permissive or unusual entries:

- MPL-2.0 (weak, file-level copyleft): `@blocknote/core`, `@blocknote/react`, `@blocknote/shadcn` 0.55.0, `lightningcss` 1.33.0 (and its darwin binary). Using them unmodified is fine; modifications to those files must be published under MPL.
- LGPL-3.0-or-later: `@img/sharp-libvips-darwin-arm64` 1.3.4 (prebuilt libvips binary used by `sharp`, a Next.js image optimizer dependency; dynamically loaded, not bundled into app code). Review only if the Docker image ships it.
- CC-BY-4.0: `caniuse-lite` (data, needs attribution). Python-2.0: `argparse` 2.0.1 (permissive PSF-style).
- UNLICENSED: the app itself (`lipi@0.1.0`): `package.json` has no `license` field although the repo has an MIT `LICENSE` file. Adding `"license": "MIT"` is a `package.json` change and was not made (out of scope).
- No GPL, AGPL or commercial-only package is in the production tree (the `@blocknote/xl-*` packages are not installed). The scan covers the installed tree on this machine (macOS arm64 binaries), a transitive inventory only, not legal advice.

## Commits

- `ea3a36f` fix(ui): use foreground text on lobby muted panels for AA contrast

## Not attempted

Stripe checkout and portal, UploadThing upload and delivery, OAuth round trip, real email delivery, Safari and Firefox, physical `Shift+F10` and ContextMenu keys, cross-workspace search with a second user, forcing the root `app/error.tsx` boundary.

## Cleanup

Container `lipi-s3-pg` removed, production server and realtime server stopped, browser session `s3` stopped. Ports 3103, 1246 and 55447 are free.
