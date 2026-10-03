# Authentication and session

Status: PARTIAL live proof (email/password sign-up, sign-in, sign-out, wrong password, gating). Unexercised sub-features stay unticked. Last live proof: 2026-10-02, commit `815ceda`, evidence `lipi-browser-verification/evidence/auth-session/` (private task data dir, not in the repo).

Email/password sign-up, sign-in, sign-out, emailed password recovery and signed-in password change on Better Auth with a bcrypt hash against the local database. Pages live in `app/(auth)/{login,signup,forgot-password,reset-password}` and `app/dashboard/change-password`; the API is `app/api/auth/[...all]/route.ts`; auth wiring is `lib/auth/create-auth.ts`.

## Sub-features

- [x] Sign-up with email + password + confirm (`signUpSchema` in `lib/validations.ts`), lands on `/dashboard/new-workspace` or `/dashboard/<id>`. - live: validation errors `Email is Required`/`Password is Required`, `Passwords do not match`; valid sign-up lands on `/dashboard/new-workspace`; user row created.
- [x] Sign-in by email (`Login with Email`); email-only, no username mode (LIP-V002). - live: email sign-in lands on `/dashboard/<id>`.
- [ ] Validation messages: password rules (upper/lower/digit/special/8+), mismatched confirm, bad email.
- [x] Sign-out (`title="Sign out"` button) clears the session; `/dashboard` redirects to login afterwards. - live: `Sign out` button returns to `/login`; `/dashboard` then redirects to `/login?from=%2Fdashboard`.
- [ ] `?from=` return path honored after login and safely constrained (`lib/auth/redirect.ts`, unit-tested only).
- [x] Authenticated users visiting `/login`, `/signup` are redirected away (`AuthPageGate`, `redirectIfAuthenticated`). - live: signed-in user B opening `/login` is redirected to the dashboard.
- [ ] Forgot password: `/forgot-password` (`Send reset link`) emails a link to `/reset-password?token=`; set a new password, then sign in with it. Without `RESEND_API_KEY` outside production the email text, link included, is logged to the app terminal (`lib/email/send-email.ts`). A missing or invalid token shows `This reset link is invalid or has expired.` (LIP-V003, unit-tested only).
- [ ] Change password (signed in, sidebar account popover, `/dashboard/change-password`): current and new password; other sessions are revoked.
- [x] Wrong-password and unknown-user error toasts. - live: wrong password shows `Invalid email or password`; unknown-user NOT exercised.
- [ ] OAuth buttons (Google/GitHub) render; the round trip is not drivable locally (LIP-V014).

## How to get to it (user POV)

Anonymous visitor: `/signup` or `/login` from the lobby navbar; `/forgot-password` is linked from the login form. Logged in: sign-out from the workspace header; change password from the sidebar account popover.

## Driving it with the browser skill (pending)

1. Fresh browser context, `http://127.0.0.1:3161/signup`.
2. Fill placeholder `you@domain.com`, first `••••••••••`, second `••••••••••`; click `Sign Up`.
3. Expect URL `/dashboard/new-workspace` or `/dashboard/<uuid>`; session cookie set.
4. Clear cookies (or sign out), open `/login`, fill and click `Login with Email`; expect toast `You have been signed in.` and `/dashboard`.
5. Evidence: `select email from "user"` and `select provider_id from better_auth_account` in the disposable DB (table and column names: `lib/db/schema/auth.ts`).
6. Negative: wrong password toast, `/dashboard` while logged out returns a redirect to `/login?from=%2Fdashboard`.
7. Forgot password: sign up a user, visit `/forgot-password`, submit the email, read the logged reset link from the app terminal (no `RESEND_API_KEY`), open it, submit new and confirm passwords, expect toast `Password updated. Please sign in.`, then log in with the new password.
8. Change password: signed in, open `/dashboard/change-password`, submit current and new password, expect toast `Password changed successfully`.

## Gotchas

- Sign-ups pace at about one per 11 s under a production build (Better Auth limiter).
- OAuth and passkeys cannot be proved without real credentials/origins; do not mark them verified.
- Recovery is the Better Auth emailed flow (`b04d298`); the old unauthenticated server action is gone (LIP-V003).
- A passing `lib/auth/*.test.ts` run does not prove any of these UI flows.
