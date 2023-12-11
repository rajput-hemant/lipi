import type { Route } from "next";
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getToken } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";

import { env } from "./lib/env.mjs";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(env.RATE_LIMITING_REQUESTS_PER_SECOND, "1s"),
});

export default withAuth(
  async (req) => {
    /* -----------------------------------------------------------------------------------------------
     * Rate limiting middleware
     * -----------------------------------------------------------------------------------------------*/

    if (env.ENABLE_RATE_LIMITING && env.NODE_ENV === "production") {
      const id = req.ip ?? "anonymous";
      const { limit, pending, remaining, reset, success } =
        await ratelimit.limit(id);

      if (!success) {
        return NextResponse.json(
          {
            error: {
              message: "Too many requests",
              limit,
              pending,
              remaining,
              reset: `${reset - Date.now()}ms`,
            },
          },

          {
            status: 429,
            headers: {
              "x-ratelimit-limit": limit.toString(),
              "x-ratelimit-remaining": remaining.toString(),
            },
          }
        );
      }
    }

    /* -----------------------------------------------------------------------------------------------
     * Authentication middleware
     * -----------------------------------------------------------------------------------------------*/

    const token = await getToken({ req });
    const isAuth = !!token;

    const isAuthPage = (
      ["/login", "/signup", "/reset-password"] as Route[]
    ).some((route) => req.nextUrl.pathname.startsWith(route));
    const isHomePage = req.nextUrl.pathname === "/";

    if (isAuthPage || isHomePage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      return null;
    }

    if (!isAuth) {
      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }

      return NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
      );
    }
  },
  {
    callbacks: {
      async authorized() {
        // This is a work-around for handling redirect on auth pages.
        // We return true here so that the middleware function above
        // is always called.
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",

    "/login",
    "/signup",
    "/reset-password",
    "/dashboard/:path*",
  ],
};
