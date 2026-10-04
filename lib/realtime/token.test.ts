import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createRealtimeToken,
  getRealtimeTokenSecret,
  verifyRealtimeToken,
} from "./token";

const userId = "33333333-3333-4333-8333-333333333333";
const roomName = "document:22222222-2222-4222-8222-222222222222";
const secret = "unit-test-secret";
const now = Date.UTC(2026, 8, 27);

describe("realtime room token", () => {
  it("verifies a signed token only for its room", () => {
    const token = createRealtimeToken(
      { userId, roomName, name: "Collaborator", image: null },
      secret,
      now
    );

    expect(verifyRealtimeToken(token, roomName, secret, now)).toMatchObject({
      userId,
      roomName,
      name: "Collaborator",
    });
    expect(
      verifyRealtimeToken(
        token,
        "workspace:11111111-1111-4111-8111-111111111111",
        secret,
        now
      )
    ).toBeNull();
  });

  it("rejects altered and expired tokens", () => {
    const token = createRealtimeToken(
      { userId, roomName, name: "Collaborator", image: null },
      secret,
      now
    );

    expect(verifyRealtimeToken(`${token}x`, roomName, secret, now)).toBeNull();
    expect(
      verifyRealtimeToken(token, roomName, secret, now + 61_000)
    ).toBeNull();
  });
});

describe("getRealtimeTokenSecret", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses BETTER_AUTH_SECRET alone", () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "better-auth-secret");
    vi.stubEnv("AUTH_SECRET", "");

    expect(getRealtimeTokenSecret()).toBe("better-auth-secret");
  });

  it("ignores the legacy AUTH_SECRET name", () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    vi.stubEnv("AUTH_SECRET", "legacy-secret");
    vi.stubEnv("NODE_ENV", "production");

    expect(() => getRealtimeTokenSecret()).toThrow(/secret is missing/);
  });
});
