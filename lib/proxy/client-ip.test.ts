import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { getClientIp } from "./client-ip";

function request(headers: Record<string, string>) {
  return new NextRequest("http://localhost:3000/dashboard", { headers });
}

describe("getClientIp", () => {
  it("prefers the platform-provided x-real-ip", () => {
    expect(
      getClientIp(
        request({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "1.1.1.1" })
      )
    ).toBe("203.0.113.7");
  });

  it("uses the right-most x-forwarded-for hop so client-prepended values are ignored", () => {
    expect(
      getClientIp(
        request({ "x-forwarded-for": "6.6.6.6, 198.51.100.4, 203.0.113.9" })
      )
    ).toBe("203.0.113.9");
  });

  it("skips internal proxy hops on the right", () => {
    expect(
      getClientIp(
        request({ "x-forwarded-for": "6.6.6.6, 203.0.113.7, 10.0.0.1" })
      )
    ).toBe("203.0.113.7");
  });

  it("falls back to the right-most hop when every hop is internal", () => {
    expect(
      getClientIp(request({ "x-forwarded-for": "192.168.0.2, 10.0.0.1" }))
    ).toBe("10.0.0.1");
  });

  it("trims whitespace", () => {
    expect(getClientIp(request({ "x-forwarded-for": " 203.0.113.9 " }))).toBe(
      "203.0.113.9"
    );
  });

  it("returns an empty string when no header is present", () => {
    expect(getClientIp(request({}))).toBe("");
  });
});
