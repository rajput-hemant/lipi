import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { proxy } from "./proxy";

describe("proxy auth routes", () => {
  const originalEnv = {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION,
  };

  beforeAll(() => {
    vi.stubEnv(
      "BETTER_AUTH_SECRET",
      "test-secret-key-that-is-at-least-32-chars"
    );
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
    vi.stubEnv("SKIP_ENV_VALIDATION", "true");
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it("does not redirect /login when only a session cookie is present", async () => {
    const req = new NextRequest("http://localhost:3000/login", {
      headers: {
        cookie: "better-auth.session_token=stale-session-token",
      },
    });

    const res = await proxy(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("rejects forged session cookies on protected routes", async () => {
    const req = new NextRequest("http://localhost:3000/dashboard", {
      headers: {
        cookie: "better-auth.session_token=forged-token",
      },
    });

    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/login?from=%2Fdashboard"
    );
  });

  it("redirects unauthenticated users on protected routes", async () => {
    const req = new NextRequest("http://localhost:3000/dashboard");

    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/login?from=%2Fdashboard"
    );
  });

  it.each(["/forgot-password", "/reset-password"])(
    "lets signed-out visitors reach %s",
    async (path) => {
      const res = await proxy(
        new NextRequest(`http://localhost:3000${path}?token=abc`)
      );

      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    }
  );

  it.each(["/dashboard/change-password"])(
    "requires a session for %s",
    async (path) => {
      const res = await proxy(new NextRequest(`http://localhost:3000${path}`));

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe(
        `http://localhost:3000/login?from=${encodeURIComponent(path)}`
      );
    }
  );

  it.each(["/api/stripe/webhook", "/api/uploadthing"])(
    "lets third-party callbacks reach %s without a session",
    async (path) => {
      const res = await proxy(
        new NextRequest(`http://localhost:3000${path}`, { method: "POST" })
      );

      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    }
  );

  it("still protects other API routes without a session", async () => {
    const res = await proxy(
      new NextRequest("http://localhost:3000/api/stripe/checkout", {
        method: "POST",
      })
    );

    expect(res.status).toBe(307);
  });
});
