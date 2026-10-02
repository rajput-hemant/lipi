import { assertUserCanAddCollaborator } from "@/lib/billing/enforce-quotas";
import { PlanQuotaError } from "@/lib/billing/errors";
import { MutationAuthError } from "./mutation-auth";

export async function ensureOwnerCollaboratorQuota(ownerId: string) {
  try {
    await assertUserCanAddCollaborator(ownerId);
  } catch (error) {
    if (error instanceof PlanQuotaError) {
      throw new MutationAuthError(error.message);
    }
    throw error;
  }
}
