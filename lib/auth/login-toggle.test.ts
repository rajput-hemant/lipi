import { describe, expect, it } from "vitest";

import { buildLoginFormStateAfterToggle } from "./login-toggle";

describe("buildLoginFormStateAfterToggle", () => {
  it("switches the discriminator to username when leaving email mode", () => {
    expect(buildLoginFormStateAfterToggle(true, "secret")).toEqual({
      type: "username",
      username: "",
      password: "secret",
    });
  });

  it("switches the discriminator to email when leaving username mode", () => {
    expect(buildLoginFormStateAfterToggle(false, "secret")).toEqual({
      type: "email",
      email: "",
      password: "secret",
    });
  });
});
