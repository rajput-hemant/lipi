/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 */
export const publicRoutes = ["/", "/terms", "/privacy", "/pricing"];

/**
 * Signed-out password recovery. `/reset-password` is where Better Auth redirects
 * with `?token=` after the emailed link is opened.
 */
export const passwordRecoveryRoutes = ["/forgot-password", "/reset-password"];

/**
 * Route prefixes called by third-party servers without a session cookie.
 * Each handler authenticates the request itself (Stripe signature, UploadThing
 * signed callback and per-route middleware), so the proxy must not redirect them.
 */
export const selfAuthenticatedRoutePrefixes = [
  "/api/stripe/webhook",
  "/api/uploadthing",
];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to `DEFAULT_LOGIN_REDIRECT`
 */
export const authRoutes = ["/login", "/signup"];

/**
 * The default redirect path after a user logs in
 */
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";
