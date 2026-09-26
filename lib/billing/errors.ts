export class PlanQuotaError extends Error {
  readonly code: "workspace" | "collaborator" | "block";

  constructor(code: PlanQuotaError["code"], message?: string) {
    super(message ?? `Plan quota exceeded: ${code}`);
    this.name = "PlanQuotaError";
    this.code = code;
  }
}

export class BillingNotConfiguredError extends Error {
  constructor() {
    super("Stripe billing is not configured");
    this.name = "BillingNotConfiguredError";
  }
}
