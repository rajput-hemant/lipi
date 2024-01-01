import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { toast } from "sonner";

import { getCurrentUser } from "@/lib/auth";
import { getFolders, getUserSubscription } from "@/lib/db/queries";
import { SubscriptionModalProvider } from "@/components/subscription-modal-provider";
import { ResizableLayout } from "../components/resizable-layout";

type WorkspaceLayoutProps = React.PropsWithChildren<{
  params: { workspaceId: string };
}>;

export default async function WorkspaceLayout({
  params: { workspaceId },
  children,
}: WorkspaceLayoutProps) {
  const layout = cookies().get("react-resizable-panels:layout");
  const collapsed = cookies().get("react-resizable-panels:collapsed");

  const defaultLayout = layout ? JSON.parse(layout.value) : undefined;
  const defaultCollapsed = collapsed ? JSON.parse(collapsed.value) : undefined;

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: folders, error: foldersError },
    { data: subscription, error: _subscriptionError },
  ] = await Promise.all([
    getFolders(workspaceId),
    getUserSubscription(user.id),
  ]);

  if (foldersError || !folders) {
    toast.error("Something went wrong", {
      description: "Unable to fetch folders for this workspace.",
    });
  }

  // TODO: ...
  // if (subscriptionError || !subscription) {
  //   toast.error("Something went wrong", {
  //     description: "Unable to fetch your subscription status.",
  //   });
  // }

  return (
    <SubscriptionModalProvider subscription={subscription}>
      <ResizableLayout
        user={user}
        folders={folders!}
        defaultLayout={defaultLayout as number[]}
        defaultCollapsed={defaultCollapsed as boolean}
      >
        {children}
      </ResizableLayout>
    </SubscriptionModalProvider>
  );
}
