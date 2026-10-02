# Anonymous access and route gating

Status: PARTIAL live proof (anonymous route matrix by curl, non-member workspace denial in the browser). API status expectations below were corrected from live results. Last live proof: 2026-10-02, commit `815ceda`, evidence `lipi-browser-verification/evidence/access-control-anonymous/` (private task data dir, not in the repo).
Ledger: [verification-issues.md](../../../../docs/checks/verification-issues.md) (this file lists IDs only).
Related ledger IDs: LIP-V004, LIP-V005, LIP-V008

What an unauthenticated visitor can and cannot reach. The gate is `proxy.ts` (public routes in `config/routes.ts`: `/`, `/terms`, `/privacy`, `/pricing`; auth routes `/login`, `/signup`, `/reset-password`; everything else needs a valid Better Auth session, otherwise redirect to `/login?from=<path>`), plus per-route checks in server components and API handlers. There is no anonymous identity concept in Lipi: unauthenticated means no access to workspace data.

## Sub-features

- [x] Logged out: `/`, `/pricing`, `/terms`, `/privacy` render; `/dashboard`, `/dashboard/<id>`, `/dashboard/new-workspace`, `/invite/<token>` redirect to `/login?from=...`. - live: curl matrix `evidence/access-control-anonymous/curl-matrix.txt`: public pages 200, `/dashboard`, `/dashboard/new-workspace`, `/invite/<token>` 307 to `/login?from=...`.
- [x] Static assets and `/api/auth/*` bypass the proxy matcher. - live: `GET /api/auth/get-session` 200 anonymous (static assets NOT separately checked).
- [ ] `POST /api/realtime/token`: 403 without same-origin headers, 400 invalid body, 401 without session, 403 for non-members (`app/api/realtime/token/route.ts`). - live (anonymous only): 307 to `/login?from=%2Fapi%2Frealtime%2Ftoken`, because the proxy gates it before the route; the 403/400/401 branches were NOT exercised.
- [ ] `POST /api/stripe/checkout`: 401 without session; 503 when billing is not configured. - live (anonymous only): 307 to `/login?from=%2Fapi%2Fstripe%2Fcheckout` from the proxy; 401/503 NOT exercised.
- [ ] `/api/uploadthing`: rejects without session or permission (`app/api/uploadthing/core.ts`, unit-tested only). - live (anonymous only): GET 307 to login from the proxy.
- [ ] `/api/stripe/webhook`: 400 on missing/invalid signature.
- [x] Logged in but not a member: `/dashboard/<other workspace id>` is denied (`assertWorkspaceAccess`), no data leakage. - live: user B on user A's workspace URL gets heading `Failed to load workspace` and no workspace data; the server logs `MutationAuthError: Forbidden`.
- [ ] Rate limiting: `ENABLE_RATE_LIMITING=true` plus Redis is the only active proxy limiter; other modes return 503 when misconfigured (`lib/proxy/rate-limiting.ts`).

## How to get to it (user POV)

Typing a protected URL while signed out, following an invite link while signed out, or calling the API from outside the app.

## Driving it with the browser skill (pending)

1. Doctor-level curl checks (see SKILL.md) already cover `/dashboard` redirect and the token route 403; run them with `-i` and save headers.
2. Browser: new context, open `/dashboard`; expect landing on `/login?from=%2Fdashboard`. Repeat for `/invite/<token>` and a workspace URL.
3. After logging in, expect return to the `from` path only when it is a safe relative path (try `from=//evil.example`, expect fallback `/dashboard`).
4. As user B (non-member) open user A's `/dashboard/<A workspace id>`; expect not-found/redirect, no workspace title in the response.
5. Authenticated `curl` must not reuse a shared browser session; use a cookie from a verify-created user only.

## Gotchas

- `callbackUrl` vs `from`: see LIP-V004.
- `?invite=invalid` is never shown: LIP-V005.
- Realtime/token checks need a same-origin `Origin` header; the plain curl in the doctor intentionally gets 403.
