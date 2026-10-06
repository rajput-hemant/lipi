import { toast } from "sonner";

export type MutationErrorCode =
  "FORBIDDEN" | "UNAUTHORIZED" | "INVALID" | "QUOTA_EXCEEDED";

export type MutationFailure = {
  ok: false;
  code: MutationErrorCode;
  /** Safe to show to the user as is. */
  message: string;
};

/**
 * Server actions return this for expected failures (permission, quota,
 * validation) instead of throwing: production strips thrown messages, so the
 * client could not tell them apart.
 */
export type MutationResult<T> = { ok: true; data: T } | MutationFailure;

export class MutationFailureError extends Error {
  constructor(
    readonly code: MutationErrorCode,
    message: string
  ) {
    super(message);
    this.name = "MutationFailureError";
  }
}

/** Unwraps a result so a failure rejects, keeping `toast.promise` flows intact. */
export async function unwrapMutation<T>(
  pending: Promise<MutationResult<T>>
): Promise<T> {
  const result = await pending;
  if (!result.ok) throw new MutationFailureError(result.code, result.message);
  return result.data;
}

export function isMutationDenied(error: unknown) {
  return error instanceof MutationFailureError && error.code === "FORBIDDEN";
}

export function isMutationQuotaExceeded(error: unknown) {
  return (
    error instanceof MutationFailureError && error.code === "QUOTA_EXCEEDED"
  );
}

/** The server's user-facing message for a failed result, else `fallback`. */
export function mutationErrorMessage(error: unknown, fallback: string) {
  return error instanceof MutationFailureError ? error.message : fallback;
}

/**
 * Shows a loading/success/error toast for a server action result. `denied`
 * replaces the message of a permission failure; `onError` runs first with
 * the error so callers can roll back optimistic state.
 */
export function runMutationToast<T>(
  pending: Promise<MutationResult<T>>,
  options: {
    loading: string;
    success: string | ((data: T) => string);
    failed: string;
    denied?: string;
    onError?: (error: unknown) => void;
  }
) {
  return toast.promise(unwrapMutation(pending), {
    loading: options.loading,
    success: options.success,
    error: (error) => {
      options.onError?.(error);
      return options.denied && isMutationDenied(error) ?
          options.denied
        : mutationErrorMessage(error, options.failed);
    },
  });
}
