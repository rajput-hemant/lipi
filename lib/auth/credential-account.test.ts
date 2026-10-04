import { describe, expect, it } from "vitest";

import { CREDENTIAL_PROVIDER_ID } from "./credential-account";

describe("credential account helpers", () => {
  it("targets the Better Auth credential provider id", () => {
    expect(CREDENTIAL_PROVIDER_ID).toBe("credential");
  });
});
