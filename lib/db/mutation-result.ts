export type MutationErrorCode = "FORBIDDEN" | "UNAUTHORIZED" | "INVALID";

/**
 * Server actions return this for permission failures instead of throwing:
 * production strips thrown messages, so the client could not tell them apart.
 */
export type MutationResult<T> =
  { ok: true; data: T } | { ok: false; code: "FORBIDDEN" };

export class MutationDeniedError extends Error {
  constructor(readonly code: "FORBIDDEN") {
    super(code);
    this.name = "MutationDeniedError";
  }
}

/** Unwraps a result so a denial rejects, keeping `toast.promise` flows intact. */
export async function unwrapMutation<T>(
  pending: Promise<MutationResult<T>>
): Promise<T> {
  const result = await pending;
  if (!result.ok) throw new MutationDeniedError(result.code);
  return result.data;
}

export function isMutationDenied(error: unknown) {
  return error instanceof MutationDeniedError;
}
