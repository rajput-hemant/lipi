import type { PropsWithChildren } from "react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { getUserSubscription } from "@/lib/db/queries";
import { SubscriptionModalProvider } from "@/components/subscription-modal-provider";

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const { data, error } = await getUserSubscription(user.id);

  return (
    <SubscriptionModalProvider subscription={data} hasErrored={!!error}>
      {children}
    </SubscriptionModalProvider>
  );
}
