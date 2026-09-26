import { describe, expect, it } from "vitest";

import {
  CREDENTIAL_PROVIDER_ID,
  resolveStoredPasswordHash,
} from "./credential-account";

describe("credential account helpers", () => {
  it("uses the credential account hash when present", () => {
    expect(resolveStoredPasswordHash("credential-hash", "legacy-hash")).toBe(
      "credential-hash",
    );
  });

  it("falls back to legacy user password when credential row is missing", () => {
    expect(resolveStoredPasswordHash(undefined, "legacy-hash")).toBe(
      "legacy-hash",
    );
  });

  it("targets the Better Auth credential provider id", () => {
    expect(CREDENTIAL_PROVIDER_ID).toBe("credential");
  });
});
