# Pricing and Stripe billing

Status: PARTIAL live proof (anonymous and signed-in `/pricing`, `Go Pro` and the webhook without Stripe credentials). Last live proof: 2026-10-10 @ 37e892b, production build, evidence [local-session-r4-vskill-2026-10-10.md](../../../../docs/verification/local-session-r4-vskill-2026-10-10.md); earlier 2026-10-10 signed-in `Go Pro` proof in [local-session-r4-sec-2026-10-10.md](../../../../docs/verification/local-session-r4-sec-2026-10-10.md).

Public `/pricing` (`app/(lobby)/pricing/`), `Go Pro` checkout (`/api/stripe/checkout`), billing portal (`/api/stripe/portal`), webhook (`/api/stripe/webhook`), Free vs Pro quotas (`lib/billing/`). Showcase only: no live payments (see [requirements](../../../../docs/requirements/requirements.md)).

## Sub-features

- [x] `/pricing` renders both plans for anonymous and signed-in users. - live: anonymous shows Free (`Get Started` to `/signup`) and Pro (`₹499`, `Sign in to upgrade` to `/login`); signed in shows `Go Pro` on the Pro card.
- [x] Signed-out visitors get `Sign in to upgrade` (no `Go Pro` button); signed-in with billing unconfigured gets a clear 503-backed error, not a crash. - live: signed in, `Go Pro` sent `POST /api/stripe/checkout` which returned 503 `{"error":"Stripe billing is not configured"}`, toast `Billing unavailable` / `Stripe billing is not configured`, page stayed on `/pricing`, only console error `Failed to load resource ... 503`.
- [ ] Mocked checkout redirect (the e2e approach: stub `fetch`/`location.assign`, never reach Stripe).
- [x] Webhook: missing signature 400, invalid signature 400 (curl). - live: `POST /api/stripe/webhook -d '{}'` gives 400 `Missing signature`; adding `-H 'stripe-signature: x'` gives 400 `Invalid webhook signature`.
- [ ] Quota messages: second workspace, third collaborator, 501st block on Free.

## How to get to it (user POV)

Lobby navbar `Pricing`; workspace upgrade prompts (`subscription-modal-provider`).

## Driving it with the browser skill (pending)

1. Anonymous: open `/pricing`, record layout; expect `Sign in to upgrade` (link to `/login`), not `Go Pro`.
2. Signed in without Stripe env: `Go Pro`; expect toast `Billing unavailable` and HTTP 503 from `/api/stripe/checkout`.
3. `curl -X POST http://127.0.0.1:3161/api/stripe/webhook -d '{}'` expect 400 `Missing signature`; with `-H 'stripe-signature: x'` expect 400 `Invalid webhook signature`.
4. Never set real `STRIPE_*` keys, never reach `checkout.stripe.com`.

## Gotchas

- Live Stripe is a documented non-goal; record as GAP only.
- Entitlement logic is unit-tested (`lib/billing/*.test.ts`, `lib/stripe/*.test.ts`).

## Recipe notes (2026-10-10)

- Network evidence: `chrome-devtools-axi network --type fetch | grep stripe` after clicking `Go Pro`.
- No request reached `js.stripe.com`, `api.stripe.com` or `hooks.stripe.com` in any page of the CSP sweep (Stripe hosts in the CSP were never exercised).
