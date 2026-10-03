import { describe, expect, it } from "vitest";

import {
  isMutationDenied,
  MutationDeniedError,
  unwrapMutation,
} from "./mutation-result";

describe("unwrapMutation", () => {
  it("resolves with the data of a successful result", async () => {
    await expect(
      unwrapMutation(Promise.resolve({ ok: true, data: 3 }))
    ).resolves.toBe(3);
  });

  it("rejects with a denial error for a FORBIDDEN result", async () => {
    const error = await unwrapMutation(
      Promise.resolve({ ok: false, code: "FORBIDDEN" } as const)
    ).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(MutationDeniedError);
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
