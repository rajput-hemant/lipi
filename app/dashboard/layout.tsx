import { redirect } from "next/navigation";

import type { Metadata } from "next";
import type { PropsWithChildren } from "react";

import { SubscriptionModalProvider } from "@/components/subscription-modal-provider";
import { getCurrentUser } from "@/lib/auth";
import { hasConfiguredProEntitlement } from "@/lib/billing/entitlement";
import { getCurrentBillingSubscription } from "@/lib/billing/subscription-access";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your Lipi workspaces, documents, and collaboration.",
};

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  let subscription = null;
  let hasErrored = false;
  try {
    subscription = await getCurrentBillingSubscription(user.id);
  } catch {
    hasErrored = true;
  }
  const hasProEntitlement = hasConfiguredProEntitlement(subscription);

  return (
    <SubscriptionModalProvider
      subscription={subscription}
      hasProEntitlement={hasProEntitlement}
      hasErrored={hasErrored}
    >
      {children}
    </SubscriptionModalProvider>
  );
}
