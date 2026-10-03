import type { MutationFailure, MutationResult } from "@/lib/db/mutation-result";

import { PlanQuotaError } from "@/lib/billing/errors";
import { DocumentOperationError } from "@/lib/db/document-operations";
import { MutationAuthError } from "./mutation-auth";

/** Maps an expected, user-presentable error to a typed failure. */
export function mutationFailure(error: unknown): MutationFailure | undefined {
  if (error instanceof PlanQuotaError) {
    return { ok: false, code: "QUOTA_EXCEEDED", message: error.message };
  }
  if (error instanceof DocumentOperationError) {
    return { ok: false, code: "INVALID", message: error.message };
  }
  if (error instanceof MutationAuthError) {
    if (error.code === "FORBIDDEN") {
      return {
        ok: false,
        code: "FORBIDDEN",
        message: "You do not have permission to do that.",
      };
    }
    if (error.code === "UNAUTHORIZED") {
      return {
        ok: false,
        code: "UNAUTHORIZED",
        message: "Sign in again to continue.",
      };
    }
    return { ok: false, code: error.code, message: error.message };
  }
}

/** Runs a mutation, returning expected failures as results and rethrowing the rest. */
export async function runMutation<T>(
  action: () => Promise<T>
): Promise<MutationResult<T>> {
  try {
    return { ok: true, data: await action() };
  } catch (error) {
    const failure = mutationFailure(error);
    if (failure) return failure;
    throw error;
  }
}
