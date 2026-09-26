import { describe, expect, it } from "vitest";

import { ensureHttpsUrl } from "./ensure-https-url";

describe("ensureHttpsUrl", () => {
  it("prefixes bare Vercel hostnames with https", () => {
    expect(ensureHttpsUrl("lipi.vercel.app")).toBe("https://lipi.vercel.app");
  });

  it("leaves fully qualified URLs unchanged", () => {
    expect(ensureHttpsUrl("http://localhost:3000")).toBe(
      "http://localhost:3000",
    );
  });
});
