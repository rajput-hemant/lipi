import { describe, expect, it } from "vitest";

import { buildCsp, realtimeConnectSource } from "./csp";

function directive(policy: string, name: string) {
  const entry = policy.split("; ").find((d) => d.startsWith(`${name} `));
  return entry?.split(" ").slice(1) ?? [];
}

describe("buildCsp", () => {
  it("locks down plugins, framing, base-uri and form targets", () => {
    const policy = buildCsp();
    expect(directive(policy, "default-src")).toEqual(["'self'"]);
    expect(directive(policy, "object-src")).toEqual(["'none'"]);
    expect(directive(policy, "frame-ancestors")).toEqual(["'none'"]);
    expect(directive(policy, "base-uri")).toEqual(["'self'"]);
    expect(directive(policy, "form-action")).toEqual(["'self'"]);
  });

  it("allowlists Stripe, UploadThing and avatar hosts", () => {
    const policy = buildCsp();
    expect(directive(policy, "script-src")).toContain("https://js.stripe.com");
    expect(directive(policy, "connect-src")).toEqual(
      expect.arrayContaining([
        "https://api.stripe.com",
        "https://hooks.stripe.com",
        "https://utfs.io",
        "https://*.ufs.sh",
        "https://uploadthing.com",
      ])
    );
    expect(directive(policy, "img-src")).toEqual(
      expect.arrayContaining([
        "blob:",
        "data:",
        "https://lh3.googleusercontent.com",
        "https://avatars.githubusercontent.com",
        "https://utfs.io",
      ])
    );
  });

  it("allows unsafe-eval and localhost only in development", () => {
    expect(directive(buildCsp({ isDev: true }), "script-src")).toContain(
      "'unsafe-eval'"
    );
    expect(directive(buildCsp(), "script-src")).not.toContain("'unsafe-eval'");
    expect(buildCsp()).not.toContain("localhost");
  });

  it("adds the realtime websocket origin to connect-src", () => {
    const policy = buildCsp({ realtimeUrl: "wss://rt.example.com/room?x=1" });
    expect(directive(policy, "connect-src")).toContain("wss://rt.example.com");
  });

  it("ignores a missing or invalid realtime url", () => {
    const base = buildCsp();
    expect(buildCsp({ realtimeUrl: null })).toBe(base);
    expect(buildCsp({ realtimeUrl: "not a url" })).toBe(base);
  });

  it("has no wildcard script source and is a single line", () => {
    const policy = buildCsp({
      isDev: true,
      realtimeUrl: "ws://localhost:1234",
    });
    expect(directive(policy, "script-src")).not.toContain("*");
    expect(policy).not.toMatch(/\n/);
  });
});

describe("realtimeConnectSource", () => {
  it.each([
    ["ws://localhost:1234", "ws://localhost:1234"],
    ["wss://rt.example.com/path", "wss://rt.example.com"],
    ["https://rt.example.com:8443", "wss://rt.example.com:8443"],
    ["http://localhost:1234", "ws://localhost:1234"],
    ["ftp://x.example.com", null],
    ["", null],
    [undefined, null],
  ])("%s -> %s", (input, expected) => {
    expect(realtimeConnectSource(input)).toBe(expected);
  });
});
