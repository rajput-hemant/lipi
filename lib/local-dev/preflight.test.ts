import { describe, expect, it } from "vitest";

import { sharedAuthBaselineProblem } from "./preflight";

describe("sharedAuthBaselineProblem", () => {
  it("passes once Infinitunes created the shared auth tables", () => {
    expect(
      sharedAuthBaselineProblem({ user: true, betterAuthAccount: true })
    ).toBeNull();
  });

  it("tells the user to run the Infinitunes migration first", () => {
    for (const present of [
      { user: false, betterAuthAccount: false },
      { user: true, betterAuthAccount: false },
    ]) {
      expect(sharedAuthBaselineProblem(present)).toMatch(/Infinitunes.*first/);
    }
  });
});
