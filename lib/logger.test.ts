import { afterEach, describe, expect, it, vi } from "vitest";

import { formatLog, logger, redact } from "./logger";

describe("formatLog", () => {
  it("emits one JSON line with error details in production", () => {
    const cause = new TypeError("root cause");
    const error = Object.assign(new Error("boom", { cause }), {
      digest: "abc123",
    });

    const line = formatLog(
      "error",
      "failed",
      error,
      { workspaceId: "w1" },
      true
    );
    const parsed = JSON.parse(line);

    expect(line).not.toContain("\n");
    expect(parsed).toMatchObject({
      level: "error",
      message: "failed",
      context: { workspaceId: "w1" },
      error: {
        name: "Error",
        message: "boom",
        digest: "abc123",
        cause: { name: "TypeError", message: "root cause" },
      },
    });
    expect(parsed.error.stack).toContain("boom");
    expect(typeof parsed.time).toBe("string");
  });

  it("emits a readable multi-line message in development", () => {
    const error = Object.assign(
      new Error("boom", { cause: new Error("why") }),
      { digest: "d1" }
    );

    const line = formatLog("warn", "careful", error, { id: 1 }, false);

    expect(line).toContain("[warn] careful");
    expect(line).toContain("Error: boom (digest d1)");
    expect(line).toContain("Caused by Error: why");
    expect(line).toContain('{"id":1}');
  });

  it("handles non-Error values", () => {
    const parsed = JSON.parse(
      formatLog("error", "x", { code: 7 }, undefined, true)
    );

    expect(parsed.error).toEqual({ name: "NonError", message: '{"code":7}' });
    expect(parsed.context).toBeUndefined();
  });
});

describe("redact", () => {
  it("masks sensitive keys at any depth, case-insensitively", () => {
    const result = redact({
      password: "p",
      nested: { Authorization: "Bearer x", apiKey: "k", api_key: "k2", ok: 1 },
      list: [{ sessionToken: "t" }],
      clientSecret: "s",
    });

    expect(result).toEqual({
      password: "[REDACTED]",
      nested: {
        Authorization: "[REDACTED]",
        apiKey: "[REDACTED]",
        api_key: "[REDACTED]",
        ok: 1,
      },
      list: [{ sessionToken: "[REDACTED]" }],
      clientSecret: "[REDACTED]",
    });
  });

  it("survives circular references", () => {
    const value: Record<string, unknown> = { a: 1 };
    value.self = value;

    expect(redact(value)).toEqual({ a: 1, self: "[Circular]" });
  });

  it("redacts context in the formatted line", () => {
    const line = formatLog("info", "m", undefined, { token: "abc" }, true);

    expect(line).not.toContain("abc");
    expect(line).toContain("[REDACTED]");
  });
});

describe("logger", () => {
  afterEach(() => vi.restoreAllMocks());

  it("routes each level to the matching console method", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    logger.error("e", new Error("x"));
    logger.warn("w");
    logger.info("i");

    expect(error).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("[warn] w"));
    expect(info).toHaveBeenCalledWith(expect.stringContaining("[info] i"));
  });
});
