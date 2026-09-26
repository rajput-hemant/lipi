import { describe, expect, it } from "vitest";

import { getSafeRedirectPath } from "./redirect";

describe("getSafeRedirectPath", () => {
  it("returns fallback when from is missing", () => {
    expect(getSafeRedirectPath(null, "/dashboard")).toBe("/dashboard");
  });

  it("honors deep-linked workspace paths", () => {
    const from = encodeURIComponent("/dashboard/ws-123?tab=files");
    expect(getSafeRedirectPath(from, "/dashboard")).toBe(
      "/dashboard/ws-123?tab=files",
    );
  });

  it("rejects open redirects", () => {
    expect(getSafeRedirectPath("//evil.test", "/dashboard")).toBe("/dashboard");
    expect(getSafeRedirectPath("https://evil.test", "/dashboard")).toBe(
      "/dashboard",
    );
  });
});
