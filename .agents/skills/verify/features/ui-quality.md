# UI quality pass (cross-cutting)

Status: PARTIAL live proof (dark theme, 390 px layout, console cleanliness on exercised pages). Last live proof: 2026-10-02, commit `815ceda`, evidence `lipi-browser-verification/evidence/ui-quality/` (private task data dir, not in the repo).
Ledger: [verification-issues.md](../../../../docs/verification/verification-issues.md) (this file lists IDs only).
Related ledger IDs: LIP-V013

Checklist applied per feature screen once drivable; not a separate route.

## Sub-features

- [x] Light and dark themes: contrast, borders, editor and dialogs. - live: editor page in light and dark (`Toggle theme` > `Dark`); contrast spot-checked by screenshot only.
- [x] 390 px and 1280 px (and a tablet width): no horizontal overflow, collapsible sidebar and mobile sheet usable. - live: no horizontal overflow at 390 px on the editor page; collaborator avatar overlaps the search button there (LIP-V021). Tablet width NOT exercised.
- [ ] Empty, loading (`app/loading.tsx`, `app/dashboard/loading.tsx`), error (`app/error.tsx`, `app/global-error.tsx`) and long-content states (long page titles, many pages, many collaborators).
- [ ] Keyboard: tab order through auth forms, sidebar tree, dialogs, ⌘K; visible focus; Escape closes dialogs.
- [ ] Accessible names (aria labels listed in SKILL.md), toasts announced.
- [ ] Reduced motion and no layout shift while the editor boots.
- [x] Console free of errors/warnings (the e2e fixtures already fail on any console error). - live: `console --type error` was empty on every exercised page (only devtools issues for missing autocomplete/label attributes).

## How to get to it (user POV)

Everywhere.

## Driving it with the browser skill (pending)

For each screen from the other feature files: capture the six states above with the browser skill, list defects in the ledger as CONFIRMED with screenshot paths, and keep the product code unchanged during verification.

## Gotchas

- Static review skills may be used on component source, but static review is a HYPOTHESIS source, not proof.
