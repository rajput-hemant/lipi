import { hash } from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetPassword } from "./actions";

const mocks = vi.hoisted(() => ({
  findUser: vi.fn(),
  findCredentialAccount: vi.fn(),
  upsertCredentialPassword: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("./db", () => ({
  db: {
    query: { users: { findFirst: mocks.findUser } },
    update: () => ({ set: () => ({ where: vi.fn() }) }),
  },
}));
vi.mock("./auth/credential-account", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./auth/credential-account")>()),
  findCredentialAccount: mocks.findCredentialAccount,
  upsertCredentialPassword: mocks.upsertCredentialPassword,
}));

const input = {
  email: "a@example.com",
  password: "Current-pass1",
  newPassword: "Another-pass2",
};

describe("resetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findCredentialAccount.mockResolvedValue(undefined);
  });

  it("gives the same error for unknown email, social-only user and wrong password", async () => {
    mocks.findUser.mockResolvedValueOnce(undefined);
    const unknown = await resetPassword(input).catch((e: Error) => e.message);

    mocks.findUser.mockResolvedValueOnce({ id: "u1", password: null });
    const social = await resetPassword(input).catch((e: Error) => e.message);

    mocks.findUser.mockResolvedValueOnce({
      id: "u1",
      password: await hash("Different-pass3", 4),
    });
    const wrong = await resetPassword(input).catch((e: Error) => e.message);

    expect(new Set([unknown, social, wrong]).size).toBe(1);
    expect(unknown).toMatch(/incorrect/);
    expect(mocks.upsertCredentialPassword).not.toHaveBeenCalled();
  });

  it("rejects input that fails schema validation", async () => {
    await expect(
      resetPassword({ ...input, email: "not-an-email" })
    ).rejects.toThrow(/incorrect/);
    expect(mocks.findUser).not.toHaveBeenCalled();
  });

  it("updates the password when the current one matches", async () => {
    mocks.findUser.mockResolvedValueOnce({
      id: "u1",
      password: await hash(input.password, 4),
    });

    await expect(resetPassword(input)).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.upsertCredentialPassword).toHaveBeenCalledWith(
      "u1",
      expect.any(String)
    );
  });
});
