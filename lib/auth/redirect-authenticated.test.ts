import { describe, expect, it, vi } from "vitest";

import { resolveAuthenticatedRedirect } from "./redirect-authenticated";

describe("resolveAuthenticatedRedirect", () => {
  it("avoids redirecting back to the current auth page", () => {
    vi.stubEnv("BETTER_AUTH_URL", "https://lipi.example");
    vi.stubEnv("SKIP_ENV_VALIDATION", "true");

    expect(resolveAuthenticatedRedirect("/login", "/login")).toBe("/dashboard");
  });
});
