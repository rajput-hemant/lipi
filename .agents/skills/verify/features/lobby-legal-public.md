# Lobby, legal pages and footer

Status: PARTIAL live proof (home, pricing, terms and privacy render and titles correct, no console errors). Last live proof: 2026-10-10 (branch `task/r4-sec` on `71b665e` (production build, `next start`; enforcing-CSP experiment build), evidence [local-session-r4-sec-2026-10-10.md](../../../../docs/verification/local-session-r4-sec-2026-10-10.md); `/`, `/pricing`, `/terms`, `/privacy`, `/login`, `/signup`, `/forgot-password`, `/reset-password` loaded anonymously on a production build and were checked for console violations only; no sub-feature newly ticked); `/robots.txt`, `/sitemap.xml` and `/manifest.webmanifest` re-driven at `37e892b`, evidence [local-session-r4-vskill-2026-10-10.md](../../../../docs/verification/local-session-r4-vskill-2026-10-10.md). Earlier proof: 2026-10-02, commit `815ceda`, evidence `lipi-browser-verification/evidence/lobby-legal-public/` (private task data dir, not in the repo).

Public marketing site: `/` (hero, features, tech stack, testimonials, open source), `/pricing`, `/terms`, `/privacy`, 404/error pages, footer links, theme toggle, robots/sitemap/manifest.

## Sub-features

- [ ] `/` renders sections, nav links; the footer (not the navbar) holds the theme buttons `Toggle Light Mode` / `Toggle Dark Mode` / `Toggle System Mode`.
- [x] `/terms`, `/privacy` render with layout; `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` respond. - live: `/`, `/pricing`, `/terms`, `/privacy` loaded anonymously with correct titles; `curl` of robots, sitemap and manifest returned 200, robots has `Disallow: /api/` and `Disallow: /dashboard/` (sitemap content NOT inspected).
- [ ] Footer links and theme controls render after newsletter removal (LIP-V006; live proof pending).
- [ ] Unknown route shows the not-found page (`Page not found`, `Back to Home`, `Dashboard`); error boundaries (`app/error.tsx`, lobby error `Unable to display page`). - live (anonymous only): `GET /nope` returns 307 to `/login?from=%2Fnope` because the proxy gates every non-public path; the not-found page itself NOT exercised (signed-in `/nope` not tried).
- [ ] Mobile navigation `Open navigation menu`.

## How to get to it (user POV)

Open the site root as an anonymous visitor.

## Driving it with the browser skill (pending)

1. 390 px and 1280 px, light and dark: capture `/`, `/pricing`, `/terms`, `/privacy`, a bad URL.
2. `curl -I` for robots, sitemap, manifest (200 each).
3. Check footer links and theme controls. Confirm the removed newsletter form and its success message are absent (LIP-V006).

## Gotchas

- Public routes are the only ones safe to inspect without an account; use them first once the browser skill exists.
