# Authentication and session

Status: DRAFT, not live-verified. Last live proof: none.
Ledger: [verification-issues.md](../../../../docs/checks/verification-issues.md) (this file lists IDs only).
Related ledger IDs: LIP-V002, LIP-V003, LIP-V004, LIP-V007, LIP-V014

Email/password sign-up, sign-in, sign-out and password reset on Better Auth with a bcrypt hash against a shared database. Pages live in `app/(auth)/{login,signup,reset-password}`; the API is `app/api/auth/[...all]/route.ts`; auth wiring is `lib/auth/create-auth.ts`.

## Sub-features

- [ ] Sign-up with email + password + confirm (`signUpSchema` in `lib/validations.ts`), lands on `/dashboard/new-workspace` or `/dashboard/<id>`.
- [ ] Sign-in by email (`Login with Email`), and the username toggle (`@username`) (see LIP-V002).
- [ ] Validation messages: password rules (upper/lower/digit/special/8+), mismatched confirm, bad email.
- [ ] Sign-out (`title="Sign out"` button) clears the session; `/dashboard` redirects to login afterwards.
- [ ] `?from=` return path honored after login and safely constrained (`lib/auth/redirect.ts`, unit-tested only).
- [ ] Authenticated users visiting `/login`, `/signup` are redirected away (`AuthPageGate`, `redirectIfAuthenticated`).
- [ ] Reset password (`/reset-password`: email, old password, new password) then sign in with the new one (LIP-V003).
- [ ] Wrong-password and unknown-user error toasts.
- [ ] OAuth buttons (Google/GitHub) render; the round trip is not drivable locally (LIP-V014).

## How to get to it (user POV)

Anonymous visitor: `/signup` or `/login` from the lobby navbar; `/reset-password` linked from the login form (`href="/reset-password"`). Logged in: sign-out from the workspace header.

## Driving it with the browser skill (pending)

1. Fresh browser context, `http://127.0.0.1:3161/signup`.
2. Fill placeholder `you@domain.com`, first `••••••••••`, second `••••••••••`; click `Sign Up`.
3. Expect URL `/dashboard/new-workspace` or `/dashboard/<uuid>`; session cookie set.
4. Clear cookies (or sign out), open `/login`, fill and click `Login with Email`; expect toast `You have been signed in.` and `/dashboard`.
5. Evidence: `select email, username from "user"` and `select provider_id from better_auth_account` in the disposable DB (table and column names: `lib/db/schema/auth.ts`).
6. Negative: wrong password toast, `/dashboard` while logged out returns a redirect to `/login?from=%2Fdashboard`.
7. Reset: sign up user, visit `/reset-password`, submit old and new password, expect toast `Password Reset Successfully` then login with the new one.

## Gotchas

- Sign-ups pace at about one per 11 s under a production build (Better Auth limiter).
- OAuth and passkeys cannot be proved without real credentials/origins; do not mark them verified.
- The reset form is an unauthenticated server action (`lib/actions.ts`), not a Better Auth flow: it needs the old password and sends no email.
- A passing `lib/auth/*.test.ts` run does not prove any of these UI flows.
