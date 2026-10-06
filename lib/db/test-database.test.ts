import { describe, expect, it } from "vitest";

import { canonicalTestDatabaseUrl } from "./test-database";

describe("canonicalTestDatabaseUrl", () => {
  it.each([
    [
      "postgresql://u:p@remote.example,127.0.0.1@127.0.0.1/lipi",
      "comma host behind first @",
    ],
    ["postgresql://u:p@127.0.0.1,remote.example/lipi", "comma host list"],
    [
      "postgresql://u:p@localhost,remote.example:5432/lipi",
      "comma host list with port",
    ],
    ["postgresql://u:p@localhost.evil.com/lipi", "localhost suffix domain"],
    ["postgresql://u:p@127.0.0.1.evil.com/lipi", "loopback suffix domain"],
    ["postgresql://localhost@evil.com/lipi", "loopback as username"],
    ["postgresql://u@evil.com@127.0.0.1/lipi", "two @ signs"],
    ["postgresql://u:p@evil.com:x@127.0.0.1/lipi", "port-like userinfo"],
    [
      "postgresql://u:p@127.0.0.1/lipi?host=remote.example",
      "host query override",
    ],
    [
      "postgresql://u:p@127.0.0.1/lipi?sslmode=disable&HOST=remote.example",
      "upper-case host override",
    ],
    [
      "postgresql://u:p@127.0.0.1/lipi?%68ost=remote.example",
      "encoded host key",
    ],
    ["postgresql://u:p@127.0.0.1/lipi?hostaddr=10.0.0.5", "hostaddr override"],
    ["postgresql://u:p@127.0.0.1/lipi?port=6543", "port override"],
    ["postgresql://u:p@127.0.0.1/lipi?%ZZ=1", "malformed query escape"],
    ["postgresql://u:p@%31%32%37.0.0.1/lipi", "percent-encoded host"],
    ["postgresql://u:p@local%68ost/lipi", "percent-encoded localhost"],
    ["postgresql://u:p@/lipi", "empty host"],
    ["postgresql:///lipi", "no authority"],
    ["postgresql://u:p@127.0.0.1:/lipi", "empty port"],
    ["postgresql://u:p@127.0.0.1:5432x/lipi", "non-numeric port"],
    ["postgresql://u:p@127.0.0.1/lipi/extra", "extra path segment"],
    ["postgresql://u:p@[::2]/lipi", "non-loopback IPv6"],
    ["postgresql://u:p@::1/lipi", "unbracketed IPv6"],
    ["http://u:p@127.0.0.1/lipi", "wrong scheme"],
    ["", "empty string"],
    ["not a url", "garbage"],
    [undefined, "undefined"],
  ])("rejects %s (%s)", (url, reason) => {
    expect(canonicalTestDatabaseUrl(url), reason).toBeNull();
  });

  it.each([
    [
      "postgresql://u:p@127.0.0.1:5432/lipi",
      "postgresql://u:p@127.0.0.1:5432/lipi",
    ],
    ["postgres://u:p@localhost/lipi", "postgresql://u:p@localhost/lipi"],
    [
      "postgresql://u:p@LOCALHOST:55444/lipi",
      "postgresql://u:p@localhost:55444/lipi",
    ],
    ["postgresql://u:p@[::1]:5432/lipi", "postgresql://u:p@[::1]:5432/lipi"],
    [
      "postgresql://u%40x:p%2Cq@127.0.0.1/lipi",
      "postgresql://u%40x:p%2Cq@127.0.0.1/lipi",
    ],
    ["postgresql://127.0.0.1/lipi", "postgresql://127.0.0.1/lipi"],
  ])("accepts %s as %s", (url, canonical) => {
    expect(canonicalTestDatabaseUrl(url)).toBe(canonical);
  });

  it("drops query parameters from the canonical form", () => {
    expect(
      canonicalTestDatabaseUrl(
        "postgresql://u:p@127.0.0.1/lipi?sslmode=disable"
      )
    ).toBe("postgresql://u:p@127.0.0.1/lipi");
  });
});
