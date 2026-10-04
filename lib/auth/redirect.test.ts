import { describe, expect, it } from "vitest";

import { getSafeRedirectPath, isSafeRelativeRedirectPath } from "./redirect";

const BASE = "https://lipi.example";

describe("getSafeRedirectPath", () => {
  it("returns fallback when from is missing", () => {
    expect(getSafeRedirectPath(null, "/dashboard")).toBe("/dashboard");
  });

  it("honors deep-linked workspace paths", () => {
    const from = encodeURIComponent("/dashboard/ws-123?tab=files");
    expect(getSafeRedirectPath(from, "/dashboard", BASE)).toBe(
      "/dashboard/ws-123?tab=files"
    );
  });

  it("rejects open redirects", () => {
    expect(getSafeRedirectPath("//evil.test", "/dashboard", BASE)).toBe(
      "/dashboard"
    );
    expect(getSafeRedirectPath("https://evil.test", "/dashboard", BASE)).toBe(
      "/dashboard"
    );
  });

  it("rejects double-encoded backslash separators even without baseURL", () => {
    expect(
      getSafeRedirectPath("/%25255Cevil.example/login", "/dashboard")
    ).toBe("/dashboard");
  });

  it("rejects backslash paths that normalize to another origin", () => {
    expect(getSafeRedirectPath("/%5Cevil.example", "/dashboard", BASE)).toBe(
      "/dashboard"
    );
    expect(isSafeRelativeRedirectPath("/\\evil.example", BASE)).toBe(false);
    expect(
      new URL("/\\evil.example", BASE).href.startsWith("https://evil.example")
    ).toBe(true);
  });

  it("rejects control-character paths", () => {
    expect(getSafeRedirectPath("/dashboard%0a/evil", "/dashboard", BASE)).toBe(
      "/dashboard"
    );
  });

  it("rejects encoded protocol-relative and scheme paths", () => {
    expect(getSafeRedirectPath("%2F%2Fevil.test", "/dashboard", BASE)).toBe(
      "/dashboard"
    );
    expect(getSafeRedirectPath("javascript:alert(1)", "/dashboard", BASE)).toBe(
      "/dashboard"
    );
  });

  it("falls back on malformed percent-encoding", () => {
    expect(getSafeRedirectPath("/dashboard/%E0%A4%A", "/dashboard", BASE)).toBe(
      "/dashboard"
    );
  });

  it("keeps the query string and hash of a safe path", () => {
    expect(getSafeRedirectPath("/dashboard/ws?a=1#top", "/x", BASE)).toBe(
      "/dashboard/ws?a=1#top"
    );
  });
});
