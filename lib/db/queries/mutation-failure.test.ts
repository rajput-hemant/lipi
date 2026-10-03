import { describe, expect, it, vi } from "vitest";

import { PlanQuotaError } from "@/lib/billing/errors";
import { DocumentOperationError } from "@/lib/db/document-operations";
import { MutationAuthError } from "./mutation-auth";
import { mutationFailure, runMutation } from "./mutation-failure";

vi.mock("..", () => ({ db: {} }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));

describe("mutationFailure", () => {
  it("maps plan quota errors to QUOTA_EXCEEDED with their message", () => {
    expect(
      mutationFailure(new PlanQuotaError("workspace", "Upgrade."))
    ).toEqual({ ok: false, code: "QUOTA_EXCEEDED", message: "Upgrade." });
  });

  it("maps document operation errors to INVALID", () => {
    expect(
      mutationFailure(new DocumentOperationError("Root page limit reached"))
    ).toEqual({
      ok: false,
      code: "INVALID",
      message: "Root page limit reached",
    });
  });

  it("uses fixed messages for permission and session errors", () => {
    expect(
      mutationFailure(new MutationAuthError("Forbidden", "FORBIDDEN"))
    ).toMatchObject({
      code: "FORBIDDEN",
      message: "You do not have permission to do that.",
    });
    expect(
      mutationFailure(new MutationAuthError("Unauthorized", "UNAUTHORIZED"))
    ).toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("keeps the message of validation errors", () => {
    expect(
      mutationFailure(new MutationAuthError("Collaborator not found"))
    ).toEqual({
      ok: false,
      code: "INVALID",
      message: "Collaborator not found",
    });
  });

  it("ignores unexpected errors", () => {
    expect(mutationFailure(new Error("db down"))).toBeUndefined();
  });
});

describe("runMutation", () => {
  it("wraps a successful result", async () => {
    await expect(runMutation(async () => 5)).resolves.toEqual({
      ok: true,
      data: 5,
    });
  });

  it("returns known failures and rethrows the rest", async () => {
    await expect(
      runMutation(async () => {
        throw new MutationAuthError("Forbidden", "FORBIDDEN");
      })
    ).resolves.toMatchObject({ ok: false, code: "FORBIDDEN" });

    await expect(
      runMutation(async () => {
        throw new Error("db down");
      })
    ).rejects.toThrow("db down");
  });
});
