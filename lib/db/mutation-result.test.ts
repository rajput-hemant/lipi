import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";

import {
  isMutationDenied,
  mutationErrorMessage,
  MutationFailureError,
  runMutationToast,
  unwrapMutation,
} from "./mutation-result";

vi.mock("sonner", () => ({ toast: { promise: vi.fn() } }));

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

describe("runMutationToast", () => {
  async function errorMessageFor(
    result: Parameters<typeof runMutationToast>[0],
    denied?: string
  ) {
    const onError = vi.fn();
    runMutationToast(result, {
      loading: "Working...",
      success: "Done",
      failed: "Failed",
      denied,
      onError,
    });
    const { error } = vi.mocked(toast.promise).mock.lastCall![1] as {
      error: (e: unknown) => string;
    };
    const rejection = await unwrapMutation(result).catch((e: unknown) => e);
    return { message: error(rejection), onError };
  }

  it("uses the denied text for a permission failure and rolls back", async () => {
    const { message, onError } = await errorMessageFor(
      Promise.resolve({ ok: false, code: "FORBIDDEN", message: "No." }),
      "Not allowed."
    );
    expect(message).toBe("Not allowed.");
    expect(onError).toHaveBeenCalledOnce();
  });

  it("uses the server message for other failures, else the fallback", async () => {
    expect(
      (
        await errorMessageFor(
          Promise.resolve({
            ok: false,
            code: "QUOTA_EXCEEDED",
            message: "Pro.",
          }),
          "Not allowed."
        )
      ).message
    ).toBe("Pro.");
    expect(
      (await errorMessageFor(Promise.reject(new Error("stripped")))).message
    ).toBe("Failed");
  });
});
