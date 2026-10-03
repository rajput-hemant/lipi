import { afterEach, describe, expect, it, vi } from "vitest";

import { isEnvValidationSkipped } from "./env-flags";

describe("isEnvValidationSkipped", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is true only for the exact string true", () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", "true");
    expect(isEnvValidationSkipped()).toBe(true);
  });

  it.each(["false", "0", "1", ""])("is false for %j", (value) => {
    vi.stubEnv("SKIP_ENV_VALIDATION", value);
    expect(isEnvValidationSkipped()).toBe(false);
  });

  it("is false when unset", () => {
    vi.stubEnv("SKIP_ENV_VALIDATION", undefined);
    expect(isEnvValidationSkipped()).toBe(false);
  });
});
