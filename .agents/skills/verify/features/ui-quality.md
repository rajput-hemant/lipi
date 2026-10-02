# UI quality pass (cross-cutting)

Status: DRAFT, not live-verified. Last live proof: none.
Ledger: [verification-issues.md](../../../../docs/checks/verification-issues.md) (this file lists IDs only).
Related ledger IDs: LIP-V013

Checklist applied per feature screen once drivable; not a separate route.

## Sub-features

- [ ] Light and dark themes: contrast, borders, editor and dialogs.
- [ ] 390 px and 1280 px (and a tablet width): no horizontal overflow, resizable sidebar and mobile sheet usable.
- [ ] Empty, loading (`app/loading.tsx`, `app/dashboard/loading.tsx`), error (`app/error.tsx`, `app/global-error.tsx`) and long-content states (long page titles, many pages, many collaborators).
- [ ] Keyboard: tab order through auth forms, sidebar tree, dialogs, ⌘K; visible focus; Escape closes dialogs.
- [ ] Accessible names (aria labels listed in SKILL.md), toasts announced.
- [ ] Reduced motion and no layout shift while the editor boots.
- [ ] Console free of errors/warnings (the e2e fixtures already fail on any console error).

## How to get to it (user POV)

Everywhere.

## Driving it with the browser skill (pending)

For each screen from the other feature files: capture the six states above with the browser skill, list defects in the ledger as CONFIRMED with screenshot paths, and keep the product code unchanged during verification.

## Gotchas

- Static review skills may be used on component source, but static review is a HYPOTHESIS source, not proof.
