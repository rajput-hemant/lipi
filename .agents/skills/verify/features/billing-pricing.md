# Pricing and Stripe billing

Status: PARTIAL live proof (signed-in `Go Pro` without Stripe credentials). Last live proof: 2026-10-10, branch `task/r4-sec` on `71b665e` (production build, `next start`; enforcing-CSP experiment build), evidence [local-session-r4-sec-2026-10-10.md](../../../../docs/verification/local-session-r4-sec-2026-10-10.md).

Public `/pricing` (`app/(lobby)/pricing/`), `Go Pro` checkout (`/api/stripe/checkout`), billing portal (`/api/stripe/portal`), webhook (`/api/stripe/webhook`), Free vs Pro quotas (`lib/billing/`). Showcase only: no live payments (see [requirements](../../../../docs/requirements/requirements.md)).

## Sub-features

- [ ] `/pricing` renders both plans for anonymous and signed-in users.
- [x] Signed-out `Go Pro` behavior; signed-in with billing unconfigured gets a clear 503-backed error, not a crash. - live (2026-10-10, signed-in half only): `Go Pro` on `/pricing` sent `POST /api/stripe/checkout` which returned 503, the page stayed on `/pricing`, and the only console error was `Failed to load resource ... 503`; the toast text was NOT captured and signed-out `Go Pro` was NOT exercised.
- [ ] Mocked checkout redirect (the e2e approach: stub `fetch`/`location.assign`, never reach Stripe).
- [ ] Webhook: missing signature 400, invalid signature 400 (curl).
- [ ] Quota messages: second workspace, third collaborator, 501st block on Free.

## How to get to it (user POV)

Lobby navbar `Pricing`; workspace upgrade prompts (`subscription-modal-provider`).

## Driving it with the browser skill (pending)

1. Anonymous: open `/pricing`, record layout; click `Go Pro`, record the result.
2. Signed in without Stripe env: `Go Pro`; expect an error toast and HTTP 503 from `/api/stripe/checkout` (check `app.log`).
3. `curl -X POST http://127.0.0.1:3161/api/stripe/webhook -d '{}'` expect 400 `Missing signature`.
4. Never set real `STRIPE_*` keys, never reach `checkout.stripe.com`.

## Gotchas

- Live Stripe is a documented non-goal; record as GAP only.
- Entitlement logic is unit-tested (`lib/billing/*.test.ts`, `lib/stripe/*.test.ts`).

## Recipe notes (2026-10-10)

- Network evidence: `chrome-devtools-axi network --type fetch | grep stripe` after clicking `Go Pro`.
- No request reached `js.stripe.com`, `api.stripe.com` or `hooks.stripe.com` in any page of the CSP sweep (Stripe hosts in the CSP were never exercised).
