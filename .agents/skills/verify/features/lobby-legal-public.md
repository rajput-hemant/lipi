# Lobby, legal pages and footer

Status: PARTIAL live proof (home, pricing, terms and privacy render and titles correct, no console errors). Last live proof: 2026-10-02, commit `815ceda`, evidence `lipi-browser-verification/evidence/lobby-legal-public/` (private task data dir, not in the repo).
Ledger: [verification-issues.md](../../../../docs/checks/verification-issues.md) (this file lists IDs only).
Related ledger IDs: LIP-V006, LIP-V013

Public marketing site: `/` (hero, features, tech stack, testimonials, open source), `/pricing`, `/terms`, `/privacy`, 404/error pages, footer links, theme toggle, robots/sitemap/manifest.

## Sub-features

- [ ] `/` renders sections, nav links, `Toggle Dark Mode` / `Light` / `System`.
- [x] `/terms`, `/privacy` render with layout; `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` respond. - live: `/`, `/pricing`, `/terms`, `/privacy` loaded anonymously with correct titles; screenshots only; robots/sitemap/manifest NOT exercised.
- [ ] Footer links and theme controls render after newsletter removal (LIP-V006, source-only fix on 2026-10-04).
- [ ] Unknown route shows the not-found page; error boundaries (`app/error.tsx`).
- [ ] Mobile navigation `Open navigation menu`.

## How to get to it (user POV)

Open the site root as an anonymous visitor.

## Driving it with the browser skill (pending)

1. 390 px and 1280 px, light and dark: capture `/`, `/pricing`, `/terms`, `/privacy`, a bad URL.
2. `curl -I` for robots, sitemap, manifest.
3. Check footer links and theme controls. Confirm the removed newsletter form and its success message are absent (LIP-V006).

## Gotchas

- Public routes are the only ones safe to inspect without an account; use them first once the browser skill exists.
