import { describe, expect, it } from "vitest";

describe("redirect base URL during SSR", () => {
  it("does not reference window when evaluated in Node", async () => {
    const { getRedirectBaseURL } = await import("./redirect-base-url");

    expect(() => getRedirectBaseURL()).not.toThrow();
    expect(getRedirectBaseURL()).toBeUndefined();
  });

  it("imports the login form module without throwing in Node", async () => {
    await expect(import("@/app/(auth)/components/login-form")).resolves.toBeDefined();
  });
});
