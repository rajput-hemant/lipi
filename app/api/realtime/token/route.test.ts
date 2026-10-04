import { describe, expect, it, vi } from "vitest";

import { POST } from "./route";

vi.mock("@/lib/auth", () => ({ getAuth: vi.fn() }));
vi.mock("@/lib/realtime/authorize-room", () => ({
  authorizeRealtimeRoom: vi.fn(),
}));
vi.mock("@/lib/realtime/token", () => ({
  createRealtimeToken: vi.fn(),
  getRealtimeTokenSecret: vi.fn(),
}));

/** An unparsable body makes a request that passes the origin check answer 400. */
async function statusFor(headers: Record<string, string>) {
  const response = await POST(
    new Request("http://localhost:3000/api/realtime/token", {
      method: "POST",
      headers,
      body: "not json",
    })
  );
  return response.status;
}

describe("realtime token origin check", () => {
  it("rejects requests without origin, fetch-site or referer", async () => {
    expect(await statusFor({})).toBe(403);
  });

  it("accepts a matching origin", async () => {
    expect(await statusFor({ origin: "http://localhost:3000" })).toBe(400);
  });

  it("treats localhost and 127.0.0.1 as the same host", async () => {
    expect(await statusFor({ origin: "http://127.0.0.1:3000" })).toBe(400);
  });

  it("rejects a different port, protocol or host", async () => {
    expect(await statusFor({ origin: "http://localhost:4000" })).toBe(403);
    expect(await statusFor({ origin: "https://localhost:3000" })).toBe(403);
    expect(await statusFor({ origin: "http://evil.example:3000" })).toBe(403);
  });

  it("rejects an unparsable origin even with a same-origin fetch site", async () => {
    expect(
      await statusFor({ origin: "not a url", "sec-fetch-site": "same-origin" })
    ).toBe(403);
  });

  it("falls back to sec-fetch-site when the origin does not match", async () => {
    expect(
      await statusFor({
        origin: "http://evil.example:3000",
        "sec-fetch-site": "same-origin",
      })
    ).toBe(400);
  });

  it("falls back to the referer", async () => {
    expect(
      await statusFor({ referer: "http://localhost:3000/dashboard" })
    ).toBe(400);
    expect(
      await statusFor({ referer: "http://evil.example:3000/dashboard" })
    ).toBe(403);
    expect(await statusFor({ referer: "not a url" })).toBe(403);
  });
});
