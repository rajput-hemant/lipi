import { describe, expect, it } from "vitest";

import {
  isMutationDenied,
  mutationErrorMessage,
  MutationFailureError,
  unwrapMutation,
} from "./mutation-result";

describe("unwrapMutation", () => {
  it("resolves with the data of a successful result", async () => {
    await expect(
      unwrapMutation(Promise.resolve({ ok: true, data: 3 }))
    ).resolves.toBe(3);
  });

  it("rejects with a typed error carrying the failure message", async () => {
    const error = await unwrapMutation(
      Promise.resolve({
        ok: false,
        code: "QUOTA_EXCEEDED",
        message: "Upgrade to Pro.",
      } as const)
    ).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(MutationFailureError);
    expect(error).toMatchObject({
      code: "QUOTA_EXCEEDED",
      message: "Upgrade to Pro.",
    });
    expect(isMutationDenied(error)).toBe(false);
  });

  it("marks a FORBIDDEN result as a denial", async () => {
    const error = await unwrapMutation(
      Promise.resolve({
        ok: false,
        code: "FORBIDDEN",
        message: "No.",
      } as const)
    ).catch((e: unknown) => e);

    expect(isMutationDenied(error)).toBe(true);
  });

  it("passes through thrown errors without marking them as denials", async () => {
    const failure = new Error("Failed to create document");
    const error = await unwrapMutation(Promise.reject(failure)).catch(
      (e: unknown) => e
    );

    expect(error).toBe(failure);
    expect(isMutationDenied(error)).toBe(false);
  });
});

describe("mutationErrorMessage", () => {
  it("uses the failure message, else the fallback", () => {
    expect(
      mutationErrorMessage(new MutationFailureError("INVALID", "Bad"), "Oops")
    ).toBe("Bad");
    expect(mutationErrorMessage(new Error("stripped"), "Oops")).toBe("Oops");
  });
});
