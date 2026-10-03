import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getClientIp } from "./client-ip";

function request(headers: Record<string, string>) {
  return new NextRequest("http://localhost:3000/dashboard", { headers });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

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

  describe("TRUSTED_PROXY_COUNT", () => {
    const forwarded = "6.6.6.6, 198.51.100.4, 203.0.113.9";

    it("takes the hop N from the right", () => {
      vi.stubEnv("TRUSTED_PROXY_COUNT", "1");
      expect(getClientIp(request({ "x-forwarded-for": forwarded }))).toBe(
        "203.0.113.9"
      );
      vi.stubEnv("TRUSTED_PROXY_COUNT", "2");
      expect(getClientIp(request({ "x-forwarded-for": forwarded }))).toBe(
        "198.51.100.4"
      );
    });

    it("ignores a client-supplied x-real-ip", () => {
      vi.stubEnv("TRUSTED_PROXY_COUNT", "1");
      expect(
        getClientIp(
          request({ "x-real-ip": "1.2.3.4", "x-forwarded-for": forwarded })
        )
      ).toBe("203.0.113.9");
    });

    it("returns an empty string when fewer hops than proxies are present", () => {
      vi.stubEnv("TRUSTED_PROXY_COUNT", "4");
      expect(getClientIp(request({ "x-forwarded-for": forwarded }))).toBe("");
    });

    it("keeps the default behaviour when invalid", () => {
      vi.stubEnv("TRUSTED_PROXY_COUNT", "abc");
      expect(
        getClientIp(
          request({ "x-real-ip": "203.0.113.7", "x-forwarded-for": forwarded })
        )
      ).toBe("203.0.113.7");
    });

    it("keeps trusting platform headers on Vercel", () => {
      vi.stubEnv("VERCEL", "1");
      vi.stubEnv("TRUSTED_PROXY_COUNT", "2");
      expect(
        getClientIp(
          request({ "x-real-ip": "203.0.113.7", "x-forwarded-for": forwarded })
        )
      ).toBe("203.0.113.7");
    });
  });
});
