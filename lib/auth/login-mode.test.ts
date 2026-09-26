import { describe, expect, it } from "vitest";

import { loginSchema } from "@/lib/validations";

describe("login mode discriminator", () => {
  it("accepts username mode when type is username", () => {
    const parsed = loginSchema.safeParse({
      type: "username",
      username: "valid_user",
      password: "Hunter2!",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects username values when type remains email", () => {
    const parsed = loginSchema.safeParse({
      type: "email",
      username: "valid_user",
      password: "Hunter2!",
    });

    expect(parsed.success).toBe(false);
  });
});
