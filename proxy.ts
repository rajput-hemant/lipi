import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import type { NextRequest } from "next/server";

import {
  authRoutes,
  publicRoutes,
  selfAuthenticatedRoutePrefixes,
} from "./config/routes";
import { hasValidProxySession } from "./lib/auth/proxy-session";
import { env } from "./lib/env";
import { getClientIp } from "./lib/proxy/client-ip";
import { getProxyRateLimitMode } from "./lib/proxy/rate-limiting";

function createRatelimit() {
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(
      env.RATE_LIMITING_REQUESTS_PER_SECOND,
      "1s"
    ),
  });
}

export async function proxy(req: NextRequest) {
  const rateLimitMode = getProxyRateLimitMode();
  if (rateLimitMode === "misconfigured") {
    return NextResponse.json(
      { error: { message: "Service unavailable" } },
      { status: 503 }
    );
  }

  if (rateLimitMode === "active") {
    const ratelimit = createRatelimit();
    const id = getClientIp(req) || "anonymous";
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

  const { nextUrl } = req;

  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  const isSelfAuthenticated = selfAuthenticatedRoutePrefixes.some(
    (prefix) =>
      nextUrl.pathname === prefix || nextUrl.pathname.startsWith(`${prefix}/`)
  );

  if (isAuthRoute || isSelfAuthenticated) {
    return NextResponse.next();
  }

  if (!isPublicRoute) {
    const isAuthenticated = await hasValidProxySession(req);

    if (!isAuthenticated) {
      let from = nextUrl.pathname;
      if (nextUrl.search) {
        from += nextUrl.search;
      }

      return NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(from)}`, nextUrl)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next|api/auth).*)"],
};
