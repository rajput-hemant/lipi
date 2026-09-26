import type { Subscription } from "@/types/db";

const CURRENT_STATUSES = new Set<Subscription["status"]>([
  "active",
  "trialing",
]);

function periodEndMs(subscription: Subscription): number {
  if (!subscription.currentPeriodEnd) return 0;
  return new Date(subscription.currentPeriodEnd).getTime();
}

export function pickCurrentSubscription(
  rows: Subscription[]
): Subscription | null {
  if (rows.length === 0) return null;

  const current = rows.filter((row) =>
    row.status ? CURRENT_STATUSES.has(row.status) : false
  );
  const candidates = current.length > 0 ? current : rows;

  return [...candidates].sort((a, b) => periodEndMs(b) - periodEndMs(a))[0]!;
}
