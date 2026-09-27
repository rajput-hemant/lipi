import { describe, expect, it } from "vitest";

import { createRealtimeToken, verifyRealtimeToken } from "./token";

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
