# Lobby, legal pages and footer

Status: PARTIAL live proof (home, pricing, terms and privacy render and titles correct, no console errors). Last live proof: 2026-10-02, commit `815ceda`, evidence `lipi-browser-verification/evidence/lobby-legal-public/` (private task data dir, not in the repo).

Public marketing site: `/` (hero, features, tech stack, testimonials, open source), `/pricing`, `/terms`, `/privacy`, 404/error pages, footer, theme toggle, robots/sitemap/manifest.

## Sub-features

- [ ] `/` renders sections, nav links, `Toggle Dark Mode` / `Light` / `System`.
- [x] `/terms`, `/privacy` render with layout; `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` respond. - live: `/`, `/pricing`, `/terms`, `/privacy` loaded anonymously with correct titles; screenshots only; robots/sitemap/manifest NOT exercised.
- [ ] Unknown route shows the not-found page; error boundaries (`app/error.tsx`).
- [ ] Mobile navigation `Open navigation menu`.

## How to get to it (user POV)

Open the site root as an anonymous visitor.

## Driving it with the browser skill (pending)

1. 390 px and 1280 px, light and dark: capture `/`, `/pricing`, `/terms`, `/privacy`, a bad URL.
2. `curl -I` for robots, sitemap, manifest.

## Gotchas

- Public routes are the only ones safe to inspect without an account; use them first once the browser skill exists.
