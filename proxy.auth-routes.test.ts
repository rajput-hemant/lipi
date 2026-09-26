import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy } from "./proxy";

describe("proxy auth routes", () => {
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

  it("redirects unauthenticated users on protected routes", async () => {
    const req = new NextRequest("http://localhost:3000/dashboard");

    const res = await proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/login?from=%2Fdashboard",
    );
  });
});
