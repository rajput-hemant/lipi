import { describe, expect, it } from "vitest";

import { errorMessage } from "./error-message";

describe("errorMessage", () => {
  it("returns the message of an Error", () => {
    expect(errorMessage(new Error("boom"))).toBe("boom");
  });

  it("stringifies other thrown values", () => {
    expect(errorMessage("nope")).toBe("nope");
    expect(errorMessage(undefined)).toBe("undefined");
  });
});
